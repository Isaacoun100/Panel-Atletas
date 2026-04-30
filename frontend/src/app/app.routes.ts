import { Routes } from '@angular/router';
import { CrearAtleta } from './crear-atleta/crear-atleta';
import { DashboardAtletas } from './dashboard-atletas/dashboard-atletas';
import { DashboardAdmin } from './dashboard-admin/dashboard-admin';
import { IncioSesion } from './incio-sesion/incio-sesion';
import { VistaAtletas } from './vista-atletas/vista-atletas';
import { VistaFormulario } from './vista-formulario/vista-formulario';
import { VistaUsuario } from './vista-usuario/vista-usuario';

export const routes: Routes = [
    
  { path: '', redirectTo: 'inicio-sesion', pathMatch: 'full' },
  { path: 'inicio-sesion', component: IncioSesion },
  { path: 'dashboard-admin', component: DashboardAdmin },
  { path: 'dashboard-atletas', component: DashboardAtletas },
  { path: 'crear-atleta', component: CrearAtleta },
  { path: 'vista-atletas', component: VistaAtletas },
  { path: 'vista-formulario', component: VistaFormulario },
  { path: 'vista-usuario', component: VistaUsuario }
  
];
