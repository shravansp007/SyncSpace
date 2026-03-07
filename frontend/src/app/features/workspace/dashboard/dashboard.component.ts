import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, forkJoin, map, of, Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { WebsocketService } from '../../../core/services/websocket.service';

interface ActivityItem {
  message: string;
  createdAt?: string;
}

interface StatCard {
  icon: string;
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  user = this.readUser();
  today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  greeting = this.getGreeting();

  loading = true;
  activities: ActivityItem[] = [];

  stats: StatCard[] = [
    { icon: 'USERS', label: 'Active Users', value: 0, color: '#6C63FF' },
    { icon: 'MEET', label: 'Ongoing Meetings', value: 0, color: '#00D4FF' },
    { icon: 'CHAT', label: 'Messages Today', value: 0, color: '#10B981' }
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly websocketService: WebsocketService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.bindRealtimeUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isWorkspaceEmpty(): boolean {
    return this.stats.every((item) => item.value === 0) && this.activities.length === 0;
  }

  startMeeting(): void {
    this.router.navigate(['/workspace/meetings/create']);
  }

  openChat(): void {
    this.router.navigate(['/workspace/chat']);
  }

  inviteMembers(): void {
    this.router.navigate(['/workspace/members']);
  }

  private loadDashboard(): void {
    const usersCount$ = this.http.get<number | { count?: number }>(`${environment.apiBaseUrl}/api/users/count`).pipe(
      map((response) => this.parseCount(response)),
      catchError(() => of(0))
    );

    const meetingsCount$ = this.http.get<number | { count?: number }>(`${environment.apiBaseUrl}/api/meetings/active`).pipe(
      map((response) => this.parseCount(response)),
      catchError(() => of(0))
    );

    const messagesCount$ = this.http.get<number | { count?: number }>(`${environment.apiBaseUrl}/api/messages/today`).pipe(
      map((response) => this.parseCount(response)),
      catchError(() => of(0))
    );

    const activities$ = this.http.get<ActivityItem[]>(`${environment.apiBaseUrl}/api/activity/recent`).pipe(
      catchError(() => of([]))
    );

    forkJoin([usersCount$, meetingsCount$, messagesCount$, activities$]).subscribe({
      next: ([usersCount, meetingsCount, messagesCount, activities]) => {
        this.stats = [
          { ...this.stats[0], value: usersCount },
          { ...this.stats[1], value: meetingsCount },
          { ...this.stats[2], value: messagesCount }
        ];
        this.activities = activities ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private bindRealtimeUpdates(): void {
    this.websocketService.watch('/topic/messages')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadDashboard());

    this.websocketService.watch('/topic/presence')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadDashboard());

    this.websocketService.watch('/topic/meetings')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadDashboard());
  }

  private parseCount(response: number | { count?: number }): number {
    if (typeof response === 'number') {
      return response;
    }
    return response?.count ?? 0;
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  private readUser(): { name: string } {
    const raw = localStorage.getItem('auth_user');
    if (!raw) {
      return { name: 'User' };
    }

    try {
      const parsed = JSON.parse(raw);
      return { name: parsed?.name || 'User' };
    } catch {
      localStorage.removeItem('auth_user');
      return { name: 'User' };
    }
  }
}

