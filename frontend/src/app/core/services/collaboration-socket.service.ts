import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Socket, io } from 'socket.io-client';

import { environment } from '../../../environments/environment';
import { ChatSocketMessagePayload, ChatTypingPayload, RoomStatePayload } from '../models/collaboration-socket.model';
import { MeetingParticipant } from '../models/meeting.model';
import { UserPresence } from '../models/user.model';
import { AuthStore } from '../state/auth.store';

@Injectable({ providedIn: 'root' })
export class CollaborationSocketService implements OnDestroy {
  private socket: Socket | null = null;

  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  private readonly roomStateSubject = new Subject<RoomStatePayload>();
  private readonly userJoinedSubject = new Subject<{ roomId: string; participant: MeetingParticipant }>();
  private readonly userLeftSubject = new Subject<{ roomId: string; participant: MeetingParticipant }>();
  private readonly typingSubject = new Subject<ChatTypingPayload>();
  private readonly chatMessageSubject = new Subject<ChatSocketMessagePayload>();
  private readonly presenceListSubject = new Subject<UserPresence[]>();
  private readonly presenceUpdatedSubject = new Subject<UserPresence>();

  readonly connected$ = this.connectedSubject.asObservable();
  readonly roomState$ = this.roomStateSubject.asObservable();
  readonly userJoined$ = this.userJoinedSubject.asObservable();
  readonly userLeft$ = this.userLeftSubject.asObservable();
  readonly typing$ = this.typingSubject.asObservable();
  readonly chatMessage$ = this.chatMessageSubject.asObservable();
  readonly presenceList$ = this.presenceListSubject.asObservable();
  readonly presenceUpdated$ = this.presenceUpdatedSubject.asObservable();

  constructor(private readonly authStore: AuthStore) {}

  connect(): void {
    const user = this.authStore.currentUser;
    if (!user) {
      return;
    }

    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return;
    }

    this.socket = io(environment.signalingBaseUrl, {
      autoConnect: true,
      transports: ['websocket'],
      query: {
        userId: String(user.id),
        name: user.name,
        email: user.email
      }
    });

    this.socket.on('connect', () => {
      this.connectedSubject.next(true);
      this.socket?.emit('register-user', {
        id: String(user.id),
        name: user.name,
        email: user.email
      });
      this.socket?.emit('presence:request');
    });

    this.socket.on('disconnect', () => {
      this.connectedSubject.next(false);
    });

    this.socket.on('room-state', (payload: RoomStatePayload) => {
      this.roomStateSubject.next(payload);
    });

    this.socket.on('user-joined', (payload: { roomId: string; participant: MeetingParticipant }) => {
      this.userJoinedSubject.next(payload);
    });

    this.socket.on('user-left', (payload: { roomId: string; participant: MeetingParticipant }) => {
      this.userLeftSubject.next(payload);
    });

    this.socket.on('chat:typing', (payload: ChatTypingPayload) => {
      this.typingSubject.next(payload);
    });

    this.socket.on('chat:message', (payload: ChatSocketMessagePayload) => {
      this.chatMessageSubject.next(payload);
    });

    this.socket.on('presence:list', (users: UserPresence[]) => {
      this.presenceListSubject.next(users);
    });

    this.socket.on('presence:updated', (user: UserPresence) => {
      this.presenceUpdatedSubject.next(user);
    });
  }

  disconnect(): void {
    if (!this.socket) {
      return;
    }

    this.socket.disconnect();
    this.socket = null;
    this.connectedSubject.next(false);
  }

  joinRoom(roomId: string, participant: MeetingParticipant): void {
    this.emitWhenReady('join-room', { roomId, user: participant });
  }

  leaveRoom(roomId: string): void {
    this.emitWhenReady('leave-room', { roomId });
  }

  sendTyping(payload: ChatTypingPayload): void {
    this.emitWhenReady('chat:typing', payload);
  }

  sendChatMessage(roomId: string, content: string, senderEmail: string): void {
    this.emitWhenReady('chat:message', {
      roomId,
      content,
      senderEmail
    });
  }

  requestPresence(): void {
    this.emitWhenReady('presence:request');
  }

  updatePresence(status: 'online' | 'idle' | 'offline'): void {
    this.emitWhenReady('presence:update', { status });
  }

  observeSignal(): Observable<{ from: string; signal: unknown }> {
    return new Observable((subscriber) => {
      if (!this.socket) {
        subscriber.complete();
        return;
      }

      const onSignal = (payload: { from: string; signal: unknown }) => subscriber.next(payload);
      this.socket.on('signal', onSignal);

      return () => this.socket?.off('signal', onSignal);
    });
  }

  sendSignal(roomId: string, signal: unknown): void {
    this.emitWhenReady('signal', { roomId, signal });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private emitWhenReady(event: string, payload?: unknown): void {
    this.connect();
    if (!this.socket) {
      return;
    }

    if (this.socket.connected) {
      this.socket.emit(event, payload);
      return;
    }

    this.socket.once('connect', () => {
      this.socket?.emit(event, payload);
    });
  }
}
