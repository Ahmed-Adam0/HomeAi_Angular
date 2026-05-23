import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home/home')
        .then(m => m.Home)
  },

  {
    path: 'filter-sidebar',
    loadComponent: () =>
      import('./features/products/components/filter-sidebar/filter-sidebar')
        .then(m => m.FilterSidebar)
  },

  {
    path: 'Login',
    loadComponent: () =>
      import('./features/auth/pages/login/login')
        .then(m => m.Login)
  },
  {
    path: 'Register',
    loadComponent: () =>
      import('./features/auth/pages/register/register')
        .then(m => m.Register)
  },

  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/pages/profile/profile')
        .then(m => m.Profile)
  },

  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/notfound/notfound')
        .then(m => m.Notfound)
  }
];