import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

// Servicios y modelos
import { ProfileService } from '../core/services/profile.service';
import { AuthService } from '../core/services/auth.service';
import { UserProfile } from '../core/models/profile.model';
import { StorageService } from '../core/services/storage.service';

@Component({
  selector: 'app-mi-perfil',
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private storageService = inject(StorageService);

  isDark = signal(false);
  isLoading = signal(true);
  errorMessage = signal('');

  // ── Datos del perfil ────────────────────────────────────────────────
  userId = '';
  profile: UserProfile | null = null;
  
  // ── Edit profile panel ────────────────────────────
  showEditPanel = signal(false);
  editNombre = '';
  editPrimerApellido = '';
  editSegundoApellido = '';
  editCorreo = '';
  editDni = '';
  editBirthDate = '';
  editSaved = signal(false);
  editError = signal('');

  // ── Change password panel ─────────────────────────
  showPasswordPanel = signal(false);
  passActual = '';
  passNueva = '';
  passConfirmar = '';
  passError = signal('');
  passSaved = signal(false);

  // ── Avatar ──────────────────────────────────────────────────────────
  avatarUrl = signal<string | null>(null);
  isUploadingAvatar = signal(false);
  avatarUploadError = signal('');

  // ── Iniciales del nombre ────────────────────────────────────────────
  getInitials(): string {
    if (!this.profile) return 'A';
    const first = this.profile.name?.charAt(0) || '';
    const last = this.profile.first_last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'A';
  }

  constructor() {}

  private getUserIdFromToken(): string {
    const token = localStorage.getItem('access_token');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || '';
    } catch {
      return '';
    }
  }
  
  async loadProfile() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const profiles = await firstValueFrom(this.profileService.getOwnProfile()) as UserProfile[];
      const userId = this.getUserIdFromToken();
      const myProfile = profiles.find(p => p.id_user === userId);
      
      if (myProfile) {
        this.profile = myProfile;
        this.userId = myProfile.id_user;
        this.editNombre = myProfile.name || '';
        this.editPrimerApellido = myProfile.first_last_name || '';
        this.editSegundoApellido = myProfile.second_last_name || '';
        this.editCorreo = this.getEmailFromToken();
        this.editDni = myProfile.dni || '';
        // Mostrar fecha en DD/MM/YYYY
        this.editBirthDate = this.formatFechaParaMostrar(myProfile.birth_date) || '';
        
        // Se carga el avatar si existe
        this.loadAvatar();
      } else {
        this.errorMessage.set('No se encontró el perfil del usuario');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.errorMessage.set('Error al cargar el perfil');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Cargar avatar ────────────────────────────────────────────────────
  private loadAvatar() {
    if (!this.userId) return;
    this.storageService.getAvatarAsBlob(this.userId).subscribe({
      next: (blob) => this.avatarUrl.set(URL.createObjectURL(blob)),
      error: () => this.avatarUrl.set(null),
    });
  }

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
      const blob = await this.compressImage(file);
      const compressed = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      this.storageService.uploadAvatar(this.userId, compressed).subscribe({
        next: () => {
          this.profileService.updateOwnProfile(this.userId, {
            profile_image_url: `avatars/${this.userId}/avatar.jpg`,
          }).subscribe();
          const old = this.avatarUrl();
          if (old?.startsWith('blob:')) URL.revokeObjectURL(old);
          this.avatarUrl.set(URL.createObjectURL(blob));
          this.isUploadingAvatar.set(false);
        },
        error: () => {
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
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          b => b ? resolve(b) : reject(new Error('Compression failed')),
          'image/jpeg', quality
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
      img.src = url;
    });
  }

  private getEmailFromToken(): string {
    const token = localStorage.getItem('access_token');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email || '';
    } catch {
      return '';
    }
  }


  async saveProfile() {
    if (!this.userId) return;

    this.editError.set('');
    this.editSaved.set(false);

    // Validaciones
    if (!this.editNombre.trim()) {
      this.editError.set('El nombre es requerido');
      return;
    }
    if (!this.editPrimerApellido.trim()) {
      this.editError.set('El primer apellido es requerido');
      return;
    }

    try {
      const profileData: Partial<UserProfile> = {
        name: this.editNombre.trim(),
        first_last_name: this.editPrimerApellido.trim(),
        second_last_name: this.editSegundoApellido.trim() || '',
        dni: this.editDni.trim(),
        birth_date: this.formatFechaParaAPI(this.editBirthDate),
      };

      await firstValueFrom(this.profileService.updateOwnProfile(this.userId, profileData));

      // Se actualiza el perfil local
      if (this.profile) {
        this.profile.name = this.editNombre.trim() || '';
        this.profile.first_last_name = this.editPrimerApellido.trim() || '';
        this.profile.second_last_name = this.editSegundoApellido.trim() || '';
        this.profile.dni = this.editDni.trim() || '';
        this.profile.birth_date = this.formatFechaParaAPI(this.editBirthDate) || '';
      }

      this.editSaved.set(true);
      setTimeout(() => {
        this.editSaved.set(false);
        this.closeEditPanel();
      }, 1500);
    } catch (error) {
      console.error('Error saving profile:', error);
      this.editError.set('Error al guardar los cambios');
    }
  }


  async savePassword() {
    this.passError.set('');
    this.passSaved.set(false);

    // Se hacen las validaciones
    if (!this.passActual || !this.passNueva || !this.passConfirmar) {
      this.passError.set('Todos los campos son obligatorios.');
      return;
    }
    if (this.passNueva !== this.passConfirmar) {
      this.passError.set('Las contraseñas no coinciden.');
      return;
    }
    if (this.passNueva.length < 6) {
      this.passError.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      // Se verifica que la contraseña actual sea correcta
      const email = this.getEmailFromToken();
      
      await firstValueFrom(this.authService.signIn(email, this.passActual));
      
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No hay sesión activa');

      await firstValueFrom(this.authService.updatePassword(this.passNueva, token));

      this.passSaved.set(true);
      setTimeout(() => {
        this.passSaved.set(false);
        this.closePasswordPanel();
      }, 1500);
    } catch (error) {
      console.error('Error changing password:', error);
      this.passError.set('Contraseña actual incorrecta. Intente nuevamente.');
    }
  }
  

  openEditPanel() {
    this.editError.set('');
    this.editSaved.set(false);
    this.showEditPanel.set(true);
  }

  closeEditPanel() {
    this.showEditPanel.set(false);
    this.editError.set('');
  }

  openPasswordPanel() {
    this.passError.set('');
    this.passSaved.set(false);
    this.passActual = '';
    this.passNueva = '';
    this.passConfirmar = '';
    this.showPasswordPanel.set(true);
  }

  closePasswordPanel() {
    this.showPasswordPanel.set(false);
    this.passError.set('');
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  getNombreCompleto(): string {
    if (!this.profile) return 'Cargando...';
    const parts = [this.profile.name, this.profile.first_last_name, this.profile.second_last_name].filter(Boolean);
    return parts.join(' ') || 'Administrador';
  }
  
  getDni(): string {
    return this.profile?.dni || 'No registrado';
  }
  
  getBirthDate(): string {
    if (!this.profile?.birth_date) return 'No registrado';
    return this.formatFechaParaMostrar(this.profile.birth_date);
  }

  getRolLabel(): string {
    return this.profile?.role === 'admin' ? 'Administrador' : 'Atleta';
}

  getRolBadgeClass(): string {
    return this.profile?.role === 'admin' ? 'db-badge--success' : 'db-badge--warning';
  }

  getAccessLevel(): string {
    return this.profile?.role === 'admin' ? 'Total' : 'Limitado';
  }

  getEstadoLabel(): string {
    return this.profile?.is_active ? 'Activa' : 'Inactiva';
  }

  getEstadoColor(): string {
    return this.profile?.is_active ? 'var(--success)' : 'var(--danger)';
  }

  getMiembroDesde(): string {
    if (!this.profile?.created_at) return 'N/A';
    const date = new Date(this.profile.created_at);
    return date.toLocaleDateString('es-CR', { year: 'numeric', month: 'long' });
  }

  // Formatear fecha YYYY-MM-DD a DD/MM/YYYY para mostrar
  formatFechaParaMostrar(fecha: string): string {
    if (!fecha || fecha === 'N/A') return '';
    // Extraer partes directamente sin usar Date()
    const partes = fecha.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fecha;
  }

  // Se formatea fecha DD/MM/YYYY a YYYY-MM-DD para la API
  formatFechaParaAPI(fecha: string): string {
    if (!fecha || fecha === 'N/A') return '';
    const partes = fecha.split('/');
    if (partes.length === 3) {
      const dia = partes[0].padStart(2, '0');
      const mes = partes[1].padStart(2, '0');
      const anio = partes[2];
      return `${anio}-${mes}-${dia}`;
    }
    return fecha;
  }

  ngOnInit() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved ? saved === 'dark' : prefersDark;
    this.isDark.set(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');

    this.loadProfile();
  }

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
