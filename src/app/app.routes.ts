import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Autenticação (layout em branco) — casada antes dos shells de layout
  { path: 'login', loadComponent: () => import('./pages/public/login.component').then((m) => m.LoginPageComponent) },
  { path: 'registro', loadComponent: () => import('./pages/public/register.component').then((m) => m.RegisterPageComponent) },

  // Estúdio (guardado, layout com sidebar)
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./components/layout/app-layout.component').then((m) => m.AppLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./pages/app/dashboard.component').then((m) => m.DashboardPageComponent) },
      { path: 'episodios', loadComponent: () => import('./pages/app/episodes.component').then((m) => m.EpisodesAdminPageComponent) },
      { path: 'episodios/:id', loadComponent: () => import('./pages/app/episode-editor.component').then((m) => m.EpisodeEditorPageComponent) },
      { path: 'audiencia', loadComponent: () => import('./pages/app/audience.component').then((m) => m.AudiencePageComponent) },
      { path: 'convidados', loadComponent: () => import('./pages/app/guests.component').then((m) => m.GuestsAdminPageComponent) },
      { path: 'distribuicao', loadComponent: () => import('./pages/app/distribution.component').then((m) => m.DistributionPageComponent) },
      { path: 'configuracoes', loadComponent: () => import('./pages/app/settings.component').then((m) => m.SettingsPageComponent) },
    ],
  },

  // Página do programa (site público)
  {
    path: '',
    loadComponent: () => import('./components/layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./pages/public/home.component').then((m) => m.HomePageComponent) },
      { path: 'episodios', loadComponent: () => import('./pages/public/episodes.component').then((m) => m.EpisodesPageComponent) },
      { path: 'episodio/:slug', loadComponent: () => import('./pages/public/episode.component').then((m) => m.EpisodePageComponent) },
      { path: 'convidado/:slug', loadComponent: () => import('./pages/public/guest.component').then((m) => m.GuestPageComponent) },
      { path: 'sobre', loadComponent: () => import('./pages/public/about.component').then((m) => m.AboutPageComponent) },
    ],
  },

  // 404
  { path: '**', loadComponent: () => import('./pages/app/not-found.component').then((m) => m.NotFoundPageComponent) },
];
