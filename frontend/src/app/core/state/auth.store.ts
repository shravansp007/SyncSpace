import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { AuthSession, AuthenticatedUser } from '../models/auth.model';

export interface AuthState {
  status: 'anonymous' | 'loading' | 'authenticated';
  session: AuthSession | null;
  error: string | null;
}

const initialState: AuthState = {
  status: 'anonymous',
  session: null,
  error: null
};

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly subject = new BehaviorSubject<AuthState>(initialState);
  readonly state$ = this.subject.asObservable();

  get snapshot(): AuthState {
    return this.subject.value;
  }

  get token(): string | null {
    return this.snapshot.session?.token ?? null;
  }

  get currentUser(): AuthenticatedUser | null {
    return this.snapshot.session?.user ?? null;
  }

  get isAuthenticated(): boolean {
    return this.snapshot.status === 'authenticated' && this.snapshot.session !== null;
  }

  setLoading(): void {
    this.patch({ status: 'loading', error: null });
  }

  setSession(session: AuthSession): void {
    this.patch({ status: 'authenticated', session, error: null });
  }

  clear(): void {
    this.subject.next(initialState);
  }

  setError(message: string): void {
    this.patch({ status: 'anonymous', session: null, error: message });
  }

  private patch(partial: Partial<AuthState>): void {
    this.subject.next({ ...this.snapshot, ...partial });
  }
}
