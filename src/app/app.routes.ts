import { Routes } from '@angular/router';
import { authGuard, rolGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  // Auth
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },

  // Conductor
  {
    path: 'conductor',
    canActivate: [authGuard, rolGuard(['CONDUCTOR'])],
    children: [
      {
        path: 'parqueaderos',
        loadComponent: () => import('./features/conductor/buscar-parqueaderos/buscar-parqueaderos.component').then(m => m.BuscarParqueaderosComponent)
      },
      {
        path: 'mis-reservas',
        loadComponent: () => import('./features/conductor/mis-reservas/mis-reservas.component').then(m => m.MisReservasComponent)
      },
      { path: '', redirectTo: 'parqueaderos', pathMatch: 'full' }
    ]
  },

  // Dueño
  {
    path: 'dueno',
    canActivate: [authGuard, rolGuard(['DUENO'])],
    children: [
      {
        path: 'mis-parqueaderos',
        loadComponent: () => import('./features/dueno/mis-parqueaderos/mis-parqueaderos.component').then(m => m.MisParqueaderosComponent)
      },
      {
        path: 'reservas',
        loadComponent: () => import('./features/dueno/reservas-parqueadero/reservas-parqueadero.component').then(m => m.ReservasParqueaderoComponent)
      },
      { path: '', redirectTo: 'mis-parqueaderos', pathMatch: 'full' }
    ]
  },

  // Admin
  {
    path: 'admin',
    canActivate: [authGuard, rolGuard(['ADMINISTRADOR'])],
    children: [
      {
        path: 'pendientes',
        loadComponent: () => import('./features/admin/parqueaderos-pendientes/parqueaderos-pendientes.component').then(m => m.ParqueaderosPendientesComponent)
      },
      {
        path: 'reservas',
        loadComponent: () => import('./features/admin/todas-reservas/todas-reservas.component').then(m => m.TodasReservasComponent)
      },
      { path: '', redirectTo: 'pendientes', pathMatch: 'full' }
    ]
  },

  { path: 'no-autorizado', loadComponent: () => import('./shared/components/navbar/navbar.component').then(m => m.NavbarComponent) },
  { path: '**', redirectTo: '/auth/login' }
];
