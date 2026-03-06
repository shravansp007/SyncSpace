import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, filter, switchMap, take } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { environment } from '../../../environments/environment';
import { ChatMessage, SendChatMessagePayload } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatRealtimeService {
  private client: Client | null = null;
  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  readonly connected$ = this.connectedSubject.asObservable();

  connect(token: string): void {
    if (this.client?.active || this.connectedSubject.value) {
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsBaseUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      onConnect: () => this.connectedSubject.next(true),
      onWebSocketClose: () => this.connectedSubject.next(false),
      onStompError: () => this.connectedSubject.next(false)
    });

    this.client.activate();
  }

  disconnect(): void {
    if (!this.client) {
      return;
    }

    this.client.deactivate();
    this.connectedSubject.next(false);
    this.client = null;
  }

  observeRoom(roomId: string): Observable<ChatMessage> {
    const clean = roomId.trim();
    if (!clean) {
      return new Observable<ChatMessage>((subscriber) => {
        subscriber.error(new Error('Room ID is required'));
      });
    }

    return this.connected$.pipe(
      filter(Boolean),
      take(1),
      switchMap(() => this.subscribe(clean))
    );
  }

  send(payload: SendChatMessagePayload): void {
    if (!this.client || !this.connectedSubject.value) {
      return;
    }

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload)
    });
  }

  private subscribe(roomId: string): Observable<ChatMessage> {
    return new Observable<ChatMessage>((subscriber) => {
      if (!this.client || !this.connectedSubject.value) {
        subscriber.error(new Error('WebSocket disconnected'));
        return;
      }

      const subscription: StompSubscription = this.client.subscribe(`/topic/rooms/${roomId}`, (message: IMessage) => {
        subscriber.next(JSON.parse(message.body) as ChatMessage);
      });

      return () => subscription.unsubscribe();
    });
  }
}
