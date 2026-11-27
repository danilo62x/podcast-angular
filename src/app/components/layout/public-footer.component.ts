import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { PLATFORM_ICON } from '@app/components/pc/platform-bars.component';
import { PodcastService } from '@app/core/services/podcast.service';
import type { PlatformName } from '@app/core/data/types';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [RouterLink, TranslocoModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="surface-card border-t border-themed" *transloco="let t">
      <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div class="flex flex-col items-start justify-between gap-8 lg:flex-row">
          <div class="max-w-sm">
            <a routerLink="/" class="flex items-center gap-2.5">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
                <app-icon name="radio" [size]="18" />
              </span>
              <span class="text-lg font-bold text-heading">{{ t('brand') }}</span>
            </a>
            <p class="mt-4 text-sm text-muted">{{ t('footer.tagline') }}</p>
          </div>

          <div class="flex flex-wrap gap-x-10 gap-y-2 text-sm">
            <a routerLink="/" class="text-muted transition hover:text-brand-600">{{ t('nav.home') }}</a>
            <a routerLink="/episodios" class="text-muted transition hover:text-brand-600">{{ t('nav.episodes') }}</a>
            <a routerLink="/sobre" class="text-muted transition hover:text-brand-600">{{ t('nav.about') }}</a>
            <a routerLink="/login" class="text-muted transition hover:text-brand-600">{{ t('nav.login') }}</a>
          </div>
        </div>

        <div class="mt-10 flex flex-col items-center justify-between gap-4 border-t border-themed pt-6 sm:flex-row">
          <p class="text-xs text-muted">© {{ year }} {{ t('brand') }}. {{ t('footer.rights') }}</p>
          <div class="flex items-center gap-3">
            @for (d of podcast.distributions(); track d.platform) {
              <a
                [href]="d.url"
                target="_blank"
                rel="noreferrer noopener"
                [attr.aria-label]="d.platform"
                [title]="d.platform"
                class="flex h-9 w-9 items-center justify-center rounded-full border border-themed text-muted transition hover:text-brand-500"
              >
                <app-icon [name]="icon(d.platform)" [size]="16" />
              </a>
            }
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class PublicFooterComponent {
  podcast = inject(PodcastService);
  protected readonly year = new Date().getFullYear();
  protected icon(p: PlatformName) {
    return PLATFORM_ICON[p];
  }
}
