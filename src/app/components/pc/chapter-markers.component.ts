import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '@app/components/ui/icon-base.component';
import type { Chapter } from '@app/core/data/types';
import { formatClock } from '@app/lib/format';
import { WaveformComponent } from './waveform.component';

/**
 * Editor de capítulos: os marcadores são arrastáveis sobre a forma de onda e a
 * lista abaixo mostra o mesmo estado, sempre ordenada por tempo.
 */
@Component({
  selector: 'app-chapter-markers',
  standalone: true,
  imports: [FormsModule, TranslocoModule, IconComponent, WaveformComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-5" *transloco="let t">
      <div class="surface-card rounded-xl border p-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm font-medium text-heading">{{ t('editor.audio.waveTitle') }}</p>
          <p class="text-xs text-muted">{{ t('editor.audio.dragHint') }}</p>
        </div>
        <app-waveform
          [seed]="seed"
          [durationSec]="durationSec"
          [positionSec]="positionSec"
          [bars]="140"
          [height]="96"
          [seekable]="true"
          (seek)="seekTo.emit($event)"
          [markers]="markers()"
          [draggableMarkers]="true"
          (markerMove)="move.emit($event)"
        />
        <div class="mt-2 flex items-center justify-between text-xs text-muted">
          <span>{{ clock(0) }}</span>
          <span class="font-mono">{{ clock(positionSec) }}</span>
          <span>{{ clock(durationSec) }}</span>
        </div>
      </div>

      <div class="space-y-2">
        @for (chapter of sorted(); track chapter.id) {
          <div class="surface-card flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center">
            <button
              type="button"
              (click)="seekTo.emit(chapter.startSec)"
              [title]="t('editor.audio.goTo')"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-themed text-muted transition hover:text-brand-600"
            >
              <app-icon name="play" [size]="14" />
            </button>

            <input
              [ngModel]="chapter.title"
              (ngModelChange)="rename.emit({ id: chapter.id, title: $event })"
              [attr.aria-label]="t('editor.audio.chapterTitle')"
              class="focus-ring min-w-0 flex-1 rounded-lg border border-themed bg-transparent px-3 py-2 text-sm text-body"
            />

            <div class="flex shrink-0 items-center gap-2">
              <input
                type="range"
                [min]="0"
                [max]="maxStart()"
                [ngModel]="chapter.startSec"
                (ngModelChange)="move.emit({ id: chapter.id, sec: +$event })"
                [attr.aria-label]="t('editor.audio.chapterStart')"
                class="h-1 w-28 cursor-pointer sm:w-36"
              />
              <span class="w-16 shrink-0 text-right font-mono text-xs text-muted tabular-nums">
                {{ clock(chapter.startSec) }}
              </span>
              <button
                type="button"
                (click)="remove.emit(chapter.id)"
                [attr.aria-label]="t('common.remove')"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:text-error-500"
              >
                <app-icon name="trash" [size]="16" />
              </button>
            </div>
          </div>
        }

        <button
          type="button"
          (click)="add.emit()"
          class="focus-ring inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <app-icon name="plus" [size]="16" />
          {{ t('editor.audio.addChapter') }}
        </button>
      </div>
    </div>
  `,
})
export class ChapterMarkersComponent {
  @Input({ required: true }) seed = '';
  @Input({ required: true }) set durationSec(v: number) {
    this._duration.set(v);
  }
  get durationSec() {
    return this._duration();
  }
  @Input({ required: true }) positionSec = 0;
  @Input({ required: true }) set chapters(v: Chapter[]) {
    this._chapters.set(v);
  }

  @Output() move = new EventEmitter<{ id: number; sec: number }>();
  @Output() rename = new EventEmitter<{ id: number; title: string }>();
  @Output() remove = new EventEmitter<number>();
  @Output() add = new EventEmitter<void>();
  @Output() seekTo = new EventEmitter<number>();

  private _chapters = signal<Chapter[]>([]);
  private _duration = signal(0);

  protected clock = formatClock;
  protected readonly sorted = computed(() =>
    this._chapters().slice().sort((a, b) => a.startSec - b.startSec)
  );
  protected readonly markers = computed(() =>
    this.sorted().map((c) => ({ id: c.id, startSec: c.startSec, title: c.title }))
  );
  protected readonly maxStart = computed(() => Math.max(1, this._duration() - 1));
}
