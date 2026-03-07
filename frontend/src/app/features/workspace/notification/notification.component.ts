import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';

import { AppNotification } from '../../../core/models/notification.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent {
  open = false;
  notifications: AppNotification[] = [];
  unreadCount = 0;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly router: Router
  ) {
    this.notificationService.notifications$.subscribe((items) => {
      this.notifications = items;
    });
    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });
  }

  toggle(): void {
    this.open = !this.open;
  }

  openNotification(notification: AppNotification): void {
    this.notificationService.markAsRead(notification.id);
    this.open = false;
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  markAllRead(event: Event): void {
    event.stopPropagation();
    this.notificationService.markAllAsRead();
    this.notificationService.notifications$.pipe(take(1)).subscribe((items) => {
      this.notifications = items.map((item) => ({ ...item, read: true }));
    });
  }
}
