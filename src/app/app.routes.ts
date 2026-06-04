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