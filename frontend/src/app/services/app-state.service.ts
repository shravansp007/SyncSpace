import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  readonly sidebarCollapsed$ = new BehaviorSubject<boolean>(false);
  readonly activeRoute$ = new BehaviorSubject<string>('/dashboard');

  setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsed$.next(collapsed);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed$.next(!this.sidebarCollapsed$.value);
  }

  setActiveRoute(route: string): void {
    this.activeRoute$.next(route);
  }
}
