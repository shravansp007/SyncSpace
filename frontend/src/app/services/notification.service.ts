import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Notification } from '../models';
import { PresenceService } from './presence.service';
import { ChatService } from './chat.service';
import { MeetingService } from './meeting.service';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  readonly notifications$ = new BehaviorSubject<Notification[]>([]);

  constructor(
    private readonly presenceService: PresenceService,
    private readonly chatService: ChatService,
    private readonly meetingService: MeetingService
  ) {
    this.bindSocketNotifications();
  }

  get unreadCount(): number {
    return this.notifications$.value.filter((n) => !n.read).length;
  }

  addNotification(n: Notification): void {
    this.notifications$.next([n, ...this.notifications$.value].slice(0, 200));
  }

  markRead(id: string): void {
    this.notifications$.next(this.notifications$.value.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  clearAll(): void {
    this.notifications$.next([]);
  }

  markAllRead(): void {
    this.notifications$.next(this.notifications$.value.map((n) => ({ ...n, read: true })));
  }

  ngOnDestroy(): void {
    // Socket listeners are managed by underlying services.
  }

  private bindSocketNotifications(): void {
    this.chatService.messageEvents$.subscribe((msg) => {
      this.addNotification({
        id: crypto.randomUUID(),
        type: 'info',
        title: `New message from ${msg.senderName}`,
        body: msg.content,
        read: false,
        timestamp: new Date().toISOString()
      });
    });

    this.meetingService.meetingStarted$.subscribe((meeting) => {
      this.addNotification({
        id: crypto.randomUUID(),
        type: 'success',
        title: `Meeting started: ${meeting.name}`,
        body: 'Join now from the meetings page.',
        read: false,
        timestamp: new Date().toISOString()
      });
    });

    this.presenceService.userJoined$.subscribe((user) => {
      this.addNotification({
        id: crypto.randomUUID(),
        type: 'info',
        title: `${user.name} is now online`,
        body: user.email,
        read: false,
        timestamp: new Date().toISOString()
      });
    });
  }
}
