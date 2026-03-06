import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, EMPTY, Subscription } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { ChatMessage, SendChatMessagePayload } from '../models/chat.model';
import { CollaborationSocketService } from '../services/collaboration-socket.service';
import { ChatApiService } from '../services/chat-api.service';
import { ChatRealtimeService } from '../services/chat-realtime.service';
import { NotificationService } from '../services/notification.service';
import { AuthStore } from './auth.store';

export interface ChatState {
  roomId: string;
  loading: boolean;
  typing: boolean;
  typingUsers: string[];
  messages: ChatMessage[];
  unreadByRoom: Record<string, number>;
  error: string | null;
}

const initialState: ChatState = {
  roomId: 'general',
  loading: false,
  typing: false,
  typingUsers: [],
  messages: [],
  unreadByRoom: {},
  error: null
};

@Injectable({ providedIn: 'root' })
export class ChatStore implements OnDestroy {
  private readonly subject = new BehaviorSubject<ChatState>(initialState);
  readonly state$ = this.subject.asObservable();

  private roomSubscription: Subscription | null = null;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly chatApi: ChatApiService,
    private readonly realtime: ChatRealtimeService,
    private readonly authStore: AuthStore,
    private readonly notifications: NotificationService,
    private readonly collaborationSocket: CollaborationSocketService
  ) {
    this.collaborationSocket.connect();

    this.subscriptions.add(
      this.collaborationSocket.typing$.subscribe((payload) => {
        if (payload.roomId !== this.snapshot.roomId || payload.userName === this.authStore.currentUser?.name) {
          return;
        }

        const current = this.snapshot.typingUsers;
        const next = payload.typing
          ? Array.from(new Set([...current, payload.userName]))
          : current.filter((item) => item !== payload.userName);

        this.patch({ typing: next.length > 0, typingUsers: next });
      })
    );

    this.subscriptions.add(
      this.collaborationSocket.chatMessage$.subscribe((message) => {
        if (message.senderEmail === this.authStore.currentUser?.email) {
          return;
        }

        this.notifications.notifyMessage(message.senderEmail, message.roomId, message.content);
      })
    );
  }

  get snapshot(): ChatState {
    return this.subject.value;
  }

  setTyping(typing: boolean): void {
    const currentUserName = this.authStore.currentUser?.name ?? 'You';
    this.patch({ typing, typingUsers: typing ? [currentUserName] : [] });

    this.collaborationSocket.sendTyping({
      roomId: this.snapshot.roomId,
      userId: String(this.authStore.currentUser?.id ?? 'local-user'),
      userName: currentUserName,
      typing
    });
  }

  joinRoom(roomId: string, token: string): void {
    const cleanRoomId = roomId.trim();
    if (!cleanRoomId) {
      return;
    }

    this.patch({
      roomId: cleanRoomId,
      loading: true,
      messages: [],
      error: null,
      typingUsers: [],
      unreadByRoom: {
        ...this.snapshot.unreadByRoom,
        [cleanRoomId]: 0
      }
    });

    this.realtime.connect(token);

    this.chatApi
      .getHistory(cleanRoomId)
      .pipe(
        tap((messages) => this.patch({ messages, loading: false })),
        catchError((error) => {
          this.patch({ loading: false, error: this.errorMessage(error) });
          return EMPTY;
        })
      )
      .subscribe();

    this.roomSubscription?.unsubscribe();
    this.roomSubscription = this.realtime.observeRoom(cleanRoomId).subscribe({
      next: (message) => this.handleIncomingMessage(message),
      error: (error) => this.patch({ error: this.errorMessage(error) })
    });
  }

  send(content: string, senderEmail: string): void {
    if (!content.trim()) {
      return;
    }

    const payload: SendChatMessagePayload = {
      roomId: this.snapshot.roomId,
      content: content.trim(),
      senderEmail,
      messageType: 'MESSAGE'
    };

    this.realtime.send(payload);
    this.collaborationSocket.sendChatMessage(payload.roomId, payload.content, payload.senderEmail);
  }

  setUnread(roomId: string, count: number): void {
    this.patch({
      unreadByRoom: {
        ...this.snapshot.unreadByRoom,
        [roomId]: Math.max(count, 0)
      }
    });
  }

  ngOnDestroy(): void {
    this.roomSubscription?.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  private handleIncomingMessage(message: ChatMessage): void {
    const nextMessages = [...this.snapshot.messages, message];
    const currentUserEmail = this.authStore.currentUser?.email;

    if (message.senderEmail !== currentUserEmail) {
      this.notifications.notifyMessage(message.senderEmail, message.roomId, message.content);
    }

    if (message.roomId !== this.snapshot.roomId) {
      const currentUnread = this.snapshot.unreadByRoom[message.roomId] ?? 0;
      this.patch({
        unreadByRoom: {
          ...this.snapshot.unreadByRoom,
          [message.roomId]: currentUnread + 1
        }
      });
      return;
    }

    this.patch({ messages: nextMessages });
  }

  private patch(partial: Partial<ChatState>): void {
    this.subject.next({ ...this.snapshot, ...partial });
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unable to load messages.';
  }
}
