import { Component, OnInit, HostListener, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe, UpperCasePipe } from '@angular/common';
import { forkJoin, Observable } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { ProfileService } from '../core/services/profile.service';
import { AthleteService } from '../core/services/athlete.service';
import { DisciplinesService } from '../core/services/disciplines.service';
import { MedalsService } from '../core/services/medals.service';
import { StorageService } from '../core/services/storage.service';
import { Discipline } from '../core/models/discipline.model';
import { UserProfile } from '../core/models/profile.model';
import { Athlete, FunctionalClassificationCategory } from '../core/models/athlete.model';

interface Medalla { prueba: string; tipo: string; anio: string; }

@Component({
  selector: 'app-registrar-atleta',
  imports: [FormsModule, TitleCasePipe, UpperCasePipe],
  templateUrl: './registrar-atleta.html',
  styleUrl: './registrar-atleta.css',
})
export class RegistrarAtleta implements OnInit {
  private authService     = inject(AuthService);
  private profileService  = inject(ProfileService);
  private athleteService  = inject(AthleteService);
  private disciplinesService = inject(DisciplinesService);
  private medalsService   = inject(MedalsService);
  private storageService  = inject(StorageService);

  // ── Invite session ────────────────────────────────
  inviteToken   = '';
  userId        = '';
  emailFromToken = '';
  userRole      = signal<'admin' | 'athlete' | null>(null);
  isUpdatingPassword = signal(false);
  isSubmitting  = signal(false);
  submitError   = signal('');

  // ── 1. Datos personales ───────────────────────────
  nombre = '';
  primerApellido = '';
  segundoApellido = '';
  tipoId = 'cedula';
  numeroId = '';
  contrasena = '';
  confirmarContrasena = '';
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
  distrito = '';

  // ── 4. Actividad ──────────────────────────────────
  recRecreativa = false;
  recDeportiva = false;

  get showDeportiva(): boolean { return this.recDeportiva; }

  allDisciplines = signal<Discipline[]>([]);

  get disciplineOptions(): Discipline[] {
    return this.allDisciplines().filter(d =>
      (this.recRecreativa && d.discipline_type !== 'sport') ||
      (this.recDeportiva  && d.discipline_type === 'sport')
    );
  }

  onTipoChange() {
    const available = this.disciplineOptions.map(d => d.name);
    this.selectedDisciplines.update(list => list.filter(n => available.includes(n)));
    if (!this.recDeportiva) this.selectedCategorias.set([]);
  }

  esRepresentacion = '';

  disciplineMenuOpen = signal(false);
  selectedDisciplines = signal<string[]>([]);
  categoriaMenuOpen = signal(false);
  selectedCategorias = signal<string[]>([]);

  showCategoriaMenu = computed(() => this.selectedDisciplines().includes('Para Tenis de Mesa'));

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

  // ── Avatar (compress locally; upload deferred to submit) ─────────────
  avatarPreviewUrl = signal<string | null>(null);
  avatarBlob = signal<Blob | null>(null);
  avatarError = signal('');
  isUploadingAvatar = signal(false);

  async onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.avatarError.set('Solo se aceptan imágenes (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.avatarError.set('La imagen no puede superar los 2 MB.');
      return;
    }

    this.avatarError.set('');
    this.isUploadingAvatar.set(true);

