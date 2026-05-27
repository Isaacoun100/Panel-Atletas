import { Component, OnInit, signal,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../core/services/auth.service';
import { SignInResponse } from '../core/models/auth.model';
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

  isDark = signal(false);

  //Sign in variables
  email = '';
  password = '';

  // Forgot password
  showForgot = signal(false);
  forgotEmail = '';
  forgotSent = signal(false);
  forgotError = signal('');

  // For the login
  isLoading = signal(false);
  errorMessage = signal('');

  openForgot() { this.showForgot.set(true); this.forgotSent.set(false); this.forgotError.set(''); }
  closeForgot() { this.showForgot.set(false); this.forgotEmail = ''; }

  submitForgot() {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.forgotEmail.trim());
    if (!valid) { this.forgotError.set('Ingresá un correo válido.'); return; }
    this.forgotError.set('');
    this.forgotSent.set(true);
    // TODO: call backend password reset API
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
    this.errorMessage.set('')

    this.authService.signIn(this.email, this.password).subscribe({
      next: (response) => {
        localStorage.setItem('access_token', response.access_token)
        this.router.navigate(['/dashboard']);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Usuario o contraseña no válido')
        this.isLoading.set(false);
      }
    })

  }
}
