import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ChatMessage } from '../models/chat.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/chat`;

  constructor(private readonly http: HttpClient) {}

  getHistory(roomId: string, limit = 80): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/history/${encodeURIComponent(roomId)}?limit=${limit}`);
  }
}
