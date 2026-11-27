import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '@app/components/ui/icon-base.component';
import type { Guest } from '@app/core/data/types';

@Component({
  selector: 'app-guest-card',
  standalone: true,
  imports: [RouterLink, TranslocoModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      @if (compact) {
        <a
          [routerLink]="['/convidado', guest.slug]"
          class="surface-card flex items-center gap-3 rounded-xl border p-3 transition hover:shadow-theme-sm"
        >
          <img [src]="guest.avatar" alt="" class="h-11 w-11 shrink-0 rounded-full object-cover" />
          <span class="min-w-0">
            <span class="block truncate text-sm font-semibold text-heading">{{ guest.name }}</span>
            <span class="block truncate text-xs text-muted">{{ guest.role }}</span>
          </span>
        </a>
      } @else {
        <article class="surface-card flex flex-col items-start rounded-2xl border p-5 shadow-theme-sm">
          <img
            [src]="guest.avatar"
            [alt]="guest.name"
            class="h-16 w-16 rounded-full object-cover"
            loading="lazy"
          />
          <h3 class="mt-4 text-base font-semibold text-heading">
            <a [routerLink]="['/convidado', guest.slug]" class="hover:text-brand-600">{{ guest.name }}</a>
          </h3>
          <p class="text-sm text-brand-600 dark:text-brand-400">{{ guest.role }}</p>
          <p class="mt-3 line-clamp-3 text-sm text-muted">{{ guest.bio }}</p>
          <p class="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted">
            <app-icon name="mic" [size]="14" />
            {{ t('guest.episodeCount', { count: guest.episodeIds.length }) }}
          </p>
        </article>
      }
    </ng-container>
  `,
})
export class GuestCardComponent {
  @Input({ required: true }) guest!: Guest;
  @Input() compact = false;
}
