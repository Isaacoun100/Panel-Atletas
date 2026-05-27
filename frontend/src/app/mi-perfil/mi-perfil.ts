import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mi-perfil',
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit {
  isDark = signal(false);

  // ── Edit profile panel ────────────────────────────
  showEditPanel = signal(false);
  editNombre = 'Isaac Herrera Monge';
  editCorreo = 'isaacoun100@gmail.com';
  editTelefono = '8888-8888';
  editUbicacion = 'Montes de Oca, San José';
  editSaved = signal(false);

  openEditPanel() { this.showEditPanel.set(true); this.editSaved.set(false); }
  closeEditPanel() { this.showEditPanel.set(false); }

  saveProfile() {
    // TODO: persist to backend
    this.editSaved.set(true);
    setTimeout(() => { this.editSaved.set(false); this.closeEditPanel(); }, 2000);
  }

  // ── Change password panel ─────────────────────────
  showPasswordPanel = signal(false);
  passActual = '';
  passNueva = '';
  passConfirmar = '';
  passError = signal('');
  passSaved = signal(false);

  openPasswordPanel() { this.showPasswordPanel.set(true); this.passError.set(''); this.passSaved.set(false); }
  closePasswordPanel() { this.showPasswordPanel.set(false); this.passActual = ''; this.passNueva = ''; this.passConfirmar = ''; }

  savePassword() {
    if (!this.passActual || !this.passNueva || !this.passConfirmar) {
      this.passError.set('Todos los campos son obligatorios.');
      return;
    }
    if (this.passNueva !== this.passConfirmar) {
      this.passError.set('Las contraseñas no coinciden.');
      return;
    }
    if (this.passNueva.length < 6) {
      this.passError.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    this.passError.set('');
    this.passSaved.set(true);
    setTimeout(() => { this.passSaved.set(false); this.closePasswordPanel(); }, 2000);
  }

  constructor(private router: Router) {}

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

  logout() {
    this.router.navigate(['/inicio-sesion']);
  }
}
