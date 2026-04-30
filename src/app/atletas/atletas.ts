import { Component, OnInit, HostListener, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-atletas',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './atletas.html',
  styleUrl: './atletas.css',
})
export class Atletas implements OnInit {
  isDark = signal(false);

  // Dropdown open state
  disciplineMenuOpen = signal(false);
  categoriaMenuOpen = signal(false);

  // Selected filter values
  selectedDisciplines = signal<string[]>([]);
  selectedCategorias = signal<string[]>([]);
  selectedSex = signal('');
  minAge: number | null = null;
  maxAge: number | null = null;

  // Show categoría menu only when "Para Tenis de Mesa" is selected
  showCategoriaMenu = computed(() =>
    this.selectedDisciplines().includes('Para Tenis de Mesa')
  );

  readonly disciplines = [
    'Natación', 'Atletismo', 'Fútbol', 'Gimnasia',
    'Baloncesto', 'Ciclismo', 'Voleibol', 'Para Tenis de Mesa',
  ];

  readonly categorias = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  constructor(private router: Router) {}

  ngOnInit() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      this.isDark.set(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

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
    const current = this.selectedDisciplines();
    if (current.includes(d)) {
      this.selectedDisciplines.set(current.filter(x => x !== d));
      if (d === 'Para Tenis de Mesa') this.selectedCategorias.set([]);
    } else {
      this.selectedDisciplines.set([...current, d]);
    }
  }

  toggleCategoria(c: string) {
    const current = this.selectedCategorias();
    this.selectedCategorias.set(
      current.includes(c) ? current.filter(x => x !== c) : [...current, c]
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
