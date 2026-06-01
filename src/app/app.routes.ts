import { Routes } from '@angular/router';
import { IncioSesion } from './incio-sesion/incio-sesion';
import { Dashboard } from './dashboard/dashboard';
import { Atletas } from './atletas/atletas';
import { MiPerfil } from './mi-perfil/mi-perfil';
import { NuevoAtleta } from './nuevo-atleta/nuevo-atleta';
import { Administrar } from './administrar/administrar';
import { RegistrarAtleta } from './registrar-atleta/registrar-atleta';
import { InicioAtleta } from './inicio-atleta/inicio-atleta';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio-sesion', pathMatch: 'full' },
  { path: 'inicio-sesion', component: IncioSesion },
  { path: 'dashboard', component: Dashboard },
  { path: 'atletas', component: Atletas },
  { path: 'mi-perfil', component: MiPerfil },
  { path: 'nuevo-atleta', component: NuevoAtleta },
  { path: 'administrar', component: Administrar },
  { path: 'registrar-atleta', component: RegistrarAtleta },
  { path: 'inicio-atleta', component:InicioAtleta}
];
