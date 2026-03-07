import { CommonModule, KeyValuePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { WebrtcVideoService } from '../../../core/services/webrtc-video.service';
import { MediaStreamDirective } from '../../../shared/directives/media-stream.directive';

@Component({
  selector: 'app-video-call-page',
  standalone: true,
  imports: [CommonModule, RouterLink, KeyValuePipe, MediaStreamDirective],
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.scss']
})
export class VideoCallComponent implements OnInit, OnDestroy {
  meetingId = '';
  localStream: MediaStream | null = null;
  remoteStreams: Record<string, MediaStream> = {};
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly webrtcService: WebrtcVideoService
  ) {}

  async ngOnInit(): Promise<void> {
    this.meetingId = this.route.snapshot.paramMap.get('meetingId') ?? '';
    const user = this.readUser();

    await this.webrtcService.init(this.meetingId, user.email);
    this.webrtcService.localStream$
      .pipe(takeUntil(this.destroy$))
      .subscribe((stream) => this.localStream = stream);
    this.webrtcService.remoteStreams$
      .pipe(takeUntil(this.destroy$))
      .subscribe((streams) => {
        this.remoteStreams = Object.fromEntries(streams.entries());
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.webrtcService.disconnect();
  }

  trackByPeer(index: number, item: { key: string; value: MediaStream }): string {
    return item.key;
  }

  private readUser(): { email: string } {
    const raw = localStorage.getItem('auth_user');
    if (!raw) {
      return { email: 'guest@local' };
    }
    try {
      const parsed = JSON.parse(raw) as { email?: string };
      return { email: parsed.email ?? 'guest@local' };
    } catch {
      return { email: 'guest@local' };
    }
  }
}
