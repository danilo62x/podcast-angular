import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconComponent } from '@app/components/ui/icon-base.component';
import type { Block } from '@app/core/data/types';

/** Descrição do episódio em blocos — notas do programa e links citados. */
@Component({
  selector: 'app-block-view',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      @for (block of blocks; track $index) {
        @switch (block.type) {
          @case ('heading') {
            <h3 class="pt-2 text-lg font-semibold text-heading">{{ block.text }}</h3>
          }
          @case ('list') {
            <ul class="space-y-2">
              @for (item of block.items ?? []; track $index) {
                <li class="flex gap-2.5 text-sm text-body">
                  <app-icon name="check" [size]="16" class="mt-0.5 shrink-0 text-brand-500" />
                  <span class="min-w-0">{{ item }}</span>
                </li>
              }
            </ul>
          }
          @case ('quote') {
            <blockquote
              class="border-l-4 border-brand-500 bg-brand-50/50 py-3 pl-4 text-sm italic text-body dark:bg-brand-500/10"
            >
              {{ block.text }}
            </blockquote>
          }
          @case ('link') {
            <a
              [href]="block.href"
              target="_blank"
              rel="noreferrer noopener"
              class="inline-flex max-w-full items-center gap-2 rounded-lg border border-themed px-3 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
            >
              <app-icon name="external-link" [size]="15" class="shrink-0" />
              <span class="truncate">{{ block.label ?? block.href }}</span>
            </a>
          }
          @default {
            <p class="text-sm leading-relaxed text-body">{{ block.text }}</p>
          }
        }
      }
    </div>
  `,
})
export class BlockViewComponent {
  @Input({ required: true }) blocks: Block[] = [];
}
