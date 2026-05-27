import { Component, OnInit, HostListener, signal, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Servicios y modelos
import { AdminAthletesService } from '../core/services/admin-athletes.service';
import { AdminDisciplinesService } from '../core/services/admin-disciplines.service';
import { Discipline } from '../core/models/discipline.model';
import { AdminProfilesService } from '../core/services/admin-profiles.service';

interface Atleta {
  cedula: string;
  foto: string;
  initials: string;
  nombre: string;
  fechaNacimiento: string;
  edad: number;
  sexo: 'M' | 'F';
  disciplinas: string[];
  estado: 'Activo' | 'Pendiente' | 'Inactivo';
  id_user?: string; // Para operaciones de actualización
  telefono?: string;                    
  esMenor?: boolean;                    
  encargadoNombre?: string;             
  encargadoTelefono?: string;
}

@Component({
  selector: 'app-atletas',
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './atletas.html',
  styleUrl: './atletas.css',
})
export class Atletas implements OnInit {

  // Servicios inyectados
  private adminAthletesService = inject(AdminAthletesService);
  private adminDisciplinesService = inject(AdminDisciplinesService);
  private router = inject(Router);
  private adminProfilesService = inject(AdminProfilesService);

  isDark = signal(false);

  // ── Datos reales desde API ──────────────────────────────────────────
  atletasReales = signal<Atleta[]>([]);
  listaDisciplinasAPI = signal<Discipline[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  // ── Filters ───────────────────────────────────────
  searchQuery = signal('');
  minAge = signal<number | null>(null);
  maxAge = signal<number | null>(null);
  selectedSex = signal('');

  disciplineMenuOpen = signal(false);
  categoriaMenuOpen = signal(false);
  selectedDisciplines = signal<string[]>([]);
  selectedCategorias = signal<string[]>([]);

  disciplinesList: string[] = [];

  showCategoriaMenu = computed(() =>
    this.selectedDisciplines().includes('Para Tenis de Mesa')
  );

  readonly categorias = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  filteredAtletas = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const disciplines = this.selectedDisciplines();
    const sex = this.selectedSex();
    const min = this.minAge();
    const max = this.maxAge();

    const source = this.atletasReales();

    return source.filter(a => {
      if (query && !a.nombre.toLowerCase().includes(query) && !a.cedula.toLowerCase().includes(query)) return false;
      if (disciplines.length > 0 && !a.disciplinas.some(d => disciplines.includes(d))) return false;
      if (sex && a.sexo !== sex) return false;
      if (min !== null && a.edad < min) return false;
      if (max !== null && a.edad > max) return false;
      return true;
    });
  });

  // ── Selection ─────────────────────────────────────
  selectedIds = signal<Set<string>>(new Set());

  allSelected = computed(() => {
    const filtered = this.filteredAtletas();
    return filtered.length > 0 && filtered.every(a => this.selectedIds().has(a.cedula));
  });

  someSelected = computed(() => this.selectedIds().size > 0);
  selectedCount = computed(() => this.selectedIds().size);

  partialSelection = computed(() =>
    this.someSelected() && !this.allSelected()
  );

  toggleSelectAll() {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.filteredAtletas().map(a => a.cedula)));
    }
  }

  toggleSelect(id: string) {
    const next = new Set(this.selectedIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selectedIds.set(next);
  }

  clearSelection() { this.selectedIds.set(new Set()); }

  // ── View / Edit panel ─────────────────────────────
  panelAtleta = signal<Atleta | null>(null);
  panelMode = signal<'view' | 'edit'>('view');
  editForm: Atleta = {} as Atleta;
  panelSaved = signal(false);

  openPanel(a: Atleta, mode: 'view' | 'edit') {
    this.editForm = { ...a, disciplinas: [...a.disciplinas] };
    this.panelMode.set(mode);
    this.panelAtleta.set(a);
    this.panelSaved.set(false);
  }

  closePanel() { this.panelAtleta.set(null); }

  savePanel() {
    const idx = this.atletasReales().findIndex(a => a.cedula === this.editForm.cedula);
    if (idx !== -1) {
      const current = this.atletasReales();
      current[idx] = { ...this.editForm };
      this.atletasReales.set([...current]);
    }
    this.panelSaved.set(true);
    setTimeout(() => this.panelSaved.set(false), 2500);
  }

  // ── Export ────────────────────────────────────────
  exportSelection(format: 'csv' | 'pdf' | 'word') {
    // TODO: connect to backend export endpoint
    alert(`Exportando ${this.selectedCount()} atleta(s) en formato ${format.toUpperCase()}...`);
  }

  // ── Dropdown close on outside click ───────────────
  // ── Métodos para el menú de disciplinas (HU-11) ────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('.at-multiselect')) {
      this.disciplineMenuOpen.set(false);
      this.categoriaMenuOpen.set(false);
    }
  }

  toggleDisciplineMenu(e: Event) {
    e.stopPropagation();
    this.disciplineMenuOpen.update(v => !v);
    this.categoriaMenuOpen.set(false);
  }

  toggleCategoriaMenu(e: Event) {
    e.stopPropagation();
    this.categoriaMenuOpen.update(v => !v);
    this.disciplineMenuOpen.set(false);
  }

  toggleDiscipline(d: string) {
    const cur = this.selectedDisciplines();
    if (cur.includes(d)) {
      this.selectedDisciplines.set(cur.filter(x => x !== d));
      if (d === 'Para Tenis de Mesa') this.selectedCategorias.set([]);
    } else {
      this.selectedDisciplines.set([...cur, d]);
    }
  }

  toggleCategoria(c: string) {
    const cur = this.selectedCategorias();
    this.selectedCategorias.set(
      cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c]
    );
  }

  disciplineLabel() {
    const n = this.selectedDisciplines().length;
    return n === 0 ? 'Disciplinas' : `${n} disciplina${n > 1 ? 's' : ''}`;
  }

  categoriaLabel() {
    const n = this.selectedCategorias().length;
    return n === 0 ? 'Categoría funcional' : `${n} categoría${n > 1 ? 's' : ''}`;
  }

  // ── Cargar datos desde API ─────────────────────────────────────────
  cargarAtletasReales() {
  this.isLoading.set(true);
    
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.warn('No hay token, no se pueden cargar atletas');
    this.isLoading.set(false);
    this.errorMessage.set('No hay sesión activa. Por favor inicie sesión.');
    return;
  }

  this.adminAthletesService.getAllAthletes().subscribe({
    next: (data: any) => {
      this.procesarAtletasConDisciplinas(data);
    },
    error: (err) => {
      console.error('Error cargando atletas:', err);
      this.errorMessage.set('Error al cargar atletas.');
      this.isLoading.set(false);
      }
    });
  }

