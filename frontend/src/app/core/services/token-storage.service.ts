import { Injectable } from '@angular/core';

import { AuthSession } from '../models/auth.model';

const AUTH_STORAGE_KEY = 'syncspace.auth';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  readSession(): AuthSession | null {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as AuthSession;
      } catch {
        return null;
      }
    }

    const legacyToken = localStorage.getItem('auth_token');
    if (!legacyToken) {
      return null;
    }

    const legacyUserRaw = localStorage.getItem('auth_user');
    if (!legacyUserRaw) {
      return null;
    }

    try {
      const legacyUser = JSON.parse(legacyUserRaw) as { id?: number; name?: string; email?: string };
      return {
        token: legacyToken,
        user: {
          id: legacyUser.id ?? 0,
          name: legacyUser.name ?? 'User',
          email: legacyUser.email ?? ''
        }
      };
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
    return this.readSession()?.token ?? localStorage.getItem('auth_token');
  }
}
