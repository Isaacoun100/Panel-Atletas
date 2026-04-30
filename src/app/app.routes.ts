import { Routes } from '@angular/router';
import { IncioSesion } from './incio-sesion/incio-sesion';
import { Dashboard } from './dashboard/dashboard';
import { Atletas } from './atletas/atletas';
import { RegistrarAtleta } from './registrar-atleta/registrar-atleta';
import { MiPerfil } from './mi-perfil/mi-perfil';
import { NuevoAtleta } from './nuevo-atleta/nuevo-atleta';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio-sesion', pathMatch: 'full' },
  { path: 'inicio-sesion', component: IncioSesion },
  { path: 'dashboard', component: Dashboard },
  { path: 'atletas', component: Atletas },
  { path: 'registrar-atleta', component: RegistrarAtleta },
  { path: 'mi-perfil', component: MiPerfil },
  { path: 'nuevo-atleta', component: NuevoAtleta },
];
