import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WebsocketService } from './websocket.service';

export interface ChatMessage {
  id: number;
  senderEmail: string;
  receiverEmail: string;
  content: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(
    private readonly http: HttpClient,
    private readonly websocketService: WebsocketService
  ) {}

  loadConversationHistory(receiverEmail: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${environment.apiBaseUrl}/chat/history/${encodeURIComponent(receiverEmail)}`
    );
  }

  receivePrivateMessages(currentEmail: string): Observable<ChatMessage> {
    const normalized = currentEmail.trim().toLowerCase();
    return this.websocketService.watch<ChatMessage>('/user/queue/messages').pipe(
      filter((message) => {
        const sender = message.senderEmail?.toLowerCase();
        const receiver = message.receiverEmail?.toLowerCase();
        return sender === normalized || receiver === normalized;
      })
    );
  }

  sendPrivateMessage(senderEmail: string, receiverEmail: string, content: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${environment.apiBaseUrl}/chat/send`, {
      senderEmail,
      receiverEmail,
      content
    });
  }

  sendPrivateMessageSocket(senderEmail: string, receiverEmail: string, content: string): void {
    this.websocketService.publish('/app/chat.private', {
      senderEmail,
      receiverEmail,
      content,
    });
  }
}