cargarDisciplinas() {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  this.adminDisciplinesService.getAllDisciplines().subscribe({
    next: (data: any) => {
      this.listaDisciplinasAPI.set(data as Discipline[]);
      // Extraer nombres únicos con type assertion
      const disciplinas = data as Discipline[];
      const nombresUnicos: string[] = [...new Set(disciplinas.map(d => d.name))];
      this.disciplinesList = nombresUnicos.sort();
    },
    error: (err) => console.error('Error cargando disciplinas:', err)
  });
}

procesarAtletasConDisciplinas(atletasData: any[]) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    this.isLoading.set(false);
    return;
  }

  // Se obtiene todos los perfiles
  this.adminProfilesService.getAllProfiles().subscribe({
    next: (perfiles: any) => {
      const promesas = atletasData.map(atleta => {
        // Se buscar el perfil que coincide con el id_user del atleta
        const perfil = perfiles.find((p: any) => p.id_user === atleta.id_user);
        
        return new Promise<Atleta>((resolve) => {
          this.adminDisciplinesService.getUserEnrollments(atleta.id_user).subscribe({
            next: (enrollments: any) => {
              const disciplinasNombres = enrollments
                .map((e: any) => e.disciplines?.name)
                .filter(Boolean);
              
              // Se calcula la edad y se determina si es menor de edad
              const edad = perfil?.birth_date ? this.calcularEdad(perfil.birth_date) : 0;
              const esMenor = edad < 18;
              
              // Determina qué teléfono y contacto mostrar
              let telefono = '';
              let encargadoNombre = '';
              let encargadoTelefono = '';
              
              if (esMenor && atleta.legal_guardian_name && atleta.legal_guardian_phone) {
                // Para menores de edad se muestran los datos del encargado
                encargadoNombre = atleta.legal_guardian_name;
                encargadoTelefono = atleta.legal_guardian_phone;
                telefono = atleta.legal_guardian_phone; // El teléfono que se muestra es el del encargado
              } else {
                // Para los adultos se muesra su propio teléfono
                telefono = atleta.phone || 'No registrado';
              }
              
              // Se generan iniciales para el avatar en caso de que no haya foto
              const nombreCompleto = `${perfil?.name || ''} ${perfil?.first_last_name || ''} ${perfil?.second_last_name || ''}`.trim();
              const iniciales = this.obtenerIniciales(perfil?.name || '', perfil?.first_last_name || '');
              
              resolve({
                id_user: atleta.id_user,
                cedula: perfil?.dni || 'N/A',
                nombre: nombreCompleto || 'Sin nombre',
                fechaNacimiento: perfil?.birth_date ? new Date(perfil.birth_date).toLocaleDateString() : 'N/A',
                edad: edad,
                sexo: this.mapearSexo(perfil?.sex),
                // Si hay foto se usa, pero si no, usa un string vacío, que en HTML se manejará con iniciales
                foto: perfil?.profile_image_url || '',
                estado: perfil?.is_active ? 'Activo' : 'Inactivo',
                disciplinas: disciplinasNombres,
                initials: iniciales,
                telefono: telefono,
                esMenor: esMenor,
                encargadoNombre: encargadoNombre,
                encargadoTelefono: encargadoTelefono
              });
            },
            error: () => {
              const edad = perfil?.birth_date ? this.calcularEdad(perfil.birth_date) : 0;
              const esMenor = edad < 18;
              let telefono = '';
              let encargadoNombre = '';
              let encargadoTelefono = '';
              
              if (esMenor && atleta.legal_guardian_name && atleta.legal_guardian_phone) {
                encargadoNombre = atleta.legal_guardian_name;
                encargadoTelefono = atleta.legal_guardian_phone;
                telefono = atleta.legal_guardian_phone;
              } else {
                telefono = atleta.phone || 'No registrado';
              }
              
              const nombreCompleto = `${perfil?.name || ''} ${perfil?.first_last_name || ''} ${perfil?.second_last_name || ''}`.trim();
              const iniciales = this.obtenerIniciales(perfil?.name || '', perfil?.first_last_name || '');
              
              resolve({
                id_user: atleta.id_user,
                cedula: perfil?.dni || 'N/A',
                nombre: nombreCompleto || 'Sin nombre',
                fechaNacimiento: perfil?.birth_date ? new Date(perfil.birth_date).toLocaleDateString() : 'N/A',
                edad: edad,
                sexo: this.mapearSexo(perfil?.sex),
                foto: perfil?.profile_image_url || '',
                estado: perfil?.is_active ? 'Activo' : 'Inactivo',
                disciplinas: [],
                initials: iniciales,
                telefono: telefono,
                esMenor: esMenor,
                encargadoNombre: encargadoNombre,
                encargadoTelefono: encargadoTelefono
              });
            }
          });
        });
      });
      
      Promise.all(promesas).then((resultados) => {
        this.atletasReales.set(resultados);
        this.isLoading.set(false);
      });
    },
    error: (err) => {
      console.error('Error cargando perfiles:', err);
      this.isLoading.set(false);
    }
  });
}

mapearSexo(sexo: string): 'M' | 'F' {
  if (sexo === 'male') return 'M';
  if (sexo === 'female') return 'F';
  return 'M'; // valor por defecto
}

calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

  obtenerIniciales(nombre: string, apellido: string): string {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  }

  // ── Theme & auth ──────────────────────────────────
  ngOnInit() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      this.isDark.set(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    // Cargar datos reales
    this.cargarAtletasReales();
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
