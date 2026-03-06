import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { startWith } from 'rxjs/operators';

import { NavigationItem } from '../../core/models/navigation.model';
import { AppNotification, NotificationType } from '../../core/models/notification.model';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';
import { UiStateService } from '../../core/services/ui-state.service';
import { MATERIAL_IMPORTS } from '../../shared/material/material.imports';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, RouterLinkActive, RouterOutlet, ...MATERIAL_IMPORTS],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        query(':enter, :leave', [style({ position: 'absolute', width: '100%' })], { optional: true }),
        group([
          query(':leave', [animate('220ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, transform: 'translateY(10px) scale(0.99)' }))], { optional: true }),
          query(':enter', [
            style({ opacity: 0, transform: 'translateY(12px) scale(0.985)' }),
            animate('460ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
          ], { optional: true })
        ])
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent {
  readonly searchControl = new FormControl<string>('', { nonNullable: true });

  readonly navItems: NavigationItem[] = [
    { label: 'Dashboard', icon: 'space_dashboard', route: '/workspace/dashboard' },
    { label: 'Chat', icon: 'chat', route: '/workspace/chat' },
    { label: 'Calls', icon: 'videocam', route: '/workspace/calls' },
    { label: 'Profile', icon: 'manage_accounts', route: '/workspace/profile' }
  ];

  readonly uiState = toSignal(this.uiStateService.state$, {
    initialValue: { sidebarCollapsed: false, searchQuery: '' }
  });

  readonly mode = toSignal(this.themeService.mode$, { initialValue: 'dark' as const });
  readonly notifications = toSignal(this.notificationService.notifications$, { initialValue: [] });
  readonly unreadCount = toSignal(this.notificationService.unreadCount$, { initialValue: 0 });
  readonly authState = toSignal(this.authService.authState$, {
    initialValue: { status: 'anonymous' as const, session: null, error: null }
  });

  readonly sidebarCollapsed = computed(() => this.uiState().sidebarCollapsed);
  readonly userName = computed(() => this.authState().session?.user.name ?? 'User');
  readonly userEmail = computed(() => this.authState().session?.user.email ?? '');

  constructor(
    private readonly authService: AuthService,
    private readonly uiStateService: UiStateService,
    private readonly themeService: ThemeService,
    private readonly notificationService: NotificationService
  ) {
    this.searchControl.valueChanges
      .pipe(startWith(''), takeUntilDestroyed())
      .subscribe((query) => {
        this.uiStateService.setSearchQuery(query);
      });
  }

  toggleSidebar(): void {
    this.uiStateService.toggleSidebar();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  logout(): void {
    this.authService.logout();
  }

  markNotificationsRead(): void {
    this.notificationService.markAllAsRead();
  }

  markNotificationRead(id: string): void {
    this.notificationService.markAsRead(id);
  }

  notificationIcon(type: NotificationType): string {
    switch (type) {
      case 'message':
        return 'chat';
      case 'meeting':
        return 'groups';
      case 'call':
        return 'phone_in_talk';
      default:
        return 'info';
    }
  }

  notificationClass(notification: AppNotification): string {
    return `notification-item ${notification.type}${notification.read ? ' read' : ''}`;
  }

  routeAnimationData(outlet: RouterOutlet): string {
    return outlet?.activatedRouteData?.['animation'] as string;
  }
}

