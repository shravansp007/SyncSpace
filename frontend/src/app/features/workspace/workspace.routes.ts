import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { WorkspaceLayoutComponent } from './layout/workspace-layout.component';

export const WORKSPACE_ROUTES: Routes = [
  {
    path: '',
    component: WorkspaceLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./chat/chat.component').then((m) => m.ChatComponent)
      },
      {
        path: 'meetings',
        loadComponent: () =>
          import('./meetings/meetings.component').then((m) => m.MeetingsComponent)
      },
      {
        path: 'meetings/create',
        loadComponent: () =>
          import('./meetings/create-meeting.component').then((m) => m.CreateMeetingComponent)
      },
      {
        path: 'meetings/join/:meetingId',
        loadComponent: () =>
          import('./meetings/video-call.component').then((m) => m.VideoCallComponent)
      },
      {
        path: 'meeting/:meetingId',
        loadComponent: () =>
          import('./meetings/video-call.component').then((m) => m.VideoCallComponent)
      },
      {
        path: 'members',
        loadComponent: () =>
          import('./members/members.component').then((m) => m.MembersComponent)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./settings/settings.component').then((m) => m.SettingsComponent)
      }
    ]
  }
];
