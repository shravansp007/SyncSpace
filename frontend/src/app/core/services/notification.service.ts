import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

import { AppNotification, NotificationType } from '../models/notification.model';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly subject = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$ = this.subject.asObservable();
  readonly unreadCount$ = this.notifications$.pipe(map((items) => items.filter((item) => !item.read).length));

  constructor(private readonly toast: ToastService) {}

  add(type: NotificationType, title: string, message: string): void {
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.subject.next([notification, ...this.subject.value].slice(0, 100));
    this.toast.success(`${title}: ${message}`);
  }

  notifyMessage(sender: string, roomId: string, content: string): void {
    this.add('message', 'New message', `${sender} in #${roomId}: ${content.slice(0, 80)}`);
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
}

