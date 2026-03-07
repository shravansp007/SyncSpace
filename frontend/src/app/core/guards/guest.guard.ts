import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);

  const hasLegacyToken = Boolean(localStorage.getItem('auth_token'));
  const hasSessionToken = Boolean(
    (() => {
      try {
        const raw = localStorage.getItem('syncspace.auth');
        if (!raw) {
          return null;
        }
        const parsed = JSON.parse(raw) as { token?: string };
        return parsed.token ?? null;
      } catch {
        return null;
      }
    })()
  );

  return hasLegacyToken || hasSessionToken ? router.createUrlTree(['/workspace/dashboard']) : true;
};
