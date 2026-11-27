import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { waveformBars } from '@app/core/data/query';

export interface WaveMarker {
  id: number;
  startSec: number;
  title: string;
}

/**
 * Forma de onda desenhada — barras verticais de um seed determinístico, sem
 * imagem e sem biblioteca. A parte já ouvida fica em cor cheia.
 */
@Component({
  selector: 'app-waveform',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="'relative w-full ' + extraClass">
      <div
        #track
        (click)="onTrackClick($event)"
        (keydown)="onKeyDown($event)"
        [attr.role]="seekable ? 'slider' : null"
        [attr.aria-valuemin]="seekable ? 0 : null"
        [attr.aria-valuemax]="seekable ? durationSec : null"
        [attr.aria-valuenow]="seekable ? round(positionSec) : null"
        [attr.tabindex]="seekable ? 0 : null"
        [class]="'flex w-full items-end gap-[1px] ' + (seekable ? 'cursor-pointer' : '')"
        [style.height.px]="height"
      >
        @for (v of values(); track $index) {
          <span
            [class]="
              'min-w-0 flex-1 rounded-t-[1px] transition-colors ' +
              ($index / values().length <= progress() ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700')
            "
            [style.height.%]="round(v * 100)"
          ></span>
        }
      </div>

      @if (markers && durationSec > 0) {
        <div class="pointer-events-none absolute inset-0">
          @for (m of markers; track m.id) {
            <button
              type="button"
              [title]="m.title"
              [attr.aria-label]="m.title"
              (pointerdown)="onMarkerDown($event, m.id)"
              (pointermove)="onMarkerMove($event, m.id)"
              (pointerup)="endDrag($event)"
              (pointercancel)="endDrag($event)"
              [class]="
                'absolute top-0 bottom-0 w-3 -translate-x-1/2 ' +
                (draggableMarkers ? 'pointer-events-auto cursor-ew-resize' : '')
              "
              [style.left.%]="markerLeft(m.startSec)"
              style="touch-action: none"
            >
              <span
                [class]="
                  'absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 ' +
                  (dragId() === m.id ? 'bg-warning-500' : 'bg-gray-900/70 dark:bg-white/70')
                "
              ></span>
              <span
                [class]="
                  'absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white shadow-theme-xs dark:border-gray-dark ' +
                  (dragId() === m.id ? 'bg-warning-500' : 'bg-brand-600')
                "
              ></span>
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class WaveformComponent {
  /** Seed determinístico — a mesma faixa desenha sempre a mesma forma. */
  @Input({ required: true }) set seed(v: string) {
    this._seed.set(v);
  }
  @Input({ required: true }) durationSec = 0;
  @Input({ required: true }) set positionSec(v: number) {
    this._position.set(v);
  }
  get positionSec() {
    return this._position();
  }
  @Input() set bars(v: number) {
    this._bars.set(v);
  }
  @Input() height = 56;
  /** Clique/arraste na onda para mudar a posição. */
  @Input() seekable = false;
  /** Marcadores de capítulo desenhados por cima. */
  @Input() markers?: WaveMarker[];
  /** Quando verdadeiro, os marcadores viram alças arrastáveis. */
  @Input() draggableMarkers = false;
  @Input() extraClass = '';

  @Output() seek = new EventEmitter<number>();
  @Output() markerMove = new EventEmitter<{ id: number; sec: number }>();

  @ViewChild('track') trackRef?: ElementRef<HTMLDivElement>;

  private _seed = signal('');
  private _bars = signal(96);
  private _position = signal(0);
  protected readonly dragId = signal<number | null>(null);
  private dragging: number | null = null;

  protected readonly values = computed(() => waveformBars(this._seed(), this._bars()));
  protected readonly progress = computed(() =>
    this.durationSec > 0 ? Math.min(1, Math.max(0, this._position() / this.durationSec)) : 0
  );

  protected round = Math.round;

  protected markerLeft(startSec: number) {
    return Math.min(100, Math.max(0, (startSec / this.durationSec) * 100));
  }

  private secFromEvent(clientX: number): number {
    const rect = this.trackRef?.nativeElement.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(ratio * this.durationSec);
  }

  protected onTrackClick(e: MouseEvent) {
    if (!this.seekable || this.dragging !== null) return;
    this.seek.emit(this.secFromEvent(e.clientX));
  }

  protected onKeyDown(e: KeyboardEvent) {
    if (!this.seekable) return;
    if (e.key === 'ArrowRight') this.seek.emit(Math.min(this.durationSec, this._position() + 15));
    if (e.key === 'ArrowLeft') this.seek.emit(Math.max(0, this._position() - 15));
  }

  protected onMarkerDown(e: PointerEvent, id: number) {
    if (!this.draggableMarkers) return;
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.dragging = id;
    this.dragId.set(id);
  }

  protected onMarkerMove(e: PointerEvent, id: number) {
    if (!this.draggableMarkers || this.dragging !== id) return;
    this.markerMove.emit({ id, sec: this.secFromEvent(e.clientX) });
  }

  protected endDrag(e: PointerEvent) {
    if (this.dragging === null) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* o ponteiro já foi liberado */
    }
    this.dragging = null;
    this.dragId.set(null);
  }
}
