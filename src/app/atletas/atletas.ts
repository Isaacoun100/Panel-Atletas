import { Component, OnInit, HostListener, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
}

@Component({
  selector: 'app-atletas',
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './atletas.html',
  styleUrl: './atletas.css',
})
export class Atletas implements OnInit {
  isDark = signal(false);

  // ── Data ──────────────────────────────────────────
  readonly atletasMock: Atleta[] = [
    { cedula: '1-0234-0567', foto: 'https://i.pravatar.cc/40?img=11', initials: 'CM', nombre: 'Carlos Mora',      fechaNacimiento: '15/03/1997', edad: 28, sexo: 'M', disciplinas: ['Natación'],                       estado: 'Activo'    },
    { cedula: '1-0890-1234', foto: 'https://i.pravatar.cc/40?img=47', initials: 'LR', nombre: 'Laura Rodríguez', fechaNacimiento: '22/07/2002', edad: 23, sexo: 'F', disciplinas: ['Atletismo'],                      estado: 'Activo'    },
    { cedula: '1-1234-5678', foto: 'https://i.pravatar.cc/40?img=12', initials: 'PG', nombre: 'Pedro González',  fechaNacimiento: '05/11/2006', edad: 19, sexo: 'M', disciplinas: ['Fútbol', 'Baloncesto'],           estado: 'Pendiente' },
    { cedula: '1-0567-8901', foto: 'https://i.pravatar.cc/40?img=48', initials: 'AF', nombre: 'Andrea Flores',   fechaNacimiento: '30/01/2008', edad: 17, sexo: 'F', disciplinas: ['Gimnasia'],                       estado: 'Activo'    },
    { cedula: '1-0345-6789', foto: 'https://i.pravatar.cc/40?img=15', initials: 'MV', nombre: 'Marco Vargas',    fechaNacimiento: '18/06/1994', edad: 31, sexo: 'M', disciplinas: ['Baloncesto'],                     estado: 'Inactivo'  },
    { cedula: '1-0678-9012', foto: 'https://i.pravatar.cc/40?img=44', initials: 'SJ', nombre: 'Sofía Jiménez',   fechaNacimiento: '09/09/2000', edad: 25, sexo: 'F', disciplinas: ['Ciclismo'],                       estado: 'Activo'    },
    { cedula: '1-0901-2345', foto: 'https://i.pravatar.cc/40?img=14', initials: 'RC', nombre: 'Roberto Castro',  fechaNacimiento: '27/04/2003', edad: 22, sexo: 'M', disciplinas: ['Natación', 'Atletismo'],          estado: 'Pendiente' },
    { cedula: '1-0456-7890', foto: 'https://i.pravatar.cc/40?img=49', initials: 'VM', nombre: 'Valeria Mora',    fechaNacimiento: '14/12/2005', edad: 20, sexo: 'F', disciplinas: ['Voleibol'],                       estado: 'Activo'    },
    { cedula: '1-0123-4567', foto: 'https://i.pravatar.cc/40?img=13', initials: 'DA', nombre: 'Diego Arias',     fechaNacimiento: '03/08/1998', edad: 27, sexo: 'M', disciplinas: ['Atletismo'],                      estado: 'Inactivo'  },
    { cedula: '1-0789-0123', foto: 'https://i.pravatar.cc/40?img=45', initials: 'MP', nombre: 'María Pérez',     fechaNacimiento: '21/02/2010', edad: 15, sexo: 'F', disciplinas: ['Gimnasia', 'Para Tenis de Mesa'], estado: 'Activo'    },
  ];

  // ── Filters ───────────────────────────────────────
  searchQuery = signal('');
  minAge = signal<number | null>(null);
  maxAge = signal<number | null>(null);
  selectedSex = signal('');

  disciplineMenuOpen = signal(false);
  categoriaMenuOpen = signal(false);
  selectedDisciplines = signal<string[]>([]);
  selectedCategorias = signal<string[]>([]);

  showCategoriaMenu = computed(() =>
    this.selectedDisciplines().includes('Para Tenis de Mesa')
  );

  readonly disciplines = [
    'Natación', 'Atletismo', 'Fútbol', 'Gimnasia',
    'Baloncesto', 'Ciclismo', 'Voleibol', 'Para Tenis de Mesa',
  ];
  readonly categorias = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  filteredAtletas = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const disciplines = this.selectedDisciplines();
    const sex = this.selectedSex();
    const min = this.minAge();
    const max = this.maxAge();

    return this.atletasMock.filter(a => {
      if (query && !a.nombre.toLowerCase().includes(query)) return false;
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
    // Apply edits back to the mock array
    const idx = this.atletasMock.findIndex(a => a.cedula === this.editForm.cedula);
    if (idx !== -1) Object.assign(this.atletasMock[idx], this.editForm);
    this.panelSaved.set(true);
    setTimeout(() => this.panelSaved.set(false), 2500);
  }

  // ── Export ────────────────────────────────────────
  exportSelection(format: 'csv' | 'pdf' | 'word') {
    // TODO: connect to backend export endpoint
    alert(`Exportando ${this.selectedCount()} atleta(s) en formato ${format.toUpperCase()}...`);
  }

  // ── Dropdown close on outside click ───────────────
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

  // ── Theme & auth ──────────────────────────────────
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
