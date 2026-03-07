import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NotificationComponent } from '../notification/notification.component';

interface NavItem { icon: string; label: string; route: string; }

@Component({
  selector: 'app-workspace-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NotificationComponent],
  templateUrl: './workspace-layout.component.html',
  styleUrls: ['./workspace-layout.component.scss']
})
export class WorkspaceLayoutComponent {
  sidebarOpen = signal(true);
  mobileOpen = signal(false);

  navItems: NavItem[] = [
    { icon: 'DB', label: 'Dashboard', route: '/workspace/dashboard' },
    { icon: 'CH', label: 'Chat',      route: '/workspace/chat'      },
    { icon: 'MT', label: 'Meetings',  route: '/workspace/meetings'  },
    { icon: 'MB', label: 'Members',   route: '/workspace/members'   },
    { icon: 'ST', label: 'Settings',  route: '/workspace/settings'  }
  ];

  user = this.readUser();

  constructor(private router: Router) {}

  logout() {
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  private readUser(): { name: string; email: string; role?: string } {
    const raw = localStorage.getItem('auth_user');
    if (!raw) {
      return { name: 'User', email: '' };
    }

    try {
      const parsed = JSON.parse(raw);
      return {
        name: parsed?.name || 'User',
        email: parsed?.email || '',
        role: parsed?.role
      };
    } catch {
      localStorage.removeItem('auth_user');
      return { name: 'User', email: '' };
    }
  }
}
