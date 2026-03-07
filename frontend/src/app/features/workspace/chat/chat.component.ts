import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, map, of, switchMap, takeUntil } from 'rxjs';
import { ChatMessage, ChatService } from '../../../core/services/chat.service';
import { environment } from '../../../../environments/environment';
import { WebsocketService } from '../../../core/services/websocket.service';

interface PresenceUser {
  id: number;
  name: string;
  email: string;
  online: boolean;
  lastSeenAt: string | null;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chat.component.html'
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  draftMessage = '';
  loading = true;
  selectedUserEmail = '';
  selectedUserName = 'Select a member';
  selectedUserOnline = false;
  currentUserEmail = '';
  sendError = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly chatService: ChatService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly websocketService: WebsocketService
  ) {}

  ngOnInit(): void {
    this.currentUserEmail = this.readCurrentUserEmail();

    this.route.queryParamMap
      .pipe(
        map((params) => params.get('user')?.trim().toLowerCase() ?? ''),
        takeUntil(this.destroy$)
      )
      .subscribe((userEmail) => {
        this.selectedUserEmail = userEmail;
        if (!userEmail) {
          this.selectedUserName = 'Select a member';
          this.selectedUserOnline = false;
          this.messages = [];
          this.loading = false;
          return;
        }

        this.loading = true;
        this.loadSelectedUserMeta(userEmail);
        this.loadConversation();
      });

    this.chatService.receivePrivateMessages(this.currentUserEmail)
      .pipe(takeUntil(this.destroy$))
      .subscribe((message) => {
        if (!this.selectedUserEmail) {
          return;
        }

        const matchesSelected =
          (message.senderEmail.toLowerCase() === this.selectedUserEmail &&
            message.receiverEmail.toLowerCase() === this.currentUserEmail) ||
          (message.senderEmail.toLowerCase() === this.currentUserEmail &&
            message.receiverEmail.toLowerCase() === this.selectedUserEmail);

        if (matchesSelected) {
          this.pushIfMissing(message);
        }
      });

    this.websocketService.watch<{ email: string; event: string }>('/topic/active-users')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event.email?.toLowerCase() !== this.selectedUserEmail) {
          return;
        }
        this.selectedUserOnline = event.event === 'USER_ONLINE';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  sendMessage(): void {
    const content = this.draftMessage.trim();
    if (!content || !this.selectedUserEmail || !this.currentUserEmail) {
      return;
    }

    this.chatService.sendPrivateMessage(this.currentUserEmail, this.selectedUserEmail, content)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          this.pushIfMissing(message);
          this.draftMessage = '';
          this.sendError = '';
        },
        error: () => {
          this.sendError = 'Unable to send message.';
        }
      });
  }

  goToMembers(): void {
    this.router.navigate(['/workspace/members']);
  }

  private loadConversation(): void {
    this.chatService.loadConversationHistory(this.selectedUserEmail)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.messages = history;
          this.loading = false;
        },
        error: () => {
          this.messages = [];
          this.loading = false;
        }
      });
  }

  private loadSelectedUserMeta(userEmail: string): void {
    this.http.get<PresenceUser[]>(`${environment.apiBaseUrl}/api/users/presence`)
      .pipe(
        map((users) => users.find((user) => user.email.toLowerCase() === userEmail)),
        catchError(() => of(undefined)),
        switchMap((user) => {
          if (user) {
            this.selectedUserName = user.name;
            this.selectedUserOnline = user.online;
            return of(user);
          }

          return this.http.get<Array<{ name: string; email: string }>>(`${environment.apiBaseUrl}/api/users`).pipe(
            map((users) => users.find((item) => item.email.toLowerCase() === userEmail)),
            catchError(() => of(undefined))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((user) => {
        if (!user) {
          this.selectedUserName = userEmail;
          this.selectedUserOnline = false;
          return;
        }
        this.selectedUserName = user.name;
        if (!('online' in user)) {
          this.selectedUserOnline = false;
        }
      });
  }

  isMine(message: ChatMessage): boolean {
    return message.senderEmail.toLowerCase() === this.currentUserEmail;
  }

  private pushIfMissing(message: ChatMessage): void {
    if (this.messages.some((item) => item.id === message.id)) {
      return;
    }
    this.messages = [...this.messages, message];
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
