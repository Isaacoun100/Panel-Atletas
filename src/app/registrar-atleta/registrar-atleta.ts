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

  // ── Wizard steps ──────────────────────────────────
  currentStep = signal(1);
  stepError = signal('');
  readonly TOTAL_STEPS = 5;
  readonly stepLabels = ['Cuenta', 'Datos', 'Contacto', 'Actividad', 'Finalizar'];
  readonly stepNumbers = [1, 2, 3, 4, 5];

  nextStep() {
    const err = this.validateCurrentStep();
    if (err) {
      this.stepError.set(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    this.stepError.set('');
    if (this.currentStep() < this.TOTAL_STEPS) {
      this.currentStep.update(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep() {
    this.stepError.set('');
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private validateCurrentStep(): string | null {
    switch (this.currentStep()) {
      case 1: return this.validateStep1();
      case 2: return this.validateStep2();
      case 3: return this.validateStep3();
      case 4: return this.validateStep4();
      default: return null;
    }
  }

  private validateStep1(): string | null {
    if (!this.correoManual.trim()) return 'El correo electrónico es requerido.';
    if (!this.correoManual.includes('@')) return 'Ingrese un correo electrónico válido.';
    if (!this.contrasena.trim()) return 'La contraseña es requerida.';
    if (this.contrasena.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    return null;
  }

  private validateStep2(): string | null {
    if (!this.nombre.trim()) return 'El nombre es requerido.';
    if (!this.primerApellido.trim()) return 'El primer apellido es requerido.';
    if (!this.segundoApellido.trim()) return 'El segundo apellido es requerido.';
    if (!this.numeroId.trim()) return 'El número de identificación es requerido.';
    if (!this.fechaNacimiento) return 'La fecha de nacimiento es requerida.';
    if (!this.sexo) return 'El sexo es requerido.';
    if (this.esMinor) {
      if (!this.nombreEncargado.trim()) return 'El nombre del encargado es requerido.';
      if (!this.telefonoEncargado.trim()) return 'El teléfono del encargado es requerido.';
    }
    return null;
  }

  private validateStep3(): string | null {
    if (!this.telefono.trim()) return 'El teléfono es requerido.';
    if (!this.distrito) return 'El distrito de residencia es requerido.';
    return null;
  }

  private validateStep4(): string | null {
    if (!this.recRecreativa && !this.recDeportiva) return 'Seleccione al menos un tipo de actividad.';
    if (this.selectedDisciplines().length === 0) return 'Seleccione al menos una disciplina.';
    if (this.showDeportiva) {
      if (!this.esRepresentacion) return '¿Representa al comité competitivamente? es requerido.';
      if (!this.participoJDN) return '¿Ha participado en Juegos Deportivos Nacionales? es requerido.';
      if (!this.participoInternacional) return '¿Ha participado en competencias internacionales? es requerido.';
      if (!this.obtuvoPremio) return '¿Ha obtenido medallas? es requerido.';
    }
    if (!this.frecuenciaSemanal) return 'La frecuencia semanal es requerida.';
    if (this.showDeportiva && !this.apoyoFamiliar) return '¿Cuenta con apoyo familiar? es requerido.';
    if (!this.nivelSatisfaccion) return 'El nivel de satisfacción es requerido.';
    return null;
  }

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

  isDark = signal(false);

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

  onSubmit() {
    if (this.canSubmit) {
      this.submitted = true;
    }
  }
}
