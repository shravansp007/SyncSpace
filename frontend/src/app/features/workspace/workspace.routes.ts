import { Routes } from '@angular/router';
import { WorkspaceLayoutComponent } from './layout/workspace-layout.component';

export const WORKSPACE_ROUTES: Routes = [
  {
    path: '',
    component: WorkspaceLayoutComponent,
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
        path: 'members',
        loadComponent: () =>
          import('./members/members.component').then((m) => m.MembersComponent)
      }
    ]
  }
];
