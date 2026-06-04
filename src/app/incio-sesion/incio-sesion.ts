import { Component, OnInit, signal, inject } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { ProfileService } from '../core/services/profile.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-incio-sesion',
  imports: [FormsModule],
  templateUrl: './incio-sesion.html',
  styleUrl: './incio-sesion.css',
})
export class IncioSesion implements OnInit {
  constructor(private router: Router) {}

  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  isDark = signal(false);

  carouselImages: string[] = [];

  private buildCarouselImages(): string[] {
    const base = 'https://oduejasasklthjttssze.supabase.co/storage/v1/object/public/collage/collage';
    const images = Array.from({ length: 9 }, (_, i) => `${base}(${i + 1}).png`);
    for (let i = images.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [images[i], images[j]] = [images[j], images[i]];
    }
    return images;
  }

  email = '';
  password = '';

  showForgot = signal(false);
  forgotEmail = '';
  forgotSent = signal(false);
  forgotError = signal('');
  isSendingReset = signal(false);

  isLoading = signal(false);
  errorMessage = signal('');

  openForgot() { this.showForgot.set(true); this.forgotSent.set(false); this.forgotError.set(''); }
  closeForgot() { this.showForgot.set(false); this.forgotEmail = ''; this.isSendingReset.set(false); }

  submitForgot() {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.forgotEmail.trim());
    if (!valid) { this.forgotError.set('Ingresa un correo valido.'); return; }
    this.forgotError.set('');
    this.isSendingReset.set(true);
    this.authService.passwordRecovery(this.forgotEmail.trim()).subscribe({
      next: () => {
        this.forgotSent.set(true);
        this.isSendingReset.set(false);
      },
      error: () => {
        this.forgotError.set('No se pudo enviar el correo. Intente nuevamente.');
        this.isSendingReset.set(false);
      },
    });
  }

  ngOnInit() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved ? saved === 'dark' : prefersDark;
    this.isDark.set(dark);
    this.applyTheme(dark);
    this.carouselImages = this.buildCarouselImages();
  }

  toggleTheme() {
    const next = !this.isDark();
    this.isDark.set(next);
    this.applyTheme(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  private applyTheme(dark: boolean) {
    const theme = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
  }

  onLogin() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.signIn(this.email, this.password).subscribe({
      next: (response) => {
        localStorage.setItem('access_token', response.access_token);

        if (response.user.app_metadata.is_active === false) {
          this.denyInactiveUser();
          return;
        }

        this.profileService.getProfileByUserId(response.user.id).subscribe({
          next: (profiles) => {
            const profile = profiles[0];
            if (!profile?.is_active) {
              this.denyInactiveUser();
              return;
            }

            if (this.isAdminRole(response.user.app_metadata.role) || this.isAdminRole(profile.role)) {
              this.router.navigate(['/dashboard']);
            } else if (response.user.app_metadata.role === 'athlete' || profile.role === 'athlete') {
              this.router.navigate(['/inicio-atleta']);
            } else {
              this.errorMessage.set('Hay un problema con tu usuario, por favor ponte en contacto con el comite');
            }

            this.isLoading.set(false);
          },
          error: () => {
            localStorage.removeItem('access_token');
            this.errorMessage.set('No se pudo validar el estado de tu usuario');
            this.isLoading.set(false);
          },
        });
      },
      error: () => {
        this.errorMessage.set('Usuario o contrasena no valido');
        this.isLoading.set(false);
      },
    });
  }

  private denyInactiveUser() {
    localStorage.removeItem('access_token');
    this.errorMessage.set('Tu usuario se encuentra inactivo. Contacta al comite para recuperar el acceso.');
    this.isLoading.set(false);
  }

  private isAdminRole(role?: string | null): boolean {
    return role === 'admin' || role === 'admon';
  }
}
