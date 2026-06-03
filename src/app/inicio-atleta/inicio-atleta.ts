import { Component, OnInit, HostListener, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe, UpperCasePipe } from '@angular/common';
import { forkJoin, Observable } from 'rxjs';
import { AthleteService } from '../core/services/athlete.service';
import { ProfileService } from '../core/services/profile.service';
import { DisciplinesService } from '../core/services/disciplines.service';
import { MedalsService } from '../core/services/medals.service';
import { StorageService } from '../core/services/storage.service';
import { Athlete } from '../core/models/athlete.model';
import { UserProfile } from '../core/models/profile.model';
import { Discipline, UserDiscipline } from '../core/models/discipline.model';
import { Medal } from '../core/models/medal.model';

interface MedalForm { id?: string; prueba: string; tipo: string; anio: string; }

@Component({
  selector: 'app-inicio-atleta',
  imports: [FormsModule, TitleCasePipe, UpperCasePipe],
  templateUrl: './inicio-atleta.html',
  styleUrl: './inicio-atleta.css',
})
export class InicioAtleta implements OnInit {
  private athleteService = inject(AthleteService);
  private profileService = inject(ProfileService);
  private disciplinesService = inject(DisciplinesService);
  private medalsService = inject(MedalsService);
  private storageService = inject(StorageService);

  constructor(private router: Router) {}

  isDark = signal(false);
  isLoading = signal(true);
  isSaving = signal(false);
  saveSuccess = signal(false);
  saveError = signal('');

  // ── Avatar ────────────────────────────────────────
  avatarUrl = signal<string | null>(null);
  isUploadingAvatar = signal(false);
  avatarUploadError = signal('');

  // ── Clasificación document ────────────────────────
  clasificacionDocUploaded = signal(false);
  isUploadingClasificacion = signal(false);
  clasificacionUploadError = signal('');

  emailAtleta = '';
  userId = '';

  private originalProfile: Partial<UserProfile> | null = null;
  private originalAthlete: Partial<Athlete> | null = null;
  private originalEnrollments: UserDiscipline[] = [];

  allDisciplinesSignal = signal<Discipline[]>([]);

  // ── 1. Datos personales ───────────────────────────
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

  // ── 2. Encargado ──────────────────────────────────
  nombreEncargado = '';
  telefonoEncargado = '';

  // ── 3. Contacto ───────────────────────────────────
  telefono = '';
  distrito = '';

  // ── 4. Actividad ──────────────────────────────────
  showDeportiva = computed(() =>
    this.selectedDisciplines().some(name => {
      const disc = this.allDisciplinesSignal().find(d => d.name === name);
      return disc?.discipline_type === 'sport';
    })
  );

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

  // Medals — each operation hits the API immediately
  medallas = signal<MedalForm[]>([]);
  addMedalError = signal('');
  isAddingMedal = signal(false);
  isDeletingMedalIdx = signal<number | null>(null);
  isEditSaving = signal(false);

  // Temp fields for adding a new medal
  medallaTempPrueba = '';
  medallaTempTipo = '';
  medallaTempAnio: string | number = '';

  // Inline-edit state
  editingMedalIdx = signal<number | null>(null);
  editPrueba = '';
  editTipo = '';
  editAnio: string | number = '';

  addMedalla() {
    if (!this.medallaTempPrueba.trim() || !this.medallaTempTipo || !this.medallaTempAnio) {
      this.addMedalError.set('Completa todos los campos antes de agregar.');
      return;
    }
    this.addMedalError.set('');
    this.isAddingMedal.set(true);

    this.medalsService.createMedal({
      id_user: this.userId,
      competition_name: this.medallaTempPrueba.trim(),
      year: Number(this.medallaTempAnio),
      medal_type: this.mapMedalTypeToModel(this.medallaTempTipo),
    }).subscribe({
      next: () => {
        this.refreshMedals(() => {
          this.medallaTempPrueba = '';
          this.medallaTempTipo = '';
          this.medallaTempAnio = '';
          this.isAddingMedal.set(false);
          this.obtuvoPremio = 'si';
        });
      },
      error: (err) => {
        console.error('Error adding medal:', err);
        this.isAddingMedal.set(false);
        this.addMedalError.set('Error al guardar la medalla. Intente nuevamente.');
      },
    });
  }

