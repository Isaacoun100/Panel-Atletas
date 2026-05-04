import { Component, OnInit, HostListener, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';

interface Medalla { prueba: string; tipo: string; anio: string; }

@Component({
  selector: 'app-registrar-atleta',
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './registrar-atleta.html',
  styleUrl: './registrar-atleta.css',
})
export class RegistrarAtleta implements OnInit {

  // ── 1. Datos personales ───────────────────────────
  nombre = '';
  primerApellido = '';
  segundoApellido = '';
  tipoId = 'cedula';
  numeroId = '';
  contrasena = '';
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

  // ── 2. Encargado ──────────────────────────────────
  nombreEncargado = '';
  telefonoEncargado = '';

  // ── 3. Contacto ───────────────────────────────────
  telefono = '';
  correoManual = '';
  distrito = '';

  // ── 4. Actividad ──────────────────────────────────
  recRecreativa = false;
  recDeportiva = false;

  get showDeportiva(): boolean { return this.recDeportiva; }

  readonly disciplinasRecreativas = [
    'Aeróbicos', 'Yoga', 'Caminata', 'Baile', 'Zumba', 'Pilates', 'Natación recreativa',
  ];

  readonly disciplinasDeportivas = [
    'Natación', 'Atletismo', 'Fútbol', 'Gimnasia', 'Baloncesto',
    'Ciclismo', 'Voleibol', 'Para Tenis de Mesa', 'Tenis', 'Judo', 'Taekwondo',
  ];

  get disciplineOptions(): string[] {
    const opts: string[] = [];
    if (this.recRecreativa) opts.push(...this.disciplinasRecreativas);
    if (this.recDeportiva) opts.push(...this.disciplinasDeportivas);
    return opts;
  }

  onTipoChange() {
    const available = this.disciplineOptions;
    this.selectedDisciplines.update(list => list.filter(d => available.includes(d)));
    if (!this.recDeportiva) this.selectedCategorias.set([]);
  }

  esRepresentacion = '';

  disciplineMenuOpen = signal(false);
  selectedDisciplines = signal<string[]>([]);
  categoriaMenuOpen = signal(false);
  selectedCategorias = signal<string[]>([]);

  showCategoriaMenu = computed(() =>
    this.selectedDisciplines().includes('Para Tenis de Mesa')
  );

  readonly categorias = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  readonly frequencies = [1, 2, 3, 4, 5, 6, 7];

  // ── 5. Participación ──────────────────────────────
  participoJDN = '';
  participoInternacional = '';
  obtuvoPremio = '';

  medallas = signal<Medalla[]>([]);
  medallaTempPrueba = '';
  medallaTempTipo = '';
  medallaTempAnio = '';

  addMedalla() {
    if (!this.medallaTempPrueba.trim() || !this.medallaTempTipo || !this.medallaTempAnio) return;
    this.medallas.update(m => [...m, {
      prueba: this.medallaTempPrueba.trim(),
      tipo: this.medallaTempTipo,
      anio: this.medallaTempAnio,
    }]);
    this.medallaTempPrueba = '';
    this.medallaTempTipo = '';
    this.medallaTempAnio = '';
  }

  removeMedalla(i: number) {
    this.medallas.update(m => m.filter((_, idx) => idx !== i));
  }

  // ── 6. Seguimiento ────────────────────────────────
  frecuenciaSemanal = '';
  apoyoFamiliar = '';
  nivelSatisfaccion = '';

  // ── 7. Vínculo ────────────────────────────────────
  familiarComite = '';
  otraComite = '';
  nombreOtraComite = '';
  perteneceClub = '';
  nombreClub = '';

  // ── 8. Instalaciones ──────────────────────────────
  instalacionesAdecuadas = '';

  // ── 9. Inclusión ──────────────────────────────────
  tieneDiscapacidad = '';
  tipoDiscapacidad = '';
  descripcionDiscapacidad = '';
  clasificacionFuncional = '';
  categoriaFuncionalSel = '';

  // ── 10. Descargo ──────────────────────────────────
  autorizaDatos = '';
  aceptaVeracidad = '';

  get canSubmit(): boolean {
    return this.autorizaDatos === 'si' && this.aceptaVeracidad === 'si';
  }

  submitted = false;

  // ── Dropdown handlers ─────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('.ra-multiselect')) {
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

  constructor(private router: Router) {}
  ngOnInit() {}

  onSubmit() {
    if (this.canSubmit) {
      this.submitted = true;
    }
  }
}
