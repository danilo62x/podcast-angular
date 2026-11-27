import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CookieBannerComponent } from '@app/components/ui/cookie-banner.component';
import { ToastStackComponent } from '@app/components/ui/toast-stack.component';
import { PlayerBarComponent } from '@app/components/pc/player-bar.component';
import { PlayerService } from '@app/core/services/player.service';
import { PublicFooterComponent } from './public-footer.component';
import { PublicNavbarComponent } from './public-navbar.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    PublicNavbarComponent,
    PublicFooterComponent,
    ToastStackComponent,
    CookieBannerComponent,
    PlayerBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen flex-col" style="background-color: var(--tx-body-bg)">
      <app-public-navbar />
      <main class="flex-1">
        <router-outlet />
      </main>
      <app-public-footer />

      <!-- Espaço reservado para a barra fixa não cobrir o rodapé nem o banner. -->
      @if (hasPlayer()) {
        <div aria-hidden="true" class="h-[72px] sm:h-[76px]"></div>
      }

      <!-- O player fica fora do <router-outlet> para continuar tocando ao trocar de rota. -->
      <app-player-bar />
      <app-toast-stack />
      <app-cookie-banner [offsetPx]="hasPlayer() ? 72 : 0" />
    </div>
  `,
})
export class PublicLayoutComponent {
  private player = inject(PlayerService);
  protected readonly hasPlayer = computed(() => this.player.episodeId() !== null);
}
