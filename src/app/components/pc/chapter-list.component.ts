import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { chapterAt, chapterEnd } from '@app/core/data/query';
import type { Chapter } from '@app/core/data/types';
import { formatClock } from '@app/lib/format';

/** Capítulos clicáveis — o que contém o segundo atual fica destacado. */
@Component({
  selector: 'app-chapter-list',
  standalone: true,
  imports: [TranslocoModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      @if (sorted().length === 0) {
        <p class="text-sm text-muted">{{ t('episode.noChapters') }}</p>
      } @else {
        <ol class="flex flex-col gap-1">
          @for (chapter of sorted(); track chapter.id) {
            <li>
              <button
                type="button"
                (click)="select.emit(chapter.startSec)"
                [attr.aria-current]="current()?.id === chapter.id ? 'true' : null"
                [class]="
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ' +
                  (current()?.id === chapter.id
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400'
                    : 'text-body hover:bg-gray-50 dark:hover:bg-gray-800')
                "
              >
                <span
                  [class]="
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full ' +
                    (current()?.id === chapter.id
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 text-muted dark:bg-gray-800')
                  "
                >
                  <app-icon [name]="current()?.id === chapter.id ? 'play' : 'clock'" [size]="13" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium">{{ chapter.title }}</span>
                  <span class="block text-xs text-muted">
                    {{ clock(chapter.startSec) }} – {{ clock(end(chapter)) }}
                  </span>
                </span>
              </button>
            </li>
          }
        </ol>
      }
    </ng-container>
  `,
})
export class ChapterListComponent {
  @Input({ required: true }) set chapters(v: Chapter[]) {
    this._chapters.set(v);
  }
  @Input({ required: true }) durationSec = 0;
  @Input({ required: true }) set positionSec(v: number) {
    this._position.set(v);
  }
  /** Clicar num capítulo salta a posição do player. */
  @Output() select = new EventEmitter<number>();

  private _chapters = signal<Chapter[]>([]);
  private _position = signal(0);

  protected readonly sorted = computed(() =>
    this._chapters().slice().sort((a, b) => a.startSec - b.startSec)
  );
  protected readonly current = computed(() => chapterAt(this.sorted(), this._position()));

  protected clock = formatClock;
  protected end(chapter: Chapter) {
    return chapterEnd(this.sorted(), chapter, this.durationSec);
  }
}
