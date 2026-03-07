import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, forkJoin, of, Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { WebsocketService } from '../../../core/services/websocket.service';

interface Member {
  id: number;
  name: string;
  email: string;
  role?: string;
  status?: 'online' | 'offline' | 'idle';
}

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './members.component.html'
})
export class MembersComponent implements OnInit, OnDestroy {
  members: Member[] = [];
  selectedEmails = new Set<string>();
  loading = true;
  inviting = false;
  private readonly currentUserEmail = this.readCurrentUserEmail();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly http: HttpClient,
    private readonly websocketService: WebsocketService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadMembers();

    this.websocketService.watch('/topic/presence')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadMembers());

    this.websocketService.watch<{ email: string; event: string }>('/topic/active-users')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => this.updateStatus(event.email, event.event));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMembers(): void {
    this.http.get<Member[]>(`${environment.apiBaseUrl}/api/users`)
      .pipe(catchError(() => of([])))
      .subscribe((members) => {
        this.members = members.map((member) => ({
          ...member,
          role: member.role || 'MEMBER',
          status: member.status || 'offline'
        })).filter((member) => member.email.toLowerCase() !== this.currentUserEmail);
        this.loading = false;
      });
  }

  toggleSelection(email: string, checked: boolean): void {
    if (checked) {
      this.selectedEmails.add(email);
      return;
    }
    this.selectedEmails.delete(email);
  }

  openDirectChat(email: string): void {
    this.router.navigate(['/workspace/chat'], { queryParams: { user: email } });
  }

  inviteSelected(): void {
    if (this.selectedEmails.size === 0) {
      return;
    }

    this.inviting = true;
    const requests = [...this.selectedEmails].map((email) =>
      this.http.post(`${environment.apiBaseUrl}/api/invitations/send`, { email, role: 'MEMBER' })
    );

    forkJoin(requests).pipe(
      catchError(() => of([]))
    ).subscribe(() => {
      this.inviting = false;
      this.selectedEmails.clear();
    });
  }

  private updateStatus(email: string, event: string): void {
    const normalized = email?.toLowerCase();
    if (!normalized) {
      return;
    }

    this.members = this.members.map((member) => {
      if (member.email.toLowerCase() !== normalized) {
        return member;
      }
      return {
        ...member,
        status: event === 'USER_ONLINE' ? 'online' : 'offline'
      };
    });
  }

  private readCurrentUserEmail(): string {
    const raw = localStorage.getItem('auth_user');
    if (!raw) {
      return '';
    }
    try {
      const parsed = JSON.parse(raw) as { email?: string };
      return (parsed.email ?? '').toLowerCase();
    } catch {
      return '';
    }
  }
}