    try {
      const blob = await this.compressImage(file);
      const old = this.avatarPreviewUrl();
      if (old?.startsWith('blob:')) URL.revokeObjectURL(old);
      this.avatarPreviewUrl.set(URL.createObjectURL(blob));
      this.avatarBlob.set(blob);
    } catch {
      this.avatarError.set('No se pudo procesar la imagen.');
    } finally {
      this.isUploadingAvatar.set(false);
    }
  }

  private compressImage(file: File, maxWidth = 400, quality = 0.82): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error('Compression failed')),
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
      img.src = url;
    });
  }

  // ── Wizard ────────────────────────────────────────
  currentStep = signal(1);
  stepError = signal('');

  totalSteps  = computed(() => this.userRole() === 'admin' ? 2 : 4);
  stepNumbers = computed(() => Array.from({ length: this.totalSteps() }, (_, i) => i + 1));
  stepLabels  = computed<string[]>(() =>
    this.userRole() === 'admin'
      ? ['Cuenta', 'Datos']
      : ['Cuenta', 'Datos', 'Actividad', 'Finalizar']
  );

  nextStep() {
    if (this.currentStep() === 1) {
      const err = this.validateStep1();
      if (err) { this.stepError.set(err); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      this.stepError.set('');
      this.isUpdatingPassword.set(true);

      this.authService.updatePassword(this.contrasena, this.inviteToken).subscribe({
        next: (res) => {
          const role = res.app_metadata?.role === 'admin' ? 'admin' : 'athlete';
          this.userRole.set(role);

          // Exchange invite token for a full session token so data API calls
          // (profile, athlete record, enrollments, storage) pass RLS checks.
          this.authService.signIn(this.emailFromToken, this.contrasena).subscribe({
            next: (session) => {
              localStorage.setItem('access_token', session.access_token);
              this.isUpdatingPassword.set(false);
              this.currentStep.update(s => s + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            error: () => {
              // Sign-in failed but password was set — proceed with invite token
              this.isUpdatingPassword.set(false);
              this.currentStep.update(s => s + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            },
          });
        },
        error: (err) => {
          console.error('Password update error:', err);
          this.stepError.set('No se pudo actualizar la contraseña. Intente nuevamente.');
          this.isUpdatingPassword.set(false);
        },
      });
      return;
    }

    const err = this.validateCurrentStep();
    if (err) { this.stepError.set(err); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    this.stepError.set('');
    if (this.currentStep() < this.totalSteps()) {
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
      case 2: return this.validateStep2();
      case 3: return this.validateStep3();
      default: return null;
    }
  }

  private validateStep1(): string | null {
    if (!this.contrasena.trim()) return 'La contraseña es requerida.';
    if (this.contrasena.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (!this.confirmarContrasena.trim()) return 'Confirmá tu contraseña.';
    if (this.contrasena !== this.confirmarContrasena) return 'Las contraseñas no coinciden.';
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
    if (!this.telefono.trim()) return 'El teléfono es requerido.';
    return null;
  }

  private validateStep3(): string | null {
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
    if (!this.distrito) return 'El distrito de residencia es requerido.';
    return null;
  }

  // ── Submit ────────────────────────────────────────
  onSubmit() {
    if (this.isSubmitting()) return;
    if (this.userRole() === 'athlete' && !this.canSubmit) return;
    this.submitError.set('');
    this.isSubmitting.set(true);

    // id_user and role are injected by DB triggers — do not send them
    const profilePayload: Partial<UserProfile> = {
      name: this.nombre,
      first_last_name: this.primerApellido,
      second_last_name: this.segundoApellido,
      dni_type: this.tipoId as UserProfile['dni_type'],
      dni: this.numeroId,
      birth_date: this.fechaNacimiento,
      sex: this.sexo === 'M' ? 'male' : 'female',
      profile_image_url: null,
    };

    if (this.userRole() === 'admin') {
      this.profileService.createProfile(profilePayload).subscribe({
        next: () => this.uploadAvatarThenFinish(),
        error: (err) => {
          console.error('Profile create error:', err);
          this.submitError.set('Ocurrió un error al guardar. Intente nuevamente.');
          this.isSubmitting.set(false);
        },
      });
      return;
    }

    // id_user injected by set_athlete_id_from_auth trigger — do not send it
    const athletePayload: Partial<Athlete> = {
      phone: this.telefono,
      district_of_residence: this.mapDistrito(this.distrito) as Athlete['district_of_residence'],
      legal_guardian_name:  this.esMinor ? this.nombreEncargado  : null,
      legal_guardian_phone: this.esMinor ? this.telefonoEncargado : null,
      nacional_games_participation: this.participoJDN === 'si',
      international_games_participation: this.participoInternacional === 'si',
      weekly_exercise: this.frecuenciaSemanal ? parseInt(this.frecuenciaSemanal) : 0,
      has_family_support: this.apoyoFamiliar === 'si',
      satisfaction_level: this.mapSatisfaction(this.nivelSatisfaccion) as Athlete['satisfaction_level'],
      has_family_in_committee: this.familiarComite === 'si',
      has_previous_committee: this.otraComite === 'si',
      previous_committee_name: this.otraComite === 'si' ? this.nombreOtraComite : null,
      is_club_member: this.perteneceClub === 'si',
      club_name: this.perteneceClub === 'si' ? this.nombreClub : null,
      facility_satisfaction_level: this.mapFacility(this.instalacionesAdecuadas) as Athlete['facility_satisfaction_level'],
      has_disability: this.tieneDiscapacidad === 'si',
      disability_type: this.tieneDiscapacidad === 'si' ? this.mapDisability(this.tipoDiscapacidad) as Athlete['disability_type'] : null,
      disability_description: this.tieneDiscapacidad === 'si' ? this.descripcionDiscapacidad : null,
      has_functional_classification: this.tieneDiscapacidad === 'si' && this.clasificacionFuncional === 'si',
      classification_category: (this.tieneDiscapacidad === 'si' && this.clasificacionFuncional === 'si')
        ? this.categoriaFuncionalSel.toLowerCase() as FunctionalClassificationCategory
        : null,
      classification_document_url: null,
      accepts_data_usage: this.autorizaDatos === 'si',
      accepts_info_accuracy: this.aceptaVeracidad === 'si',
    };

    // Sequential: profile must be committed before athlete RLS check runs
    this.profileService.createProfile(profilePayload).subscribe({
      next: () => {
        this.athleteService.createAthleteRecord(athletePayload).subscribe({
          next: () => this.uploadAvatarThenEnrollDisciplines(),
          error: (err) => {
            console.error('Athlete create error:', err);
            this.submitError.set('Ocurrió un error al guardar el registro de atleta. Intente nuevamente.');
            this.isSubmitting.set(false);
          },
        });
      },
      error: (err) => {
        console.error('Profile create error:', err);
        this.submitError.set('Ocurrió un error al guardar el perfil. Intente nuevamente.');
        this.isSubmitting.set(false);
      },
    });
  }

  private uploadAvatarThenFinish() {
    const blob = this.avatarBlob();
    if (!blob) { this.isSubmitting.set(false); this.finishRegistration(); return; }

    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    this.storageService.uploadAvatar(this.userId, file).subscribe({
      next: () => {
        this.profileService.updateOwnProfile(this.userId, {
          profile_image_url: `avatars/${this.userId}/avatar.jpg`,
        }).subscribe();
        this.isSubmitting.set(false);
        this.finishRegistration();
      },
      error: () => { // avatar upload non-fatal
        this.isSubmitting.set(false);
        this.finishRegistration();
      },
    });
  }

  private uploadAvatarThenEnrollDisciplines() {
    const blob = this.avatarBlob();
    const enroll = () => {
      const disciplines = this.allDisciplines();
      const enrollments: Observable<unknown>[] = this.selectedDisciplines()
        .map(name => disciplines.find(d => d.name === name))
        .filter((d): d is Discipline => !!d)
        .map(d => this.disciplinesService.enrollInDiscipline(
          d.id_discipline,
          d.discipline_type === 'sport' && this.esRepresentacion === 'si'
        ));

      const medalOps: Observable<unknown>[] = this.medallas()
        .filter(m => m.prueba.trim() && m.tipo && m.anio)
        .map(m => this.medalsService.createMedal({
          id_user: this.userId,
          competition_name: m.prueba.trim(),
          year: Number(m.anio),
          medal_type: this.mapMedalType(m.tipo),
        }));

      const all = [...enrollments, ...medalOps];
      if (all.length === 0) {
        this.isSubmitting.set(false); this.finishRegistration(); return;
      }
      forkJoin(all).subscribe({
        next: () => { this.isSubmitting.set(false); this.finishRegistration(); },
        error: () => { this.isSubmitting.set(false); this.finishRegistration(); },
      });
    };

    if (!blob) { enroll(); return; }

    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    this.storageService.uploadAvatar(this.userId, file).subscribe({
      next: () => {
        this.profileService.updateOwnProfile(this.userId, {
          profile_image_url: `avatars/${this.userId}/avatar.jpg`,
        }).subscribe();
        enroll();
      },
      error: () => enroll(), // avatar upload non-fatal
    });
  }

  private finishRegistration() {
    localStorage.removeItem('access_token');
    this.submitted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => this.router.navigate(['/inicio-sesion']), 3000);
  }

  // ── Mapping helpers ───────────────────────────────
  private mapDistrito(v: string): string {
    const m: Record<string, string> = { 'san-pedro': 'san_pedro', sabanilla: 'sabanilla', mercedes: 'mercedes', 'san-rafael': 'san_rafael', otro: 'other' };
    return m[v] ?? v;
  }

  private mapSatisfaction(v: string): string {
    const m: Record<string, string> = { 'muy-satisfecho': 'very_satisfied', satisfecho: 'satisfied', insatisfecho: 'neutral', 'muy-insatisfecho': 'dissatisfied' };
    return m[v] ?? v;
  }

  private mapFacility(v: string): string {
    const m: Record<string, string> = { si: 'yes', no: 'no', parcialmente: 'partial' };
    return m[v] ?? v;
  }

  private mapDisability(v: string): string {
    const m: Record<string, string> = { fisica: 'physical', cognitiva: 'cognitive' };
    return m[v] ?? v;
  }

  private mapMedalType(v: string): string {
    const m: Record<string, string> = { oro: 'gold', plata: 'silver', bronce: 'bronze' };
    return m[v] ?? v;
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

  toggleDiscipline(name: string) {
    const cur = this.selectedDisciplines();
    if (cur.includes(name)) {
      this.selectedDisciplines.set(cur.filter(x => x !== name));
      if (name === 'Para Tenis de Mesa') this.selectedCategorias.set([]);
    } else {
      this.selectedDisciplines.set([...cur, name]);
    }
  }

  toggleCategoria(c: string) {
    const cur = this.selectedCategorias();
    this.selectedCategorias.set(cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c]);
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

    // Extract invite token from URL hash (#access_token=...&type=invite)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    const type  = params.get('type');

    if (!token || type !== 'invite') {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userId        = payload.sub   ?? '';
      this.emailFromToken = payload.email ?? '';
    } catch {
      this.router.navigate(['/inicio-sesion']);
      return;
    }

    this.inviteToken = token;
    localStorage.setItem('access_token', token);

    this.disciplinesService.getActiveDisciplines().subscribe({
      next: (data) => this.allDisciplines.set(data as Discipline[]),
      error: (err) => console.error('Failed to load disciplines:', err),
    });
  }

  toggleTheme() {
    const next = !this.isDark();
    this.isDark.set(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }
}
