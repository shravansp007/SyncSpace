import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';

interface NavItem { icon: string; label: string; route: string; }

@Component({
  selector: 'app-workspace-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './workspace-layout.component.html',
  styleUrls: ['./workspace-layout.component.scss']
})
export class WorkspaceLayoutComponent {
  sidebarOpen = signal(true);
  mobileOpen = signal(false);

  navItems: NavItem[] = [
    { icon: '⊞', label: 'Dashboard', route: '/workspace/dashboard' },
    { icon: '💬', label: 'Chat',      route: '/workspace/chat'      },
    { icon: '📹', label: 'Meetings',  route: '/workspace/meetings'  },
    { icon: '👥', label: 'Members',   route: '/workspace/members'   },
    { icon: '⚙️', label: 'Settings',  route: '/workspace/settings'  }
  ];

  user = JSON.parse(localStorage.getItem('auth_user') || '{"name":"User","email":""}');

  constructor(private router: Router) {}

  logout() {
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
