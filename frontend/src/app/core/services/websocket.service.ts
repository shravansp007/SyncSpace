import { Injectable, OnDestroy } from '@angular/core';
import { Client, IFrame, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import SockJS from 'sockjs-client';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebsocketService implements OnDestroy {
  private client: Client | null = null;
  private connected = false;
  private readonly topics = new Map<string, Subject<unknown>>();
  private readonly subscriptions = new Map<string, StompSubscription>();

  connect(): void {
    if (this.client?.active) {
      return;
    }

    const token = this.readToken();
    if (!token) {
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsBaseUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: (frame) => this.onConnect(frame),
      onWebSocketClose: () => {
        this.connected = false;
        this.subscriptions.clear();
      }
    });

    this.client.activate();
  }

  watch<T>(topic: string): Observable<T> {
    let subject = this.topics.get(topic);
    if (!subject) {
      subject = new Subject<unknown>();
      this.topics.set(topic, subject);
      if (this.connected) {
        this.subscribeTopic(topic);
      }
    }

    this.connect();
    return subject.asObservable() as Observable<T>;
  }

  publish(destination: string, payload: unknown): void {
    this.connect();
    if (!this.client || !this.connected) {
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(payload)
    });
  }

  ngOnDestroy(): void {
    this.client?.deactivate();
  }

  private onConnect(_frame: IFrame): void {
    this.connected = true;
    for (const topic of this.topics.keys()) {
      this.subscribeTopic(topic);
    }
  }

  private subscribeTopic(topic: string): void {
    if (!this.client || !this.connected || this.subscriptions.has(topic)) {
      return;
    }

    const subject = this.topics.get(topic);
    if (!subject) {
      return;
    }

    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      if (!message.body) {
        return;
      }

      try {
        subject.next(JSON.parse(message.body) as unknown);
      } catch {
        subject.next(message.body);
      }
    });

    this.subscriptions.set(topic, subscription);
  }

  private readToken(): string | null {
    const rawSession = localStorage.getItem('syncspace.auth');
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession) as { token?: string };
        if (session.token) {
          return session.token;
        }
      } catch {
        // ignore and fall back
      }
    }

    return localStorage.getItem('auth_token');
  }
}
