import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

import { MeetingParticipant, MeetingRoom, MeetingState } from '../models/meeting.model';
import { CollaborationSocketService } from './collaboration-socket.service';
import { NotificationService } from './notification.service';

const initialState: MeetingState = {
  rooms: [],
  activeRoomId: null
};

@Injectable({ providedIn: 'root' })
export class MeetingRoomService {
  private readonly stateSubject = new BehaviorSubject<MeetingState>(initialState);
  readonly state$ = this.stateSubject.asObservable();

  readonly rooms$ = this.state$.pipe(map((state) => state.rooms));
  readonly activeRoom$ = this.state$.pipe(
    map((state) => state.rooms.find((room) => room.id === state.activeRoomId) ?? null)
  );

  constructor(
    private readonly notifications: NotificationService,
    private readonly collaborationSocket: CollaborationSocketService
  ) {
    this.collaborationSocket.connect();

    this.collaborationSocket.roomState$.subscribe(({ roomId, participants }) => {
      this.applyRoomParticipants(roomId, participants);
    });

    this.collaborationSocket.userJoined$.subscribe(({ roomId, participant }) => {
      this.upsertParticipant(roomId, participant);
      const room = this.snapshot.rooms.find((item) => item.id === roomId);
      if (room) {
        this.notifications.notifyMeetingJoin(participant.name, room.name);
      }
    });

    this.collaborationSocket.userLeft$.subscribe(({ roomId, participant }) => {
      this.removeParticipant(roomId, participant.id);
    });
  }

  get snapshot(): MeetingState {
    return this.stateSubject.value;
  }

  createRoom(name: string, host: MeetingParticipant): MeetingRoom {
    const safeName = name.trim() || 'Untitled Meeting';
    const roomId = this.slugify(`${safeName}-${Math.random().toString(36).slice(2, 8)}`);
    const room: MeetingRoom = {
      id: roomId,
      name: safeName,
      createdAt: new Date().toISOString(),
      participants: [host],
      inviteLink: this.buildInviteLink(roomId)
    };

    const state = this.snapshot;
    this.stateSubject.next({
      ...state,
      rooms: [room, ...state.rooms],
      activeRoomId: room.id
    });

    this.collaborationSocket.joinRoom(roomId, host);
    this.notifications.notifyCallStarted(room.name);

    return room;
  }

  joinRoom(roomId: string, participant: MeetingParticipant): void {
    const state = this.snapshot;
    const roomExists = state.rooms.some((room) => room.id === roomId);
    const baseRooms = roomExists
      ? state.rooms
      : [
          ...state.rooms,
          {
            id: roomId,
            name: `Room ${roomId}`,
            createdAt: new Date().toISOString(),
            participants: [],
            inviteLink: this.buildInviteLink(roomId)
          }
        ];

    this.stateSubject.next({ ...state, rooms: baseRooms, activeRoomId: roomId });
    this.collaborationSocket.joinRoom(roomId, participant);
  }

  leaveRoom(roomId: string, participantId: string): void {
    this.collaborationSocket.leaveRoom(roomId);

    const state = this.snapshot;
    const rooms = state.rooms
      .map((room) => {
        if (room.id !== roomId) {
          return room;
        }

        return {
          ...room,
          participants: room.participants.filter((participant) => participant.id !== participantId)
        };
      })
      .filter((room) => room.participants.length > 0);

    const activeRoomStillExists = rooms.some((room) => room.id === state.activeRoomId);

    this.stateSubject.next({
      rooms,
      activeRoomId: activeRoomStillExists ? state.activeRoomId : rooms[0]?.id ?? null
    });
  }

  updateParticipant(roomId: string, participantId: string, patch: Partial<MeetingParticipant>): void {
    const state = this.snapshot;
    const rooms = state.rooms.map((room) => {
      if (room.id !== roomId) {
        return room;
      }

      return {
        ...room,
        participants: room.participants.map((participant) =>
          participant.id === participantId ? { ...participant, ...patch } : participant
        )
      };
    });

    this.stateSubject.next({ ...state, rooms });
  }

  setActiveRoom(roomId: string): void {
    if (!this.snapshot.rooms.some((room) => room.id === roomId)) {
      return;
    }

    this.stateSubject.next({ ...this.snapshot, activeRoomId: roomId });
  }

  private applyRoomParticipants(roomId: string, participants: MeetingParticipant[]): void {
    const state = this.snapshot;
    const roomExists = state.rooms.some((room) => room.id === roomId);

    const rooms = (roomExists ? state.rooms : [...state.rooms, this.createRoomSkeleton(roomId)]).map((room) =>
      room.id === roomId ? { ...room, participants } : room
    );

    this.stateSubject.next({ ...state, rooms, activeRoomId: state.activeRoomId ?? roomId });
  }

  private upsertParticipant(roomId: string, participant: MeetingParticipant): void {
    const state = this.snapshot;
    const rooms = state.rooms.map((room) => {
      if (room.id !== roomId) {
        return room;
      }

      const exists = room.participants.some((member) => member.id === participant.id);
      return {
        ...room,
        participants: exists
          ? room.participants.map((member) => (member.id === participant.id ? participant : member))
          : [...room.participants, participant]
      };
    });

    this.stateSubject.next({ ...state, rooms });
  }

  private removeParticipant(roomId: string, participantId: string): void {
    const state = this.snapshot;
    const rooms = state.rooms.map((room) => {
      if (room.id !== roomId) {
        return room;
      }

      return {
        ...room,
        participants: room.participants.filter((participant) => participant.id !== participantId)
      };
    });

    this.stateSubject.next({ ...state, rooms });
  }

  private createRoomSkeleton(roomId: string): MeetingRoom {
    return {
      id: roomId,
      name: `Room ${roomId}`,
      createdAt: new Date().toISOString(),
      participants: [],
      inviteLink: this.buildInviteLink(roomId)
    };
  }

  private buildInviteLink(roomId: string): string {
    const origin = globalThis.location?.origin ?? 'http://localhost:4200';
    return `${origin}/workspace/calls?room=${encodeURIComponent(roomId)}`;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
