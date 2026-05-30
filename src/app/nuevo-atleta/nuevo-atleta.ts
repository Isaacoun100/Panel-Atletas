import { Component, OnInit, HostListener, signal, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { AdminInvitationsService } from '../core/services/admin-invitations.service';

interface Medalla { prueba: string; tipo: string; anio: string; }

@Component({
  selector: 'app-nuevo-atleta',
  imports: [RouterLink, RouterLinkActive, FormsModule, TitleCasePipe],
  templateUrl: './nuevo-atleta.html',
  styleUrl: './nuevo-atleta.css',
})
export class NuevoAtleta implements OnInit {
  private adminInvitationsService = inject(AdminInvitationsService);

  isDark = signal(false);
  activeTab = signal<'email' | 'manual'>('email');

  // ── Email invitation ──────────────────────────────
  emailInput = '';
  emailList = signal<string[]>([]);
  emailError = signal('');
  invitacionesEnviadas = signal(false);
  enviandoInvitaciones = signal(false);
  invitacionesError = signal('');

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

  // ── 2. Encargado (if < 18) ────────────────────────
  nombreEncargado = '';
  telefonoEncargado = '';

  // ── 3. Contacto ───────────────────────────────────
  telefono = '';
  correoManual = '';
  distrito = '';

  // ── 4. Actividad ──────────────────────────────────
  recRecreativa = false;
  recDeportiva = false;

  // Computed: show deportiva-only sections
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

  // Discipline multi-select
  disciplineMenuOpen = signal(false);
  selectedDisciplines = signal<string[]>([]);
  categoriaMenuOpen = signal(false);
  selectedCategorias = signal<string[]>([]);

  showCategoriaMenu = computed(() =>
    this.selectedDisciplines().includes('Para Tenis de Mesa')
  );

  readonly categorias = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  readonly frequencies = [1, 2, 3, 4, 5, 6, 7];

  // ── 5. Participación (deportiva only) ────────────
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
  apoyoFamiliar = '';   // deportiva only
  nivelSatisfaccion = '';

  // ── 7. Vínculo con el Comité ──────────────────────
  familiarComite = '';  // deportiva only
  otraComite = '';
  nombreOtraComite = '';
  perteneceClub = '';   // deportiva only
  nombreClub = '';

  // ── 8. Instalaciones ──────────────────────────────
  instalacionesAdecuadas = '';

  // ── 9. Inclusión (deportiva only) ─────────────────
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

  sendInvitations() {
    const pendingEmail = this.emailInput.trim();
    if (pendingEmail) {
      this.addEmail();
    }

    const emails = this.emailList();
    if (this.emailError() || emails.length === 0 || this.enviandoInvitaciones()) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      this.invitacionesError.set('No hay sesión activa. Inicie sesión nuevamente.');
      return;
    }

    this.enviandoInvitaciones.set(true);
    this.invitacionesError.set('');
    this.invitacionesEnviadas.set(false);

    this.adminInvitationsService.inviteUsers(emails, 'athlete').subscribe({
      next: () => {
        this.invitacionesEnviadas.set(true);
        this.emailList.set([]);
        this.emailInput = '';
        this.enviandoInvitaciones.set(false);
        setTimeout(() => this.invitacionesEnviadas.set(false), 4000);
      },
      error: (err) => {
        console.error('Error enviando invitaciones:', err);
        this.invitacionesError.set(this.getInvitationErrorMessage(err));
        this.enviandoInvitaciones.set(false);
      }
    });
  }

  private getInvitationErrorMessage(err: unknown): string {
    if (typeof err === 'object' && err !== null && 'error' in err) {
      const errorBody = (err as { error?: unknown }).error;
      if (typeof errorBody === 'string') return errorBody;
      if (typeof errorBody === 'object' && errorBody !== null && 'message' in errorBody) {
        const message = (errorBody as { message?: unknown }).message;
        if (typeof message === 'string') return message;
      }
    }

    return 'No se pudieron enviar las invitaciones. Intente nuevamente.';
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
