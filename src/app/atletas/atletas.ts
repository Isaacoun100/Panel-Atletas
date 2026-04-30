import { Component, OnInit, HostListener, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';

interface Atleta {
  id: string;
  initials: string;
  nombre: string;
  disciplina: string;
  estado: 'Activo' | 'Pendiente' | 'Inactivo';
  registro: string;
  sexo: 'M' | 'F';
  edad: number;
}

@Component({
  selector: 'app-atletas',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './atletas.html',
  styleUrl: './atletas.css',
})
export class Atletas implements OnInit {
  isDark = signal(false);

  // ── Data ──────────────────────────────────────────
  readonly atletasMock: Atleta[] = [
    { id: 'ID-0041', initials: 'CM', nombre: 'Carlos Mora',     disciplina: 'Natación',            estado: 'Activo',    registro: '24 Abr 2025', sexo: 'M', edad: 28 },
    { id: 'ID-0040', initials: 'LR', nombre: 'Laura Rodríguez', disciplina: 'Atletismo',           estado: 'Activo',    registro: '22 Abr 2025', sexo: 'F', edad: 23 },
    { id: 'ID-0039', initials: 'PG', nombre: 'Pedro González',  disciplina: 'Fútbol',              estado: 'Pendiente', registro: '20 Abr 2025', sexo: 'M', edad: 19 },
    { id: 'ID-0038', initials: 'AF', nombre: 'Andrea Flores',   disciplina: 'Gimnasia',            estado: 'Activo',    registro: '18 Abr 2025', sexo: 'F', edad: 17 },
    { id: 'ID-0037', initials: 'MV', nombre: 'Marco Vargas',    disciplina: 'Baloncesto',          estado: 'Inactivo',  registro: '15 Abr 2025', sexo: 'M', edad: 31 },
    { id: 'ID-0036', initials: 'SJ', nombre: 'Sofía Jiménez',   disciplina: 'Ciclismo',            estado: 'Activo',    registro: '12 Abr 2025', sexo: 'F', edad: 25 },
    { id: 'ID-0035', initials: 'RC', nombre: 'Roberto Castro',  disciplina: 'Natación',            estado: 'Pendiente', registro: '10 Abr 2025', sexo: 'M', edad: 22 },
    { id: 'ID-0034', initials: 'VM', nombre: 'Valeria Mora',    disciplina: 'Voleibol',            estado: 'Activo',    registro: '08 Abr 2025', sexo: 'F', edad: 20 },
    { id: 'ID-0033', initials: 'DA', nombre: 'Diego Arias',     disciplina: 'Atletismo',           estado: 'Inactivo',  registro: '05 Abr 2025', sexo: 'M', edad: 27 },
    { id: 'ID-0032', initials: 'MP', nombre: 'María Pérez',     disciplina: 'Gimnasia',            estado: 'Activo',    registro: '01 Abr 2025', sexo: 'F', edad: 15 },
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
      if (disciplines.length > 0 && !disciplines.includes(a.disciplina)) return false;
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
    return filtered.length > 0 && filtered.every(a => this.selectedIds().has(a.id));
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
      this.selectedIds.set(new Set(this.filteredAtletas().map(a => a.id)));
    }
  }

  toggleSelect(id: string) {
    const next = new Set(this.selectedIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selectedIds.set(next);
  }

  clearSelection() {
    this.selectedIds.set(new Set());
  }

  // ── Download ──────────────────────────────────────
  downloadMenuOpen = signal(false);

  toggleDownloadMenu(e: Event) {
    e.stopPropagation();
    this.downloadMenuOpen.update(v => !v);
  }

  downloadReport(format: 'pdf' | 'excel' | 'word') {
    this.downloadMenuOpen.set(false);
    // TODO: connect to backend export endpoint
    alert(`Generando informe en formato ${format.toUpperCase()}...`);
  }

  // ── Dropdown close on outside click ───────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.at-multiselect')) {
      this.disciplineMenuOpen.set(false);
      this.categoriaMenuOpen.set(false);
    }
    if (!target.closest('.at-download-wrap')) {
      this.downloadMenuOpen.set(false);
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
