import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-incio-sesion',
  imports: [FormsModule],
  templateUrl: './incio-sesion.html',
  styleUrl: './incio-sesion.css',
})
export class IncioSesion {
  constructor(private router: Router) {}

  isDark = signal(false);

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
