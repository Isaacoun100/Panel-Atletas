import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ProfileService } from '../services/profile.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const profileService = inject(ProfileService);
  const token = localStorage.getItem('access_token');

  if (!token) return router.createUrlTree(['/inicio-sesion']);

  const userId = getUserIdFromToken(token);
  if (!userId) {
    localStorage.removeItem('access_token');
    return router.createUrlTree(['/inicio-sesion']);
  }

  return profileService.getProfileByUserId(userId).pipe(
    map((profiles) => {
      if (profiles[0]?.is_active) return true;
      localStorage.removeItem('access_token');
      return router.createUrlTree(['/inicio-sesion']);
    }),
    catchError(() => {
      localStorage.removeItem('access_token');
      return of(router.createUrlTree(['/inicio-sesion']));
    }),
  );
};

function getUserIdFromToken(token: string): string {
  try {
    return JSON.parse(atob(token.split('.')[1])).sub ?? '';
  } catch {
    return '';
  }
}
