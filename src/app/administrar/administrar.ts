import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';

interface AdminUser {
  foto: string;
  nombre: string;
  cedula: string;
  correo: string;
  rol: 'Administrador' | 'Atleta';
}

interface Disciplina {
  nombre: string;
  tipo: 'recreativa' | 'deportiva';
  activa: boolean;
  totalAtletas: number;
}

@Component({
  selector: 'app-administrar',
  imports: [RouterLink, RouterLinkActive, FormsModule, TitleCasePipe],
  templateUrl: './administrar.html',
  styleUrl: './administrar.css',
})
export class Administrar implements OnInit {
  isDark = signal(false);

  usuarios: AdminUser[] = [
    { foto: 'https://github.com/Isaacoun100.png?size=40',  nombre: 'Isaac Herrera Monge', cedula: '1-0234-0567', correo: 'isaacoun100@gmail.com', rol: 'Administrador' },
    { foto: 'https://github.com/BraCR10.png?size=40',      nombre: 'Brian Ramírez',        cedula: '1-0890-1234', correo: 'bracr10@gmail.com',     rol: 'Atleta'        },
    { foto: 'https://github.com/Oseec.png?size=40',         nombre: 'Isaac Gamboa',         cedula: '1-1234-5678', correo: 'oseec@gmail.com',       rol: 'Atleta'        },
    { foto: 'https://github.com/LuisArrietaV.png?size=40',  nombre: 'Luis Arrieta Vargas',  cedula: '1-0456-7890', correo: 'luisarrieta@gmail.com', rol: 'Atleta'        },
  ];

  readonly roles: AdminUser['rol'][] = ['Administrador', 'Atleta'];

  readonly rolBadgeClass: Record<string, string> = {
    'Administrador': 'db-badge--success',
    'Atleta':        'db-badge--accent',
  };

  disciplinas: Disciplina[] = [
    { nombre: 'Natación',            tipo: 'deportiva',  activa: true,  totalAtletas: 28 },
    { nombre: 'Atletismo',           tipo: 'deportiva',  activa: true,  totalAtletas: 22 },
    { nombre: 'Fútbol',              tipo: 'deportiva',  activa: true,  totalAtletas: 18 },
    { nombre: 'Gimnasia',            tipo: 'deportiva',  activa: true,  totalAtletas: 15 },
    { nombre: 'Baloncesto',          tipo: 'deportiva',  activa: true,  totalAtletas: 12 },
    { nombre: 'Ciclismo',            tipo: 'deportiva',  activa: false, totalAtletas:  8 },
    { nombre: 'Voleibol',            tipo: 'deportiva',  activa: true,  totalAtletas: 14 },
    { nombre: 'Para Tenis de Mesa',  tipo: 'deportiva',  activa: true,  totalAtletas:  6 },
    { nombre: 'Tenis',               tipo: 'deportiva',  activa: false, totalAtletas:  5 },
    { nombre: 'Judo',                tipo: 'deportiva',  activa: true,  totalAtletas:  9 },
    { nombre: 'Taekwondo',           tipo: 'deportiva',  activa: true,  totalAtletas:  7 },
    { nombre: 'Aeróbicos',           tipo: 'recreativa', activa: true,  totalAtletas: 11 },
    { nombre: 'Yoga',                tipo: 'recreativa', activa: false, totalAtletas:  4 },
    { nombre: 'Zumba',               tipo: 'recreativa', activa: true,  totalAtletas: 10 },
  ];

  // ── Add discipline form ───────────────────────────
  newDiscNombre = '';
  newDiscTipo: 'recreativa' | 'deportiva' = 'deportiva';
  newDiscError = signal('');

  addDisciplina() {
    const nombre = this.newDiscNombre.trim();
    if (!nombre) { this.newDiscError.set('Ingresá un nombre.'); return; }
    if (this.disciplinas.some(d => d.nombre.toLowerCase() === nombre.toLowerCase())) {
      this.newDiscError.set('Esta disciplina ya existe.'); return;
    }
    this.newDiscError.set('');
    this.disciplinas = [...this.disciplinas, { nombre, tipo: this.newDiscTipo, activa: true, totalAtletas: 0 }];
    this.newDiscNombre = '';
    this.markChanged();
  }

  get disciplinasActivas(): number {
    return this.disciplinas.filter(d => d.activa).length;
  }

  hasChanges = signal(false);
  saveSuccess = signal(false);

  markChanged() { this.hasChanges.set(true); }

  saveChanges() {
    // TODO: persist to backend
    this.hasChanges.set(false);
    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }

  constructor(private router: Router) {}

  ngOnInit() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      this.isDark.set(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  toggleTheme() {
    const next = !this.isDark();
    this.isDark.set(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  logout() {
    this.router.navigate(['/inicio-sesion']);
  }
}
