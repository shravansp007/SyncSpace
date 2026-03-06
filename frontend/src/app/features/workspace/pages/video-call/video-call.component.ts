import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { ToastService } from '../../../../core/services/toast.service';
import { VideoCallService } from '../../../../core/services/video-call.service';
import { springIn, staggerList } from '../../../../shared/animations/motion.animations';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { MATERIAL_IMPORTS } from '../../../../shared/material/material.imports';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, EmptyStateComponent, ...MATERIAL_IMPORTS],
  templateUrl: './video-call.component.html',
  styleUrl: './video-call.component.scss',
  animations: [springIn, staggerList],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoCallComponent {
  readonly state$ = this.callService.state$;
  readonly rooms = toSignal(this.callService.rooms$, { initialValue: [] });

  readonly roomForm = this.formBuilder.nonNullable.group({
    roomName: ['', [Validators.required, Validators.minLength(3)]],
    roomId: ['']
  });

  constructor(
    private readonly callService: VideoCallService,
    private readonly formBuilder: FormBuilder,
    private readonly toast: ToastService,
    route: ActivatedRoute
  ) {
    route.queryParamMap.subscribe((params) => {
      const roomId = params.get('room');
      if (roomId) {
        this.callService.joinRoom(roomId);
      }
    });
  }

  createRoom(): void {
    if (this.roomForm.controls.roomName.invalid) {
      this.roomForm.controls.roomName.markAsTouched();
      return;
    }

    this.callService.createRoom(this.roomForm.controls.roomName.value);
    this.roomForm.patchValue({ roomName: '' });
  }

  joinRoom(roomId?: string): void {
    const id = roomId ?? this.roomForm.controls.roomId.value.trim();
    if (!id) {
      this.toast.error('Enter a room ID to join.');
      return;
    }

    this.callService.joinRoom(id);
    this.roomForm.patchValue({ roomId: '' });
  }

  selectRoom(roomId: string): void {
    this.callService.setActiveRoom(roomId);
  }

  toggleMute(): void {
    this.callService.toggleMuteLocal();
  }

  toggleCamera(): void {
    this.callService.toggleCameraLocal();
  }

  leaveCall(): void {
    this.callService.leaveCall();
  }

  async copyInviteLink(link: string): Promise<void> {
    if (!link) {
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      this.toast.success('Invite link copied to clipboard.');
    } catch {
      this.toast.error('Unable to copy invite link. Copy it manually.');
    }
  }
}

