import { Routes } from '@angular/router';
import { IncioSesion } from './incio-sesion/incio-sesion';
import { Dashboard } from './dashboard/dashboard';
import { Atletas } from './atletas/atletas';
import { MiPerfil } from './mi-perfil/mi-perfil';
import { NuevoAtleta } from './nuevo-atleta/nuevo-atleta';
import { Administrar } from './administrar/administrar';
import { RegistrarAtleta } from './registrar-atleta/registrar-atleta';
import { InicioAtleta } from './inicio-atleta/inicio-atleta';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio-sesion', pathMatch: 'full' },
  { path: 'inicio-sesion', component: IncioSesion },
  { path: 'registrar-atleta', component: RegistrarAtleta },

  // Admin routes — require valid session
  { path: 'dashboard',    component: Dashboard,    canActivate: [authGuard] },
  { path: 'atletas',      component: Atletas,      canActivate: [authGuard] },
  { path: 'mi-perfil',    component: MiPerfil,     canActivate: [authGuard] },
  { path: 'nuevo-atleta', component: NuevoAtleta,  canActivate: [authGuard] },
  { path: 'administrar',  component: Administrar,  canActivate: [authGuard] },

  // Athlete route — require valid session
  { path: 'inicio-atleta', component: InicioAtleta, canActivate: [authGuard] },
];
