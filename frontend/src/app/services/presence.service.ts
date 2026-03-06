import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, debounceTime, fromEvent, merge, takeUntil } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../environments/environment';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class PresenceService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly destroy$ = new Subject<void>();

  readonly onlineUsers$ = new BehaviorSubject<User[]>([]);
  readonly userJoined$ = new Subject<User>();

  connect(userId: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(environment.socketUrl, {
      transports: ['websocket'],
      auth: { userId }
    });

    this.socket.on('connect', () => {
      this.socket?.emit('user:join', { userId });
    });

    this.socket.on('presence:update', (users: User[]) => {
      const prevIds = new Set(this.onlineUsers$.value.map((u) => u.id));
      this.onlineUsers$.next(users);
      users.filter((u) => !prevIds.has(u.id)).forEach((u) => this.userJoined$.next(u));
    });

    this.setupIdleDetection();
  }

  disconnect(): void {
    if (!this.socket) {
      return;
    }

    this.socket.emit('user:leave');
    this.socket.disconnect();
    this.socket = null;
  }

  getOnlineUsers(): Observable<User[]> {
    return this.onlineUsers$.asObservable();
  }

  setStatus(status: 'online' | 'idle' | 'offline'): void {
    this.socket?.emit('user:status', { status });
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupIdleDetection(): void {
    merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'click'),
      fromEvent(document, 'scroll')
    )
      .pipe(debounceTime(1000), takeUntil(this.destroy$))
      .subscribe(() => this.setStatus('online'));

    merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'click'),
      fromEvent(document, 'scroll')
    )
      .pipe(debounceTime(5 * 60 * 1000), takeUntil(this.destroy$))
      .subscribe(() => this.setStatus('idle'));
  }
}
