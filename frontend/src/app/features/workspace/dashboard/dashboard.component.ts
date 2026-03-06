import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StatCard { icon: string; label: string; value: number; trend: string; color: string; loading: boolean; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user = JSON.parse(localStorage.getItem('auth_user') || '{"name":"User"}');
  today = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  greeting = this.getGreeting();

  stats: StatCard[] = [
    { icon: '👥', label: 'Active Users',     value: 0, trend: '↑ 12%', color: '#6C63FF', loading: true },
    { icon: '📹', label: 'Ongoing Meetings', value: 0, trend: '↑ 3%',  color: '#00D4FF', loading: true },
    { icon: '💬', label: 'Messages Today',   value: 0, trend: '↑ 28%', color: '#10B981', loading: true },
    { icon: '✅', label: 'System Status',    value: 1, trend: 'Healthy', color: '#F59E0B', loading: true }
  ];

  activities = [
    { icon: '👤', text: 'Alice joined the workspace', time: '2 min ago' },
    { icon: '💬', text: 'Bob sent a message in #general', time: '5 min ago' },
    { icon: '📹', text: 'Team standup meeting started', time: '12 min ago' },
    { icon: '📁', text: 'Project files were updated', time: '1 hr ago' },
    { icon: '🔔', text: 'System check completed', time: '2 hr ago' }
  ];

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  ngOnInit() {
    setTimeout(() => {
      this.stats[0] = { ...this.stats[0], value: 24,  loading: false };
      this.stats[1] = { ...this.stats[1], value: 3,   loading: false };
      this.stats[2] = { ...this.stats[2], value: 142, loading: false };
      this.stats[3] = { ...this.stats[3], value: 1,   loading: false };
    }, 1200);
  }
}
