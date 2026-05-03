import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface AdminUser {
  foto: string;
  nombre: string;
  cedula: string;
  correo: string;
  rol: 'Administrador' | 'Atleta';
}

interface Disciplina {
  nombre: string;
  activa: boolean;
  totalAtletas: number;
}

@Component({
  selector: 'app-administrar',
  imports: [RouterLink, RouterLinkActive, FormsModule],
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
    { nombre: 'Natación',            activa: true,  totalAtletas: 28 },
    { nombre: 'Atletismo',           activa: true,  totalAtletas: 22 },
    { nombre: 'Fútbol',              activa: true,  totalAtletas: 18 },
    { nombre: 'Gimnasia',            activa: true,  totalAtletas: 15 },
    { nombre: 'Baloncesto',          activa: true,  totalAtletas: 12 },
    { nombre: 'Ciclismo',            activa: false, totalAtletas:  8 },
    { nombre: 'Voleibol',            activa: true,  totalAtletas: 14 },
    { nombre: 'Para Tenis de Mesa',  activa: true,  totalAtletas:  6 },
    { nombre: 'Tenis',               activa: false, totalAtletas:  5 },
    { nombre: 'Judo',                activa: true,  totalAtletas:  9 },
    { nombre: 'Taekwondo',           activa: true,  totalAtletas:  7 },
    { nombre: 'Aeróbicos',           activa: true,  totalAtletas: 11 },
    { nombre: 'Yoga',                activa: false, totalAtletas:  4 },
    { nombre: 'Zumba',               activa: true,  totalAtletas: 10 },
  ];

  get disciplinasActivas(): number {
    return this.disciplinas.filter(d => d.activa).length;
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
