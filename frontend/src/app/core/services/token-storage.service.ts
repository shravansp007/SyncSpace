import { Injectable } from '@angular/core';

import { AuthSession } from '../models/auth.model';

const AUTH_STORAGE_KEY = 'syncspace.auth';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  readSession(): AuthSession | null {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  writeSession(session: AuthSession): void {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }

  clearSession(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  readToken(): string | null {
    return this.readSession()?.token ?? null;
  }
}
