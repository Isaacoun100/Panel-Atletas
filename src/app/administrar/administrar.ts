import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';

// Servicios y modelos
import { AdminDisciplinesService } from '../core/services/admin-disciplines.service';
import { Discipline } from '../core/models/discipline.model';


interface AdminUser {
  foto: string;
  nombre: string;
  cedula: string;
  correo: string;
  rol: 'Administrador' | 'Atleta';
}

interface DisciplinaUI {
  id_discipline: number;
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
  private adminDisciplinesService = inject(AdminDisciplinesService);
  private router = inject(Router);

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

  disciplinas = signal<DisciplinaUI[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  // ── Add discipline form ───────────────────────────
  newDiscNombre = '';
  newDiscTipo: 'recreativa' | 'deportiva' = 'deportiva';
  newDiscError = signal('');

  // ── Estado de cambios ───────────────────────────────────────────────
  hasChanges = signal(false);
  saveSuccess = signal(false);


  // Notificación
  mensajeVisible = signal(false);
  mensajeTexto = signal('');
  mensajeTipo = signal<'success' | 'error'>('success');

  mostrarMensaje(texto: string, tipo: 'success' | 'error') {
    this.mensajeTexto.set(texto);
    this.mensajeTipo.set(tipo);
    this.mensajeVisible.set(true);
    setTimeout(() => this.mensajeVisible.set(false), 3000);
  }

  // ── Disciplinas activas ───────────────────────────────────
  get disciplinasActivas(): number {
    return this.disciplinas().filter(d => d.activa).length;
  }


  // ── Cargar disciplinas desde Supabase ───────────────────────────────
  cargarDisciplinas() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('No hay token, no se pueden cargar disciplinas');
      return;
    }

    this.isLoading.set(true);
    this.adminDisciplinesService.getAllDisciplines().subscribe({
      next: (data: any) => {
        const disciplinasReales: DisciplinaUI[] = data.map((d: Discipline) => ({
          id_discipline: d.id_discipline,
          nombre: d.name,
          tipo: d.discipline_type === 'sport' ? 'deportiva' : 'recreativa',
          activa: d.is_active,
          totalAtletas: 0, // Este campo requiere consulta adicional, por ahora 0
        }));
        this.disciplinas.set(disciplinasReales);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando disciplinas:', err);
        this.errorMessage.set('Error al cargar disciplinas');
        this.isLoading.set(false);
      }
    });
  }

  // Crear nueva disciplina
  addDisciplina() {
  const nombre = this.newDiscNombre.trim();
  if (!nombre) {
    this.newDiscError.set('Ingresá un nombre.');
    return;
  }

  // Se verifica si hay una disciplina duplicada, con el mismo nombre y el mismo tipo
  const existe = this.disciplinas().some(d => 
    d.nombre.toLowerCase() === nombre.toLowerCase() && 
    d.tipo === this.newDiscTipo
  );
  
  if (existe) {
    this.newDiscError.set(`Ya existe una disciplina "${nombre}" de tipo ${this.newDiscTipo}.`);
    return;
  }

  this.newDiscError.set('');
  this.isLoading.set(true);

  const newDiscipline = {
    name: nombre,
    discipline_type: this.newDiscTipo === 'deportiva' ? 'sport' : 'recreational',
    is_active: true
  };

  this.adminDisciplinesService.createDiscipline(newDiscipline).subscribe({
    next: (response: any) => {
      const created = Array.isArray(response) ? response[0] : response;
      const newId = created?.id_discipline || Date.now();
      
      const nueva: DisciplinaUI = {
        id_discipline: newId,
        nombre: nombre,
        tipo: this.newDiscTipo,
        activa: true,
        totalAtletas: 0
      };
      
      this.disciplinas.update(lista => [...lista, nueva]);
      this.newDiscNombre = '';
      this.isLoading.set(false);
      
      this.mostrarMensaje(`Disciplina "${nombre}" (${this.newDiscTipo}) agregada correctamente`, 'success');
    },
    error: (err) => {
      console.error('Error creando disciplina:', err);
      this.newDiscError.set('Error al crear disciplina');
      this.isLoading.set(false);
      this.mostrarMensaje(`Error al crear "${nombre}"`, 'error');
    }
  });
}


  markChanged() { this.hasChanges.set(true); }

  saveChanges() {
    this.isLoading.set(true);
    const promesas: Promise<any>[] = [];

    // Se recorren cada una de las disciplinas y se actualizan las que cambiaron
    this.disciplinas().forEach(disciplina => {
      promesas.push(
        new Promise((resolve, reject) => {
          this.adminDisciplinesService.updateDiscipline(disciplina.id_discipline, {
            is_active: disciplina.activa
          }).subscribe({
            next: (res) => resolve(res),
            error: (err) => reject(err)
          });
        })
      );
    });

    Promise.all(promesas)
      .then(() => {
        this.hasChanges.set(false);
        this.saveSuccess.set(true);
        this.mostrarMensaje('Cambios guardados correctamente', 'success');
        setTimeout(() => this.saveSuccess.set(false), 3000);
        this.isLoading.set(false);
        // Se recargan las disciplinas para asegurar consistencia
        this.cargarDisciplinas();
      })
      .catch((err) => {
        console.error('Error guardando cambios:', err);
        this.errorMessage.set('Error al guardar cambios');
        this.mostrarMensaje('Error al guardar cambios', 'error');
        this.isLoading.set(false);
      });
    }
  

  ngOnInit() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      this.isDark.set(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    // Cargar disciplinas reales desde Supabase
    this.cargarDisciplinas();
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
    localStorage.removeItem('access_token');
    this.router.navigate(['/inicio-sesion']);
  }
}
