import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, catchError, map, of, takeUntil, tap, timer } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PresenceMember, PresenceStatus, UserPresence } from '../models/user.model';
import { CollaborationSocketService } from './collaboration-socket.service';

@Injectable({ providedIn: 'root' })
export class PresenceService implements OnDestroy {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/users`;
  private readonly destroy$ = new Subject<void>();

  private readonly membersSubject = new BehaviorSubject<PresenceMember[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(true);

  readonly members$ = this.membersSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly onlineMembers$ = this.members$.pipe(map((members) => members.filter((member) => member.status === 'online')));
  readonly activeMembers$ = this.members$.pipe(map((members) => members.filter((member) => member.isActive)));

  constructor(
    private readonly http: HttpClient,
    private readonly collaborationSocket: CollaborationSocketService
  ) {
    this.collaborationSocket.connect();
    this.collaborationSocket.requestPresence();

    this.collaborationSocket.presenceList$
      .pipe(takeUntil(this.destroy$))
      .subscribe((users) => {
        this.membersSubject.next(users.map((user) => this.toPresenceMember(user)));
        this.loadingSubject.next(false);
      });

    this.collaborationSocket.presenceUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => this.upsertMember(this.toPresenceMember(user)));

    timer(0, 12000)
      .pipe(
        tap(() => this.loadingSubject.next(this.membersSubject.value.length === 0)),
        map(() => void 0),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.refresh());
  }

  getPresence() {
    return this.http.get<UserPresence[]>(`${this.baseUrl}/presence`).pipe(
      map((users) => users.map((user) => this.toPresenceMember(user)))
    );
  }

  getOnlineUsers() {
    return this.members$.pipe(map((members) => members.filter((member) => member.status === 'online')));
  }

  refresh(): void {
    this.getPresence()
      .pipe(
        catchError(() => of([] as PresenceMember[])),
        takeUntil(this.destroy$)
      )
      .subscribe((members) => {
        this.membersSubject.next(members);
        this.loadingSubject.next(false);
      });
  }

  ngOnDestroy(): void {
    this.collaborationSocket.updatePresence('offline');
    this.destroy$.next();
    this.destroy$.complete();
  }

  private toPresenceMember(user: UserPresence): PresenceMember {
    const status = this.resolveStatus(user);
    return {
      ...user,
      status,
      isActive: status !== 'offline'
    };
  }

  private resolveStatus(user: UserPresence): PresenceStatus {
    if (user.online) {
      return 'online';
    }

    if (!user.lastSeenAt) {
      return 'offline';
    }

    const idleThresholdMs = 15 * 60 * 1000;
    const isIdle = Date.now() - new Date(user.lastSeenAt).getTime() < idleThresholdMs;

    return isIdle ? 'idle' : 'offline';
  }

  private upsertMember(member: PresenceMember): void {
    const current = this.membersSubject.value;
    const existingIndex = current.findIndex((item) => item.email === member.email);
    if (existingIndex === -1) {
      this.membersSubject.next([member, ...current]);
      return;
    }

    const next = [...current];
    next[existingIndex] = member;
    this.membersSubject.next(next);
  }
}
