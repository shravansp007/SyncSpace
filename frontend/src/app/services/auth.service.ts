import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, interval, of, switchMap, tap, catchError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { User } from '../models';

interface AuthResponse {
  token: string;
  id: string | number;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'syncspace.jwt';
  private readonly userKey = 'syncspace.user';

  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.readUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly http: HttpClient) {
    this.setupTokenAutoRefresh();
  }

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return Boolean(this.token && this.currentUserSubject.value);
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/login`, { email, password }).pipe(
      tap((res) => this.persistAuth(res)),
      switchMap(() => of(this.currentUserSubject.value as User))
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }

  private persistAuth(res: AuthResponse): void {
    localStorage.setItem(this.tokenKey, res.token);
    const user: User = {
      id: String(res.id),
      name: res.name,
      email: res.email,
      avatar: this.avatarFromName(res.name),
      role: 'Member',
      status: 'online',
      lastSeen: null
    };
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private readUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private setupTokenAutoRefresh(): void {
    interval(60000)
      .pipe(
        switchMap(() => {
          const token = this.token;
          if (!token || this.tokenExpiresInMs(token) > 3 * 60 * 1000) {
            return EMPTY;
          }

          return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          }).pipe(
            tap((res) => this.persistAuth(res)),
            catchError(() => {
              this.logout();
              return EMPTY;
            })
          );
        })
      )
      .subscribe();
  }

  private tokenExpiresInMs(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number };
      if (!payload.exp) {
        return Number.POSITIVE_INFINITY;
      }
      return payload.exp * 1000 - Date.now();
    } catch {
      return Number.POSITIVE_INFINITY;
    }
  }

  private avatarFromName(name: string): string {
    const initials = name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6C63FF&color=fff`;
  }
}
