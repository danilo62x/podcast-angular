import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  effect,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { EmptyStateComponent } from '@app/components/ui/empty-state.component';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { SwitchToggleComponent } from '@app/components/ui/switch-toggle.component';
import { lineAt } from '@app/core/data/query';
import type { TranscriptLine } from '@app/core/data/types';
import { formatClock } from '@app/lib/format';

/**
 * Transcrição sincronizada: a linha correspondente ao segundo atual fica
 * destacada e o painel rola sozinho até ela (sem arrastar a página junto).
 */
@Component({
  selector: 'app-transcript-view',
  standalone: true,
  imports: [FormsModule, TranslocoModule, EmptyStateComponent, IconComponent, SwitchToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      @if (_transcript().length === 0) {
        <app-empty-state
          icon="book-open"
          [title]="t('transcript.emptyTitle')"
          [description]="t('transcript.emptyDesc')"
        />
      } @else {
        <div>
          <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            @if (searchable) {
              <div class="relative w-full sm:max-w-xs">
                <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
                  <app-icon name="search" [size]="16" />
                </span>
                <input
                  [ngModel]="term()"
                  (ngModelChange)="term.set($event)"
                  [placeholder]="t('transcript.searchPlaceholder')"
                  class="focus-ring w-full rounded-lg border border-themed bg-transparent py-2 pr-3 pl-9 text-sm text-body"
                />
              </div>
            }
            <label class="flex shrink-0 items-center gap-2 text-xs text-muted">
              <app-switch-toggle [checked]="follow()" (changed)="follow.set($event)" size="sm" />
              {{ t('transcript.follow') }}
            </label>
          </div>

          <div
            #container
            class="no-scrollbar overflow-y-auto rounded-xl border border-themed p-2"
            [style.max-height.px]="height"
          >
            @if (rows().length === 0) {
              <p class="px-3 py-8 text-center text-sm text-muted">{{ t('common.noResults') }}</p>
            }
            @for (line of rows(); track line.id) {
              <button
                #row
                type="button"
                [attr.data-line-id]="line.id"
                (click)="select.emit(line.startSec)"
                [class]="
                  'flex w-full gap-3 rounded-lg px-3 py-2 text-left transition ' +
                  (current()?.id === line.id
                    ? 'bg-brand-50 dark:bg-brand-500/15'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800')
                "
              >
                <span
                  [class]="
                    'shrink-0 font-mono text-xs tabular-nums ' +
                    (current()?.id === line.id ? 'text-brand-600 dark:text-brand-400' : 'text-muted')
                  "
                >
                  {{ clock(line.startSec) }}
                </span>
                <span class="min-w-0 flex-1">
                  <span
                    [class]="
                      'block text-xs font-semibold ' +
                      (current()?.id === line.id ? 'text-brand-600 dark:text-brand-400' : 'text-muted')
                    "
                  >
                    {{ line.speaker }}
                  </span>
                  <span [class]="'block text-sm ' + (current()?.id === line.id ? 'text-heading' : 'text-body')">
                    {{ line.text }}
                  </span>
                </span>
              </button>
            }
          </div>
        </div>
      }
    </ng-container>
  `,
})
export class TranscriptViewComponent implements AfterViewInit {
  @Input({ required: true }) set transcript(v: TranscriptLine[]) {
    this._transcript.set(v);
  }
  @Input({ required: true }) set positionSec(v: number) {
    this._position.set(v);
  }
  @Input() height = 420;
  @Input() searchable = true;
  /** Clicar numa linha salta a posição do player. */
  @Output() select = new EventEmitter<number>();

  @ViewChild('container') containerRef?: ElementRef<HTMLDivElement>;
  @ViewChildren('row') rowRefs?: QueryList<ElementRef<HTMLButtonElement>>;

  protected readonly _transcript = signal<TranscriptLine[]>([]);
  private _position = signal(0);
  protected readonly follow = signal(true);
  protected readonly term = signal('');
  private viewReady = false;

  protected readonly current = computed(() => lineAt(this._transcript(), this._position()));

  protected readonly rows = computed(() => {
    const q = this.term().trim().toLowerCase();
    if (!q) return this._transcript();
    return this._transcript().filter(
      (l) => l.text.toLowerCase().includes(q) || l.speaker.toLowerCase().includes(q)
    );
  });

  protected clock = formatClock;

  constructor() {
    effect(() => {
      const line = this.current();
      const following = this.follow();
      if (!this.viewReady || !following || !line) return;
      // Rolagem manual do contêiner — `scrollIntoView` arrastaria a página toda.
      queueMicrotask(() => this.scrollToCurrent(line.id));
    });
  }

  ngAfterViewInit() {
    this.viewReady = true;
    const line = this.current();
    if (line && this.follow()) queueMicrotask(() => this.scrollToCurrent(line.id));
  }

  private scrollToCurrent(lineId: number) {
    const container = this.containerRef?.nativeElement;
    const row = this.rowRefs
      ?.toArray()
      .map((r) => r.nativeElement)
      .find((el) => el.dataset['lineId'] === String(lineId));
    if (!container || !row) return;
    const target = row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }
}
