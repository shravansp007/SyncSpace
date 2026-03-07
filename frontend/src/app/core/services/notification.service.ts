import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

import { AppNotification, NotificationType } from '../models/notification.model';
import { ToastService } from './toast.service';
import { WebsocketService } from './websocket.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly subject = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$ = this.subject.asObservable();
  readonly unreadCount$ = this.notifications$.pipe(map((items) => items.filter((item) => !item.read).length));

  constructor(
    private readonly toast: ToastService,
    private readonly websocketService: WebsocketService
  ) {
    this.websocketService.watch<{ type: string; [key: string]: unknown }>('/user/queue/notifications')
      .subscribe((event) => this.handleSocketNotification(event));
    this.websocketService.watch<{ type: string; meetingId: number; invitedBy: string }>('/user/queue/invitations')
      .subscribe((invite) => {
        this.add(
          'meeting',
          'Meeting invite',
          `${invite.invitedBy} invited you to meeting #${invite.meetingId}`,
          `/workspace/meeting/${invite.meetingId}`,
          { meetingId: invite.meetingId, invitedBy: invite.invitedBy }
        );
      });
  }

  add(
    type: NotificationType,
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: Record<string, string | number | boolean | null>
  ): void {
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl,
      metadata
    };

    this.subject.next([notification, ...this.subject.value].slice(0, 100));
    this.toast.success(`${title}: ${message}`);
  }

  notifyMessage(sender: string, roomId: string, content: string): void {
    this.add('message', 'New message', `${sender} in #${roomId}: ${content.slice(0, 80)}`);
  }

  notifyDirectMessage(sender: string, content: string): void {
    this.add(
      'message',
      'New direct message',
      `${sender}: ${content.slice(0, 80)}`,
      `/workspace/chat?user=${encodeURIComponent(sender)}`,
      { user: sender }
    );
  }

  notifyMeetingJoin(user: string, roomName: string): void {
    this.add('meeting', 'User joined meeting', `${user} joined ${roomName}`);
  }

  notifyCallStarted(roomName: string): void {
    this.add('call', 'Call started', `Live call started in ${roomName}`);
  }

  notifySystem(message: string): void {
    this.add('system', 'System status', message);
  }

  markAllAsRead(): void {
    this.subject.next(this.subject.value.map((item) => ({ ...item, read: true })));
  }

  markAsRead(id: string): void {
    this.subject.next(this.subject.value.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }

  private handleSocketNotification(event: { type: string; [key: string]: unknown }): void {
    if (event.type === 'CHAT_MESSAGE') {
      const sender = String(event['senderEmail'] ?? '');
      const content = String(event['content'] ?? '');
      this.notifyDirectMessage(sender, content);
      return;
    }

    if (event.type === 'MEETING_STARTED') {
      const meetingId = Number(event['meetingId'] ?? -1);
      this.add(
        'call',
        'Meeting started',
        `Meeting #${meetingId} is live now.`,
        meetingId > 0 ? `/workspace/meeting/${meetingId}` : undefined,
        { meetingId }
      );
      return;
    }

    if (event.type === 'MEETING_INVITE') {
      const meetingId = Number(event['meetingId'] ?? -1);
      const invitedBy = String(event['invitedBy'] ?? 'A teammate');
      this.add(
        'meeting',
        'Meeting invite',
        `${invitedBy} invited you to a meeting.`,
        meetingId > 0 ? `/workspace/meeting/${meetingId}` : undefined,
        { meetingId, invitedBy }
      );
    }
  }
}
