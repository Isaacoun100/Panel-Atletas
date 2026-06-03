import { Component, OnInit, HostListener, signal, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { DisciplinesService } from '../core/services/disciplines.service';
import { DistrictOfResidence, FunctionalClassificationCategory, SatisfactionLevel } from '../core/models/athlete.model';
import { Discipline } from '../core/models/discipline.model';
import { MedalType } from '../core/models/medal.model';
import { RegisterUserDniType, RegisterUserSex } from '../core/models/auth.model';

interface Medalla { prueba: string; tipo: string; anio: string; }

@Component({
  selector: 'app-nuevo-atleta',
  imports: [RouterLink, RouterLinkActive, FormsModule, TitleCasePipe],
  templateUrl: './nuevo-atleta.html',
  styleUrl: './nuevo-atleta.css',
})
export class NuevoAtleta implements OnInit {
  private authService = inject(AuthService);
  private disciplinesService = inject(DisciplinesService);
  private router = inject(Router);

  isDark = signal(false);
  activeTab = signal<'email' | 'manual'>('email');
  isSubmitting = signal(false);
  isLoadingDisciplines = signal(false);
  manualError = signal('');
  manualSuccess = signal('');

  // ── Email invitation ──────────────────────────────
  emailInput = '';
  emailList = signal<string[]>([]);
  emailError = signal('');
  invitacionesEnviadas = signal(false);

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

  get esMinor(): boolean { return Boolean(this.fechaNacimiento) && this.edad < 18; }

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

  disciplinas = signal<Discipline[]>([]);

  get disciplineOptions(): string[] {
    return this.disciplinas()
      .filter(d =>
        (this.recRecreativa && d.discipline_type === 'recreational') ||
        (this.recDeportiva && d.discipline_type === 'sport')
      )
      .map(d => d.name);
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
  classificationDocumentUrl = '';

  // ── 10. Descargo ──────────────────────────────────
  autorizaDatos = '';
  aceptaVeracidad = '';

  get canSubmit(): boolean {
    return this.autorizaDatos === 'si' && this.aceptaVeracidad === 'si' && !this.isSubmitting();
  }

  private required(value: string): boolean {
    return Boolean(value.trim());
  }

  private validateManualForm(): string {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correoManual.trim());
    const birthDate = new Date(`${this.fechaNacimiento}T00:00:00`);

    if (!this.required(this.nombre) || !this.required(this.primerApellido) || !this.required(this.segundoApellido)) return 'Complete el nombre y los apellidos.';
    if (!this.required(this.numeroId)) return 'Ingrese el numero de identificacion.';
    if (this.contrasena.length < 6) return 'La contrasena debe tener al menos 6 caracteres.';
    if (!this.fechaNacimiento || Number.isNaN(birthDate.getTime()) || birthDate > new Date()) return 'Ingrese una fecha de nacimiento valida.';
    if (!this.sexo) return 'Seleccione el sexo.';
    if (this.esMinor && (!this.required(this.nombreEncargado) || !this.required(this.telefonoEncargado))) return 'Complete la informacion del encargado para el atleta menor de edad.';
    if (!this.required(this.telefono)) return 'Ingrese el telefono del atleta.';
    if (!emailValid) return 'Ingrese un correo electronico valido.';
    if (!this.distrito) return 'Seleccione el distrito de residencia.';
    if (!this.recRecreativa && !this.recDeportiva) return 'Seleccione al menos un tipo de actividad.';
    if (this.selectedDisciplines().length === 0) return 'Seleccione al menos una disciplina.';
    if (this.recDeportiva && !this.esRepresentacion) return 'Indique si el atleta representa al comite competitivamente.';
    if (this.recDeportiva && (!this.participoJDN || !this.participoInternacional || !this.obtuvoPremio)) return 'Complete la informacion de participacion deportiva.';
    if (this.recDeportiva && this.obtuvoPremio === 'si' && this.medallas().length === 0) return 'Agregue al menos una medalla.';
    if (!this.frecuenciaSemanal || !this.nivelSatisfaccion) return 'Complete la frecuencia semanal y el nivel de satisfaccion.';
    if (this.recDeportiva && !this.apoyoFamiliar) return 'Indique si cuenta con apoyo familiar.';
    if (!this.otraComite) return 'Indique si pertenecio a otro comite.';
    if (this.otraComite === 'si' && !this.required(this.nombreOtraComite)) return 'Ingrese el nombre del comite anterior.';
    if (this.recDeportiva && !this.familiarComite) return 'Indique si tiene familiares en el comite.';
    if (this.recDeportiva && !this.perteneceClub) return 'Indique si pertenece a algun club.';
    if (this.perteneceClub === 'si' && !this.required(this.nombreClub)) return 'Ingrese el nombre del club.';
    if (!this.instalacionesAdecuadas) return 'Indique si las instalaciones son adecuadas.';
    if (this.recDeportiva && !this.tieneDiscapacidad) return 'Indique si tiene alguna discapacidad.';
    if (this.tieneDiscapacidad === 'si' && (!this.tipoDiscapacidad || !this.required(this.descripcionDiscapacidad))) return 'Complete el tipo y la descripcion de la discapacidad.';
    if (this.recDeportiva && !this.clasificacionFuncional) return 'Indique si tiene clasificacion funcional.';
    if (this.clasificacionFuncional === 'si' && !this.categoriaFuncionalSel) return 'Seleccione la categoria de clasificacion funcional.';
    if (this.autorizaDatos !== 'si' || this.aceptaVeracidad !== 'si') return 'Debe aceptar el uso de datos y la veracidad de la informacion.';
    return '';
  }

  private toBoolean(value: string): boolean {
    return value === 'si';
  }

  private toFacilitySatisfactionLevel(): 'yes' | 'no' | 'partial' {
    if (this.instalacionesAdecuadas === 'si') return 'yes';
    if (this.instalacionesAdecuadas === 'parcialmente') return 'partial';
    return 'no';
  }

  private toFunctionalClassificationCategory(): FunctionalClassificationCategory | null {
    if (!this.recDeportiva || this.clasificacionFuncional !== 'si') return null;
    return this.categoriaFuncionalSel.toLowerCase() as FunctionalClassificationCategory;
  }

  private getApiError(error: unknown): string {
    const apiError = error as {
      error?: string | { msg?: string; message?: string; error?: string; error_description?: string; details?: string };
      message?: string;
      status?: number;
      statusText?: string;
    };

    if (typeof apiError.error === 'string') return apiError.error;

    const message =
      apiError.error?.msg ||
      apiError.error?.message ||
      apiError.error?.error ||
      apiError.error?.error_description ||
      apiError.error?.details ||
      apiError.message;

    if (message) return message;
    if (apiError.status) return `Error ${apiError.status}${apiError.statusText ? `: ${apiError.statusText}` : ''}`;

    return 'No fue posible registrar el atleta.';
  }

  async registerAthlete() {
    this.manualError.set('');
    this.manualSuccess.set('');

    if (!localStorage.getItem('access_token')) {
      this.manualError.set('No hay una sesion administrativa activa.');
      return;
    }

    const validationError = this.validateManualForm();
    if (validationError) {
      this.manualError.set(validationError);
      return;
    }

    this.isSubmitting.set(true);
    try {
      const selectedDisciplines = this.disciplinas().filter(d => this.selectedDisciplines().includes(d.name));
      const medalTypes: Record<string, MedalType> = { oro: 'gold', plata: 'silver', bronce: 'bronze' };
      const payload = {
        email: this.correoManual.trim().toLowerCase(),
        password: this.contrasena,
        name: this.nombre.trim(),
        first_last_name: this.primerApellido.trim(),
        dni_type: this.tipoId as RegisterUserDniType,
        dni: this.numeroId.trim(),
        birth_date: this.fechaNacimiento,
        sex: (this.sexo === 'M' ? 'male' : 'female') as RegisterUserSex,
        ...(this.segundoApellido.trim() ? { second_last_name: this.segundoApellido.trim() } : {}),
        phone: this.telefono.trim(),
        district_of_residence: this.distrito as DistrictOfResidence,
        legal_guardian_name: this.esMinor ? this.nombreEncargado.trim() : null,
        legal_guardian_phone: this.esMinor ? this.telefonoEncargado.trim() : null,
        nacional_games_participation: this.recDeportiva && this.toBoolean(this.participoJDN),
        international_games_participation: this.recDeportiva && this.toBoolean(this.participoInternacional),
        weekly_exercise: Number(this.frecuenciaSemanal),
        has_family_support: this.recDeportiva && this.toBoolean(this.apoyoFamiliar),
        satisfaction_level: this.nivelSatisfaccion as SatisfactionLevel,
        has_family_in_committee: this.recDeportiva && this.toBoolean(this.familiarComite),
        has_previous_committee: this.toBoolean(this.otraComite),
        previous_committee_name: this.otraComite === 'si' ? this.nombreOtraComite.trim() : null,
        is_club_member: this.recDeportiva && this.toBoolean(this.perteneceClub),
        club_name: this.recDeportiva && this.perteneceClub === 'si' ? this.nombreClub.trim() : null,
        facility_satisfaction_level: this.toFacilitySatisfactionLevel(),
        has_disability: this.recDeportiva && this.toBoolean(this.tieneDiscapacidad),
        disability_type: this.recDeportiva && this.tieneDiscapacidad === 'si' ? (this.tipoDiscapacidad === 'fisica' ? 'physical' : 'cognitive') : null,
        disability_description: this.recDeportiva && this.tieneDiscapacidad === 'si' ? this.descripcionDiscapacidad.trim() : null,
        has_functional_classification: this.recDeportiva && this.toBoolean(this.clasificacionFuncional),
        classification_category: this.toFunctionalClassificationCategory(),
        classification_document_url: this.recDeportiva && this.clasificacionFuncional === 'si' ? this.classificationDocumentUrl.trim() || null : null,
        accepts_data_usage: true,
        accepts_info_accuracy: true,
        disciplines: selectedDisciplines.map(d => ({
          id: d.id_discipline,
          is_representative: d.discipline_type === 'sport' && this.toBoolean(this.esRepresentacion)
        })),
        medals: this.recDeportiva && this.obtuvoPremio === 'si'
          ? this.medallas().map(m => ({
              competition_name: m.prueba,
              year: Number(m.anio),
              medal_type: medalTypes[m.tipo]
            }))
          : []
      };

      await firstValueFrom(this.authService.adminRegisterAthlete(payload));

      this.manualSuccess.set('Atleta registrado correctamente.');
      setTimeout(() => this.router.navigate(['/atletas']), 1200);
    } catch (error) {
      console.error('Error registrando atleta:', error);
      this.manualError.set(this.getApiError(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  loadDisciplines() {
    this.isLoadingDisciplines.set(true);
    this.disciplinesService.getActiveDisciplines().subscribe({
      next: data => {
        this.disciplinas.set(data as Discipline[]);
        this.isLoadingDisciplines.set(false);
      },
      error: error => {
        console.error('Error cargando disciplinas:', error);
        this.manualError.set('No fue posible cargar las disciplinas activas.');
        this.isLoadingDisciplines.set(false);
      }
    });
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
    // TODO: connect to backend
    this.invitacionesEnviadas.set(true);
    this.emailList.set([]);
    this.emailInput = '';
    setTimeout(() => this.invitacionesEnviadas.set(false), 4000);
  }

  // ── Theme & auth ──────────────────────────────────
  ngOnInit() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      this.isDark.set(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    this.loadDisciplines();
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
