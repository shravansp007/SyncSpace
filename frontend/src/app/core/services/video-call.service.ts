import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, interval } from 'rxjs';

import { CallParticipant, CallState } from '../models/call.model';
import { MeetingParticipant } from '../models/meeting.model';
import { AuthStore } from '../state/auth.store';
import { MeetingRoomService } from './meeting-room.service';

const initialState: CallState = {
  room: 'No active room',
  connected: false,
  inviteLink: '',
  participants: []
};

@Injectable({ providedIn: 'root' })
export class VideoCallService implements OnDestroy {
  private readonly stateSubject = new BehaviorSubject<CallState>(initialState);
  readonly state$ = this.stateSubject.asObservable();

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly meetings: MeetingRoomService,
    private readonly authStore: AuthStore
  ) {
    this.subscriptions.add(
      this.meetings.activeRoom$.subscribe((room) => {
        if (!room) {
          this.stateSubject.next(initialState);
          return;
        }

        this.stateSubject.next({
          room: room.name,
          connected: true,
          inviteLink: room.inviteLink,
          participants: room.participants.map((participant) => this.toCallParticipant(participant))
        });
      })
    );

    this.subscriptions.add(
      interval(3200).subscribe(() => {
        const snapshot = this.stateSubject.value;
        if (!snapshot.connected || snapshot.participants.length === 0) {
          return;
        }

        const candidates = snapshot.participants.filter((participant) => !participant.muted);
        const active = candidates[Math.floor(Math.random() * candidates.length)] ?? snapshot.participants[0];

        this.stateSubject.next({
          ...snapshot,
          participants: snapshot.participants.map((participant) => ({
            ...participant,
            speaking: participant.id === active.id
          }))
        });
      })
    );
  }

  get snapshot(): CallState {
    return this.stateSubject.value;
  }

  get rooms$() {
    return this.meetings.rooms$;
  }

  createRoom(name: string): void {
    const local = this.localParticipant();
    this.meetings.createRoom(name, local);
  }

  joinRoom(roomId: string): void {
    this.meetings.joinRoom(roomId, this.localParticipant());
  }

  setActiveRoom(roomId: string): void {
    this.meetings.setActiveRoom(roomId);
  }

  toggleMuteLocal(): void {
    const roomId = this.meetings.snapshot.activeRoomId;
    const local = this.localParticipant();
    if (!roomId) {
      return;
    }

    const current = this.stateSubject.value.participants.find((participant) => participant.id === local.id);
    this.meetings.updateParticipant(roomId, local.id, { muted: !(current?.muted ?? false) });
  }

  toggleCameraLocal(): void {
    const roomId = this.meetings.snapshot.activeRoomId;
    const local = this.localParticipant();
    if (!roomId) {
      return;
    }

    const current = this.stateSubject.value.participants.find((participant) => participant.id === local.id);
    this.meetings.updateParticipant(roomId, local.id, { cameraOn: !(current?.cameraOn ?? true) });
  }

  leaveCall(): void {
    const roomId = this.meetings.snapshot.activeRoomId;
    if (!roomId) {
      return;
    }

    this.meetings.leaveRoom(roomId, this.localParticipant().id);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private localParticipant(): MeetingParticipant {
    const user = this.authStore.currentUser;

    return {
      id: user ? `user-${user.id}` : 'guest-local',
      name: user?.name ?? 'You',
      email: user?.email ?? 'guest@local',
      joinedAt: new Date().toISOString(),
      muted: false,
      cameraOn: true
    };
  }

  private toCallParticipant(participant: MeetingParticipant): CallParticipant {
    const localUser = this.authStore.currentUser;
    return {
      id: participant.id,
      name: participant.name,
      speaking: false,
      muted: participant.muted,
      cameraOn: participant.cameraOn,
      isLocal: participant.id === (localUser ? `user-${localUser.id}` : 'guest-local')
    };
  }
}

