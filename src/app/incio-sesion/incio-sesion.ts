import { Component, OnInit, signal } from '@angular/core';
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

  isDark = signal(false);

  // ── Forgot password ───────────────────────────────
  showForgot = signal(false);
  forgotEmail = '';
  forgotSent = signal(false);
  forgotError = signal('');

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
    this.router.navigate(['/dashboard']);
  }
}