  removeMedalla(i: number) {
    const medal = this.medallas()[i];
    if (!medal.id) {
      this.medallas.update(m => m.filter((_, idx) => idx !== i));
      return;
    }
    this.isDeletingMedalIdx.set(i);
    this.medalsService.deleteMedal(medal.id).subscribe({
      next: () => {
        this.medallas.update(m => m.filter((_, idx) => idx !== i));
        this.isDeletingMedalIdx.set(null);
        if (this.editingMedalIdx() === i) this.editingMedalIdx.set(null);
        if (this.medallas().length === 0) this.obtuvoPremio = '';
      },
      error: (err) => {
        console.error('Error deleting medal:', err);
        this.isDeletingMedalIdx.set(null);
      },
    });
  }

  startEdit(i: number) {
    const m = this.medallas()[i];
    this.editingMedalIdx.set(i);
    this.editPrueba = m.prueba;
    this.editTipo = m.tipo;
    this.editAnio = m.anio;
  }

  cancelEdit() { this.editingMedalIdx.set(null); }

  saveEdit(i: number) {
    if (!this.editPrueba.trim() || !this.editTipo || !this.editAnio) return;
    const anio = String(this.editAnio);
    const medal = this.medallas()[i];

    if (!medal.id) {
      this.medallas.update(list => list.map((m, idx) =>
        idx === i ? { ...m, prueba: this.editPrueba.trim(), tipo: this.editTipo, anio } : m
      ));
      this.editingMedalIdx.set(null);
      return;
    }

    this.isEditSaving.set(true);
    this.medalsService.updateMedal(medal.id, {
      competition_name: this.editPrueba.trim(),
      year: Number(this.editAnio),
      medal_type: this.mapMedalTypeToModel(this.editTipo) as Medal['medal_type'],
    }).subscribe({
      next: () => {
        this.medallas.update(list => list.map((m, idx) =>
          idx === i ? { ...m, prueba: this.editPrueba.trim(), tipo: this.editTipo, anio } : m
        ));
        this.editingMedalIdx.set(null);
        this.isEditSaving.set(false);
      },
      error: (err) => {
        console.error('Error updating medal:', err);
        this.isEditSaving.set(false);
      },
    });
  }

