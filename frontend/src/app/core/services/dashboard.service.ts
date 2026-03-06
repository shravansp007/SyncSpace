import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, catchError, combineLatest, map, of, switchMap, takeUntil, tap, timer } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DashboardStats, DashboardViewModel, SystemHealth } from '../models/dashboard.model';
import { ChatApiService } from './chat-api.service';
import { ChatRealtimeService } from './chat-realtime.service';
import { CollaborationSocketService } from './collaboration-socket.service';
import { MeetingRoomService } from './meeting-room.service';
import { NotificationService } from './notification.service';
import { PresenceService } from './presence.service';

const initialHealth: SystemHealth = {
  api: 'degraded',
  websocket: 'disconnected',
  database: 'unknown',
  checkedAt: new Date(0).toISOString(),
  latencyMs: null
};

const initialStats: DashboardStats = {
  activeUsers: 0,
  ongoingMeetings: 0,
  chatMessages: 0
};

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly destroy$ = new Subject<void>();

  private readonly statsSubject = new BehaviorSubject<DashboardStats>(initialStats);
  private readonly healthSubject = new BehaviorSubject<SystemHealth>(initialHealth);

  readonly stats$ = this.statsSubject.asObservable();
  readonly health$ = this.healthSubject.asObservable();
  readonly vm$ = combineLatest([this.stats$, this.health$]).pipe(
    map(([stats, health]) => ({ stats, health } as DashboardViewModel))
  );

  constructor(
    private readonly http: HttpClient,
    private readonly presenceService: PresenceService,
    private readonly chatApi: ChatApiService,
    private readonly chatRealtime: ChatRealtimeService,
    private readonly collaborationSocket: CollaborationSocketService,
    private readonly meetingRooms: MeetingRoomService,
    private readonly notifications: NotificationService
  ) {
    this.collaborationSocket.connect();
    this.trackStats();
    this.trackHealth();
  }

  private trackStats(): void {
    timer(0, 6000)
      .pipe(
        switchMap(() =>
          combineLatest([
            this.presenceService.activeMembers$,
            this.chatApi.getHistory('general', 200).pipe(catchError(() => of([]))),
            this.meetingRooms.rooms$
          ]).pipe(
            map(([activeMembers, messages, rooms]) => ({
              activeUsers: activeMembers.length,
              ongoingMeetings: rooms.filter((room) => room.participants.length > 0).length,
              chatMessages: messages.length
            }))
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((stats) => this.statsSubject.next(stats));
  }

  private trackHealth(): void {
    combineLatest([this.chatRealtime.connected$, this.collaborationSocket.connected$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([stompConnected, socketConnected]) => {
        const connected = stompConnected || socketConnected;
        this.healthSubject.next({
          ...this.healthSubject.value,
          websocket: connected ? 'connected' : 'disconnected'
        });
      });

    timer(0, 7000)
      .pipe(
        switchMap(() => {
          const startedAt = performance.now();

          return this.http.get(`${environment.apiBaseUrl}/`, { responseType: 'text' }).pipe(
            map(() => {
              const latencyMs = Math.round(performance.now() - startedAt);
              return {
                api: 'healthy' as const,
                websocket: this.healthSubject.value.websocket,
                database: 'connected' as const,
                checkedAt: new Date().toISOString(),
                latencyMs
              };
            }),
            catchError(() =>
              of({
                api: 'degraded' as const,
                websocket: this.healthSubject.value.websocket,
                database: 'unknown' as const,
                checkedAt: new Date().toISOString(),
                latencyMs: null
              })
            )
          );
        }),
        tap((health) => {
          if (health.api === 'degraded' && this.healthSubject.value.api !== 'degraded') {
            this.notifications.notifySystem('API health degraded. Retrying connectivity checks.');
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((health) => this.healthSubject.next(health));
  }
}
