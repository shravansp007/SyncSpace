import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { DashboardService } from '../../../../core/services/dashboard.service';
import { PresenceService } from '../../../../core/services/presence.service';
import { fadeIn, springIn, staggerList } from '../../../../shared/animations/motion.animations';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonBlockComponent } from '../../../../shared/components/skeleton-block/skeleton-block.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { MATERIAL_IMPORTS } from '../../../../shared/material/material.imports';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, TitleCasePipe, EmptyStateComponent, SkeletonBlockComponent, StatCardComponent, ...MATERIAL_IMPORTS],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  animations: [fadeIn, springIn, staggerList],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  readonly vm = toSignal(this.dashboardService.vm$, {
    initialValue: {
      stats: {
        activeUsers: 0,
        ongoingMeetings: 0,
        chatMessages: 0
      },
      health: {
        api: 'degraded' as const,
        websocket: 'disconnected' as const,
        database: 'unknown' as const,
        checkedAt: new Date(0).toISOString(),
        latencyMs: null
      }
    }
  });

  readonly members = toSignal(this.presenceService.members$, { initialValue: [] });
  readonly membersLoading = toSignal(this.presenceService.loading$, { initialValue: true });

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly presenceService: PresenceService
  ) {}

  statusClass(status: 'online' | 'idle' | 'offline'): string {
    return `presence-dot ${status}`;
  }
}