  private refreshMedals(onDone?: () => void) {
    this.medalsService.getOwnMedals().subscribe({
      next: (data) => {
        const medals = data as Medal[];
        this.medallas.set(medals.map(m => ({
          id: m.id_medal,
          prueba: m.competition_name,
          tipo: this.mapMedalTypeToForm(m.medal_type),
          anio: m.year.toString(),
        })));
        onDone?.();
      },
      error: (err) => {
        console.error('Error refreshing medals:', err);
        onDone?.();
      },
    });
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

  onDiscapacidadChange() {
    if (this.tieneDiscapacidad !== 'si') {
      this.tipoDiscapacidad = '';
      this.descripcionDiscapacidad = '';
      this.clasificacionFuncional = '';
      this.categoriaFuncionalSel = '';
    }
  }

  // ── Dropdown handlers ─────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('.ia-multiselect')) {
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

  // ── Mapping helpers ───────────────────────────────
  private mapDistritoToForm(v: string): string {
    const m: Record<string, string> = { san_pedro: 'san-pedro', sabanilla: 'sabanilla', mercedes: 'mercedes', san_rafael: 'san-rafael', other: 'otro' };
    return m[v] ?? '';
  }

  private mapDistritoToModel(v: string): string {
    const m: Record<string, string> = { 'san-pedro': 'san_pedro', sabanilla: 'sabanilla', mercedes: 'mercedes', 'san-rafael': 'san_rafael', otro: 'other' };
    return m[v] ?? v;
  }

  private mapSatisfactionToForm(v: string): string {
    const m: Record<string, string> = { very_satisfied: 'muy-satisfecho', satisfied: 'satisfecho', neutral: 'insatisfecho', dissatisfied: 'muy-insatisfecho' };
    return m[v] ?? '';
  }

  private mapSatisfactionToModel(v: string): string {
    const m: Record<string, string> = { 'muy-satisfecho': 'very_satisfied', satisfecho: 'satisfied', insatisfecho: 'neutral', 'muy-insatisfecho': 'dissatisfied' };
    return m[v] ?? v;
  }

  private mapFacilityToForm(v: string): string {
    const m: Record<string, string> = { yes: 'si', no: 'no', partial: 'parcialmente' };
    return m[v] ?? '';
  }

  private mapFacilityToModel(v: string): string {
    const m: Record<string, string> = { si: 'yes', no: 'no', parcialmente: 'partial' };
    return m[v] ?? v;
  }

  private mapDisabilityToForm(v: string | null): string {
    const m: Record<string, string> = { physical: 'fisica', cognitive: 'cognitiva' };
    return v ? (m[v] ?? '') : '';
  }

  private mapDisabilityToModel(v: string): string {
    const m: Record<string, string> = { fisica: 'physical', cognitiva: 'cognitive' };
    return m[v] ?? v;
  }

  private mapMedalTypeToForm(v: string): string {
    const m: Record<string, string> = { gold: 'oro', silver: 'plata', bronze: 'bronce' };
    return m[v] ?? v;
  }

  private mapMedalTypeToModel(v: string): string {
    const m: Record<string, string> = { oro: 'gold', plata: 'silver', bronce: 'bronze' };
    return m[v] ?? v;
  }

  private boolToForm(v: boolean | null | undefined): string {
    if (v === null || v === undefined) return '';
    return v ? 'si' : 'no';
  }

  private formToBool(v: string): boolean { return v === 'si'; }

  private getUserIdFromToken(): string {
    const token = localStorage.getItem('access_token');
    if (!token) return '';
    try { return JSON.parse(atob(token.split('.')[1])).sub ?? ''; } catch { return ''; }
  }

  private getEmailFromToken(): string {
    const token = localStorage.getItem('access_token');
    if (!token) return '';
    try { return JSON.parse(atob(token.split('.')[1])).email ?? ''; } catch { return ''; }
  }

  // ── Init ──────────────────────────────────────────
  ngOnInit() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved ? saved === 'dark' : prefersDark;
    this.isDark.set(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');

    this.userId = this.getUserIdFromToken();
    this.emailAtleta = this.getEmailFromToken();

    this.loadData();
  }

  private loadData() {
    this.isLoading.set(true);
    this.editingMedalIdx.set(null);

    forkJoin({
      profile: this.profileService.getOwnProfile(),
      athlete: this.athleteService.getOwnAthleteRecord(),
      enrollments: this.disciplinesService.getOwnEnrollments(),
      allDisciplines: this.disciplinesService.getActiveDisciplines(),
      medals: this.medalsService.getOwnMedals(),
    }).subscribe({
      next: (data) => {
        const profiles = data.profile as UserProfile[];
        const athletes = data.athlete as Athlete[];
        const enrollments = data.enrollments as UserDiscipline[];
        const allDiscs = data.allDisciplines as Discipline[];
        const medals = data.medals as Medal[];

        this.allDisciplinesSignal.set(allDiscs);

        if (profiles.length > 0) {
          const p = profiles[0];
          this.originalProfile = { ...p };
          this.nombre = p.name ?? '';
          this.primerApellido = p.first_last_name ?? '';
          this.segundoApellido = p.second_last_name ?? '';
          this.tipoId = p.dni_type ?? 'cedula';
          this.numeroId = p.dni ?? '';
          this.fechaNacimiento = p.birth_date ?? '';
          this.sexo = p.sex === 'male' ? 'M' : (p.sex === 'female' ? 'F' : '');
        }

        if (athletes.length > 0) {
          const a = athletes[0];
          this.originalAthlete = { ...a };
          this.telefono = a.phone ?? '';
          this.distrito = this.mapDistritoToForm(a.district_of_residence ?? '');
          this.nombreEncargado = a.legal_guardian_name ?? '';
          this.telefonoEncargado = a.legal_guardian_phone ?? '';
          this.participoJDN = this.boolToForm(a.nacional_games_participation);
          this.participoInternacional = this.boolToForm(a.international_games_participation);
          this.frecuenciaSemanal = a.weekly_exercise?.toString() ?? '';
          this.apoyoFamiliar = this.boolToForm(a.has_family_support);
          this.nivelSatisfaccion = this.mapSatisfactionToForm(a.satisfaction_level ?? '');
          this.familiarComite = this.boolToForm(a.has_family_in_committee);
          this.otraComite = this.boolToForm(a.has_previous_committee);
          this.nombreOtraComite = a.previous_committee_name ?? '';
          this.perteneceClub = this.boolToForm(a.is_club_member);
          this.nombreClub = a.club_name ?? '';
          this.instalacionesAdecuadas = this.mapFacilityToForm(a.facility_satisfaction_level ?? '');
          this.tieneDiscapacidad = this.boolToForm(a.has_disability);
          this.tipoDiscapacidad = this.mapDisabilityToForm(a.disability_type);
          this.descripcionDiscapacidad = a.disability_description ?? '';
          this.clasificacionFuncional = this.boolToForm(a.has_functional_classification);
          this.categoriaFuncionalSel = a.classification_category ?? '';
        }

        this.originalEnrollments = enrollments;
        this.selectedDisciplines.set(
          enrollments.map(e => e.disciplines?.name ?? '').filter(Boolean)
        );
        this.esRepresentacion = this.boolToForm(
          enrollments.some(e => e.is_representative && e.disciplines?.discipline_type === 'sport')
        );

        this.medallas.set(medals.map(m => ({
          id: m.id_medal,
          prueba: m.competition_name,
          tipo: this.mapMedalTypeToForm(m.medal_type),
          anio: m.year.toString(),
        })));
        this.obtuvoPremio = medals.length > 0 ? 'si' : '';

        // Fetch avatar as blob so it can be used as <img src> without auth headers
        this.storageService.getAvatarAsBlob(this.userId).subscribe({
          next: (blob) => this.avatarUrl.set(URL.createObjectURL(blob)),
          error: () => this.avatarUrl.set(null),
        });

        // Check if classification doc exists (silent)
        this.storageService.getClassificationDocSignedUrl(this.userId).subscribe({
          next: () => this.clasificacionDocUploaded.set(true),
          error: () => this.clasificacionDocUploaded.set(false),
        });

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.isLoading.set(false);
      },
    });
  }

  // ── Avatar upload ─────────────────────────────────
  async onAvatarFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.avatarUploadError.set('Solo se aceptan imágenes (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.avatarUploadError.set('La imagen no puede superar los 2 MB.');
      return;
    }

    this.avatarUploadError.set('');
    this.isUploadingAvatar.set(true);

    try {
      const compressed = await this.compressImage(file);
      const compressedFile = new File([compressed], 'avatar.jpg', { type: 'image/jpeg' });

      this.storageService.uploadAvatar(this.userId, compressedFile).subscribe({
        next: () => {
          this.profileService.updateOwnProfile(this.userId, {
            profile_image_url: `avatars/${this.userId}/avatar.jpg`,
          }).subscribe();
          this.storageService.getAvatarAsBlob(this.userId).subscribe({
            next: (blob) => {
              const old = this.avatarUrl();
              if (old?.startsWith('blob:')) URL.revokeObjectURL(old);
              this.avatarUrl.set(URL.createObjectURL(blob));
              this.isUploadingAvatar.set(false);
            },
            error: () => this.isUploadingAvatar.set(false),
          });
        },
        error: (err) => {
          console.error('Avatar upload error:', err);
          this.avatarUploadError.set('Error al subir la imagen. Intente nuevamente.');
          this.isUploadingAvatar.set(false);
        },
      });
    } catch {
      this.avatarUploadError.set('No se pudo procesar la imagen.');
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

  // ── Clasificación document upload ────────────────
  onClasificacionFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const validTypes = [
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(file.type)) {
      this.clasificacionUploadError.set('Solo se aceptan imágenes (JPG, PNG, WebP), PDF o DOCX.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.clasificacionUploadError.set('El archivo no puede superar los 2 MB.');
      return;
    }

    this.clasificacionUploadError.set('');
    this.isUploadingClasificacion.set(true);

    this.storageService.uploadClassificationDocument(this.userId, file).subscribe({
      next: () => {
        this.clasificacionDocUploaded.set(true);
        this.isUploadingClasificacion.set(false);
      },
      error: (err) => {
        console.error('Clasificación upload error:', err);
        this.clasificacionUploadError.set('Error al subir el archivo. Intente nuevamente.');
        this.isUploadingClasificacion.set(false);
      },
    });
  }

  // ── Validation ────────────────────────────────────
  private validateForm(): string | null {
    if (!this.nombre.trim())           return 'El nombre es requerido.';
    if (!this.primerApellido.trim())   return 'El primer apellido es requerido.';
    if (!this.segundoApellido.trim())  return 'El segundo apellido es requerido.';
    if (!this.numeroId.trim())         return 'El número de identificación es requerido.';
    if (!this.fechaNacimiento)         return 'La fecha de nacimiento es requerida.';
    if (!this.sexo)                    return 'El sexo es requerido.';

    if (this.esMinor) {
      if (!this.nombreEncargado.trim())   return 'El nombre del encargado es requerido para menores de edad.';
      if (!this.telefonoEncargado.trim()) return 'El teléfono del encargado es requerido para menores de edad.';
    }

    if (!this.telefono.trim())         return 'El número de teléfono es requerido.';
    if (!this.distrito)                return 'El distrito de residencia es requerido.';

    if (this.selectedDisciplines().length === 0) return 'Debe seleccionar al menos una disciplina.';

    if (!this.frecuenciaSemanal)       return 'La frecuencia semanal es requerida.';
    if (!this.nivelSatisfaccion)       return 'El nivel de satisfacción es requerido.';
    if (!this.otraComite)              return '¿Ha pertenecido a otro Comité? es requerido.';
    if (this.otraComite === 'si' && !this.nombreOtraComite.trim())
      return 'El nombre del Comité anterior es requerido.';
    if (!this.instalacionesAdecuadas)  return 'La evaluación de instalaciones es requerida.';

    if (this.showDeportiva()) {
      if (!this.participoJDN)           return '¿Ha participado en Juegos Nacionales? es requerido.';
      if (!this.participoInternacional) return '¿Ha participado en competencias internacionales? es requerido.';
      if (!this.obtuvoPremio)           return '¿Ha obtenido medallas? es requerido.';
      if (!this.esRepresentacion)       return '¿Representa al comité competitivamente? es requerido.';
      if (!this.apoyoFamiliar)          return '¿Cuenta con apoyo familiar? es requerido.';
      if (!this.familiarComite)         return '¿Tiene familiares en el Comité? es requerido.';
      if (!this.perteneceClub)          return '¿Pertenece a algún club? es requerido.';
      if (this.perteneceClub === 'si' && !this.nombreClub.trim())
        return 'El nombre del club es requerido.';
      if (!this.tieneDiscapacidad)      return '¿Tiene alguna discapacidad? es requerido.';
      if (this.tieneDiscapacidad === 'si') {
        if (!this.tipoDiscapacidad)       return 'El tipo de discapacidad es requerido.';
        if (!this.clasificacionFuncional) return '¿Tiene clasificación funcional? es requerido.';
        if (this.clasificacionFuncional === 'si' && !this.categoriaFuncionalSel)
          return 'La categoría funcional es requerida.';
      }
    }

    return null;
  }

  // ── Save (profile + athlete + disciplines only — medals are immediate) ──
  save() {
    if (this.isSaving()) return;
    this.saveError.set('');
    this.saveSuccess.set(false);

    const error = this.validateForm();
    if (error) {
      this.saveError.set(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const saves: Observable<unknown>[] = [];

    const profilePayload = this.buildProfilePayload();
    if (this.hasProfileChanged(profilePayload)) {
      saves.push(this.profileService.updateOwnProfile(this.userId, profilePayload));
    }

    const athletePayload = this.buildAthletePayload();
    if (this.hasAthleteChanged(athletePayload)) {
      saves.push(this.athleteService.updateOwnAthleteRecord(this.userId, athletePayload));
    }

    const currentNames = this.selectedDisciplines();
    const originalNames = this.originalEnrollments.map(e => e.disciplines?.name ?? '').filter(Boolean);

    for (const enrollment of this.originalEnrollments) {
      const name = enrollment.disciplines?.name ?? '';
      if (name && !currentNames.includes(name)) {
        saves.push(this.disciplinesService.removeEnrollment(enrollment.id_user_discipline));
      }
    }

    for (const name of currentNames) {
      if (!originalNames.includes(name)) {
        const disc = this.allDisciplinesSignal().find(d => d.name === name);
        if (disc) {
          const isRep = disc.discipline_type === 'sport' && this.esRepresentacion === 'si';
          saves.push(this.disciplinesService.enrollInDiscipline(disc.id_discipline, isRep));
        }
      }
    }

    const originalHadRep = this.originalEnrollments.some(e => e.is_representative && e.disciplines?.discipline_type === 'sport');
    const currentIsRep = this.esRepresentacion === 'si';
    if (originalHadRep !== currentIsRep) {
      for (const enrollment of this.originalEnrollments) {
        if (enrollment.disciplines?.discipline_type === 'sport' && currentNames.includes(enrollment.disciplines.name ?? '')) {
          saves.push(this.disciplinesService.updateEnrollment(enrollment.id_user_discipline, { is_representative: currentIsRep }));
        }
      }
    }

    if (saves.length === 0) {
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
      return;
    }

    this.isSaving.set(true);
    forkJoin(saves).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saveSuccess.set(true);
        this.loadData();
        setTimeout(() => this.saveSuccess.set(false), 4000);
      },
      error: (err) => {
        console.error('Save error:', err);
        this.isSaving.set(false);
        this.saveError.set('Ocurrió un error al guardar. Intente nuevamente.');
      },
    });
  }

  private buildProfilePayload(): Partial<UserProfile> {
    return {
      name: this.nombre,
      first_last_name: this.primerApellido,
      second_last_name: this.segundoApellido,
      dni_type: this.tipoId as UserProfile['dni_type'],
      dni: this.numeroId,
      birth_date: this.fechaNacimiento,
      sex: this.sexo === 'M' ? 'male' : 'female',
    };
  }

  private hasProfileChanged(p: Partial<UserProfile>): boolean {
    if (!this.originalProfile) return false;
    return (
      p.name !== this.originalProfile.name ||
      p.first_last_name !== this.originalProfile.first_last_name ||
      p.second_last_name !== this.originalProfile.second_last_name ||
      p.dni_type !== this.originalProfile.dni_type ||
      p.dni !== this.originalProfile.dni ||
      p.birth_date !== this.originalProfile.birth_date ||
      p.sex !== this.originalProfile.sex
    );
  }

  private buildAthletePayload(): Partial<Athlete> {
    return {
      phone: this.telefono,
      district_of_residence: this.mapDistritoToModel(this.distrito) as Athlete['district_of_residence'],
      legal_guardian_name: this.esMinor ? this.nombreEncargado : null,
      legal_guardian_phone: this.esMinor ? this.telefonoEncargado : null,
      nacional_games_participation: this.formToBool(this.participoJDN),
      international_games_participation: this.formToBool(this.participoInternacional),
      weekly_exercise: this.frecuenciaSemanal ? parseInt(this.frecuenciaSemanal) : 0,
      has_family_support: this.formToBool(this.apoyoFamiliar),
      satisfaction_level: this.mapSatisfactionToModel(this.nivelSatisfaccion) as Athlete['satisfaction_level'],
      has_family_in_committee: this.formToBool(this.familiarComite),
      has_previous_committee: this.formToBool(this.otraComite),
      previous_committee_name: this.otraComite === 'si' ? this.nombreOtraComite : null,
      is_club_member: this.formToBool(this.perteneceClub),
      club_name: this.perteneceClub === 'si' ? this.nombreClub : null,
      facility_satisfaction_level: this.mapFacilityToModel(this.instalacionesAdecuadas) as Athlete['facility_satisfaction_level'],
      has_disability: this.formToBool(this.tieneDiscapacidad),
      disability_type: this.tieneDiscapacidad === 'si' ? this.mapDisabilityToModel(this.tipoDiscapacidad) as Athlete['disability_type'] : null,
      disability_description: this.tieneDiscapacidad === 'si' ? this.descripcionDiscapacidad : null,
      has_functional_classification: this.tieneDiscapacidad === 'si' ? this.formToBool(this.clasificacionFuncional) : false,
      classification_category: (this.tieneDiscapacidad === 'si' && this.clasificacionFuncional === 'si') ? this.categoriaFuncionalSel : null,
    };
  }

  private hasAthleteChanged(a: Partial<Athlete>): boolean {
    if (!this.originalAthlete) return false;
    return (
      a.phone !== this.originalAthlete.phone ||
      a.district_of_residence !== this.originalAthlete.district_of_residence ||
      a.legal_guardian_name !== this.originalAthlete.legal_guardian_name ||
      a.legal_guardian_phone !== this.originalAthlete.legal_guardian_phone ||
      a.nacional_games_participation !== this.originalAthlete.nacional_games_participation ||
      a.international_games_participation !== this.originalAthlete.international_games_participation ||
      a.weekly_exercise !== this.originalAthlete.weekly_exercise ||
      a.has_family_support !== this.originalAthlete.has_family_support ||
      a.satisfaction_level !== this.originalAthlete.satisfaction_level ||
      a.has_family_in_committee !== this.originalAthlete.has_family_in_committee ||
      a.has_previous_committee !== this.originalAthlete.has_previous_committee ||
      a.previous_committee_name !== this.originalAthlete.previous_committee_name ||
      a.is_club_member !== this.originalAthlete.is_club_member ||
      a.club_name !== this.originalAthlete.club_name ||
      a.facility_satisfaction_level !== this.originalAthlete.facility_satisfaction_level ||
      a.has_disability !== this.originalAthlete.has_disability ||
      a.disability_type !== this.originalAthlete.disability_type ||
      a.disability_description !== this.originalAthlete.disability_description ||
      a.has_functional_classification !== this.originalAthlete.has_functional_classification ||
      a.classification_category !== this.originalAthlete.classification_category
    );
  }

  // ── Theme & auth ──────────────────────────────────
  toggleTheme() {
    const next = !this.isDark();
    this.isDark.set(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/inicio-sesion']);
  }
}
