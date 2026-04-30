import { Component, OnInit, HostListener, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nuevo-atleta',
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './nuevo-atleta.html',
  styleUrl: './nuevo-atleta.css',
})
export class NuevoAtleta implements OnInit {
  isDark = signal(false);
  activeTab = signal<'email' | 'manual'>('email');

  // ── Email invitation ──────────────────────────────
  emailInput = '';
  emailList = signal<string[]>([]);
  emailError = signal('');

  // ── Datos personales ──────────────────────────────
  nombre = '';
  primerApellido = '';
  segundoApellido = '';
  tipoId = 'cedula';
  numeroId = '';
  fechaNacimiento = '';
  sexo = '';

  get edad(): number {
    if (!this.fechaNacimiento) return 0;
    const hoy = new Date();
    const nac = new Date(this.fechaNacimiento);
    let age = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) age--;
    return age > 0 ? age : 0;
  }

  get esMinor(): boolean { return this.edad > 0 && this.edad < 18; }

  // ── Encargado (if < 18) ───────────────────────────
  nombreEncargado = '';
  telefonoEncargado = '';

  // ── Contacto y residencia ─────────────────────────
  telefono = '';
  correoManual = '';
  distrito = '';
  direccionExacta = '';
  residePermanente = '';
  canton = '';

  get mostrarCanton(): boolean { return this.residePermanente === 'no'; }

  // ── Educación y empleo ────────────────────────────
  nivelEducativo = '';
  trabaja = '';
  ocupacion = '';

  // ── Actividad deportiva ───────────────────────────
  recRecreativa = false;
  recDeportiva = false;
  esRepresentacion = '';
  horario = '';

  disciplineMenuOpen = signal(false);
  selectedDisciplines = signal<string[]>([]);
  categoriaMenuOpen = signal(false);
  selectedCategorias = signal<string[]>([]);

  showCategoriaMenu = computed(() =>
    this.selectedDisciplines().includes('Para Tenis de Mesa')
  );

  readonly disciplines = [
    'Natación', 'Atletismo', 'Fútbol', 'Gimnasia',
    'Baloncesto', 'Ciclismo', 'Voleibol', 'Para Tenis de Mesa',
  ];
  readonly categorias = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  // ── Participación y logros ────────────────────────
  participoJDN = '';
  participoRegional = '';
  participoInternacional = '';
  obtuvoPremio = '';
  tipoPremio = '';
  disciplinaPremio = '';
  anioPremio = '';

  // ── Objetivos y motivación ────────────────────────
  objetivoPrincipal = '';
  frecuenciaSemanal = '';
  abandonoProgramas = '';
  apoyoFamiliar = '';
  nivelSatisfaccion = '';

  // ── Salud ─────────────────────────────────────────
  condicionMedica = '';
  alergias = '';
  condicionSaludMental = '';
  requiereAdaptacion = '';
  seguroMedico = '';

  // ── Vínculo con el Comité ─────────────────────────
  familiarComite = '';
  nombreFamiliar = '';
  relacionFamiliar = '';
  disciplinaFamiliar = '';
  otraComite = '';
  nombreOtraComite = '';
  perteneceClub = '';
  nombreClub = '';

  // ── Instalaciones y accesibilidad ─────────────────
  instalacionesAdecuadas = '';
  limitacionFisica = '';
  requiereTransporte = '';
  tieneImplementos = '';

  // ── Comunicación ──────────────────────────────────
  comoSeEntero = '';
  desearRecibir = '';
  medioPreferido = '';

  // ── Descargo ──────────────────────────────────────
  autorizaDatos = '';
  autorizaImagen = '';
  firmaNombre = '';

  // ── Dropdown handlers ─────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('.na-multiselect')) {
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
    return n === 0 ? 'Seleccionar disciplinas' : `${n} disciplina${n > 1 ? 's' : ''}`;
  }

  categoriaLabel() {
    const n = this.selectedCategorias().length;
    return n === 0 ? 'Categoría funcional' : `${n} categoría${n > 1 ? 's' : ''}`;
  }

  // ── Email handlers ────────────────────────────────
  addEmail() {
    const value = this.emailInput.trim().toLowerCase();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!value) return;
    if (!valid) { this.emailError.set('Correo inválido'); return; }
    if (this.emailList().includes(value)) { this.emailError.set('Ya está en la lista'); return; }
    this.emailList.update(list => [...list, value]);
    this.emailInput = '';
    this.emailError.set('');
  }

  removeEmail(email: string) {
    this.emailList.update(list => list.filter(e => e !== email));
  }

  onEmailKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); this.addEmail(); }
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
