import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { DashboardService } from '../core/services/dashboard.service';
import { DashboardStats, RecentAthlete, ActivityEntry, ActivityAction } from '../core/models/dashboard.model';
import { ProfileService } from '../core/services/profile.service';
import { StorageService } from '../core/services/storage.service';
import { UserProfile } from '../core/models/profile.model';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);
  private profileService  = inject(ProfileService);
  private storageService  = inject(StorageService);

  isDark       = signal(false);
  sidebarName     = signal('Administrador');
  sidebarInitials = signal('A');
  sidebarAvatarUrl = signal<string | null>(null);
  isLoading    = signal(true);
  loadError    = signal('');
  stats        = signal<DashboardStats | null>(null);
  recentAthletes = signal<RecentAthlete[]>([]);
  activity     = signal<ActivityEntry[]>([]);

  constructor(private router: Router) {}

  ngOnInit() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      this.isDark.set(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    this.loadDashboard();
    this.loadSidebarData();
  }

  private loadSidebarData() {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    let userId = '';
    try { userId = JSON.parse(atob(token.split('.')[1])).sub ?? ''; } catch { return; }

    this.profileService.getOwnProfile().subscribe({
      next: (data) => {
        const profiles = data as UserProfile[];
        const p = profiles.find(x => x.id_user === userId) ?? profiles[0];
        if (p) {
          this.sidebarName.set([p.name, p.first_last_name].filter(Boolean).join(' ') || 'Administrador');
          this.sidebarInitials.set(((p.name?.[0] ?? '') + (p.first_last_name?.[0] ?? '')).toUpperCase() || 'A');
        }
      },
      error: () => {},
    });
    this.storageService.getAvatarAsBlob(userId).subscribe({
      next: (blob) => this.sidebarAvatarUrl.set(URL.createObjectURL(blob)),
      error: () => this.sidebarAvatarUrl.set(null),
    });
  }

  private loadDashboard() {
    this.isLoading.set(true);
    this.loadError.set('');
    this.dashboardService.getStats({ activity_limit: 5, athletes_limit: 5 }).subscribe({
      next: (res) => {
        this.stats.set(res.stats);
        this.recentAthletes.set(res.recentAthletes.data);
        this.activity.set(res.activity.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Dashboard load error:', err);
        this.loadError.set('No se pudo cargar el dashboard. Intente nuevamente.');
        this.isLoading.set(false);
      },
    });
  }

  initials(a: RecentAthlete): string {
    return ((a.name?.[0] ?? '') + (a.first_last_name?.[0] ?? '')).toUpperCase();
  }

  activityDotClass(action: ActivityAction): string {
    switch (action) {
      case 'user_registered':
      case 'invite_accepted':
      case 'user_activated':
      case 'discipline_created': return 'db-activity-dot db-activity-dot--success';
      case 'user_deactivated':   return 'db-activity-dot db-activity-dot--danger';
      case 'invite_sent':
      case 'profile_updated':
      default:                   return 'db-activity-dot db-activity-dot--primary';
    }
  }

  activityLabel(entry: ActivityEntry): { text: string; bold: string } {
    const meta = entry.metadata as Record<string, string>;
    const name = meta['name'] ?? '';
    switch (entry.action) {
      case 'user_registered':    return { text: 'Nuevo atleta registrado:', bold: name };
      case 'invite_sent':        return { text: 'Invitación enviada a:', bold: name };
      case 'invite_accepted':    return { text: 'Invitación aceptada por:', bold: name };
      case 'profile_updated':    return { text: 'Perfil actualizado:', bold: name };
      case 'user_deactivated':   return { text: 'Atleta desactivado:', bold: name };
      case 'user_activated':     return { text: 'Atleta activado:', bold: name };
      case 'discipline_created': return { text: 'Nueva disciplina añadida:', bold: name };
      default:                   return { text: entry.action, bold: name };
    }
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
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
