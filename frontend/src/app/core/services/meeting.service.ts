import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface WorkspaceMeeting {
  id: number;
  title: string;
  startsAt?: string;
  startTime?: string;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MeetingService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/meetings`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<WorkspaceMeeting[]> {
    return this.http.get<WorkspaceMeeting[]>(this.baseUrl);
  }

  join(meetingId: number): Observable<{ meetingId: number; joinPath?: string }> {
    return this.http.post<{ meetingId: number; joinPath?: string }>(`${this.baseUrl}/join/${meetingId}`, {});
  }
}
