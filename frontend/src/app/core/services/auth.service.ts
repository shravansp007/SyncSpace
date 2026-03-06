import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { AuthStore } from '../state/auth.store';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/auth`;

  constructor(
    private readonly http: HttpClient,
    private readonly authStore: AuthStore,
    private readonly tokenStorage: TokenStorageService
  ) {
    const session = this.tokenStorage.readSession();
    if (session) {
      this.authStore.setSession(session);
    }
  }

  get authState$() {
    return this.authStore.state$;
  }

  get isAuthenticated(): boolean {
    return this.authStore.isAuthenticated;
  }

  get token(): string | null {
    return this.authStore.token;
  }

  login(payload: LoginRequest): Observable<void> {
    this.authStore.setLoading();
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload).pipe(
      tap((response) => this.persist(response)),
      map(() => void 0),
      catchError((error) => this.handleError(error))
    );
  }

  register(payload: RegisterRequest): Observable<void> {
    this.authStore.setLoading();
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, payload).pipe(
      tap((response) => this.persist(response)),
      map(() => void 0),
      catchError((error) => this.handleError(error))
    );
  }

  logout(): void {
    this.tokenStorage.clearSession();
    this.authStore.clear();
  }

  private persist(response: AuthResponse): void {
    const session = {
      token: response.token,
      user: {
        id: response.id,
        name: response.name,
        email: response.email
      }
    };

    this.tokenStorage.writeSession(session);
    this.authStore.setSession(session);
  }

  private handleError(error: unknown): Observable<never> {
    const message = this.errorMessage(error);
    this.authStore.setError(message);
    return throwError(() => new Error(message));
  }

  private errorMessage(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error: unknown }).error === 'object' &&
      (error as { error: { message?: string } }).error?.message
    ) {
      return (error as { error: { message: string } }).error.message;
    }

    return 'Request failed. Please try again.';
  }
}
