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
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }

  toggleTheme() {
    const next = !this.isDark();
    this.isDark.set(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
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

            if (response.user.app_metadata.role === 'admin' || profile.role === 'admon') {
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
}
