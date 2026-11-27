import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { buildRssXml, highlightXmlLine } from '@app/core/data/query';
import type { Episode } from '@app/core/data/types';
import { UiService } from '@app/core/services/ui.service';

const TOKEN_CLASS: Record<string, string> = {
  decl: 'text-gray-400',
  tag: 'text-brand-600 dark:text-brand-400',
  attr: 'text-warning-600 dark:text-warning-500',
  text: 'text-body',
};

/** Prévia do XML gerado dos episódios publicados, com botão de copiar. */
@Component({
  selector: 'app-rss-preview',
  standalone: true,
  imports: [TranslocoModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="surface-card overflow-hidden rounded-xl border" *transloco="let t">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-themed px-4 py-3">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-heading">{{ t('distribution.xmlTitle') }}</p>
          <p class="truncate text-xs text-muted">{{ t('distribution.xmlHint', { count: itemCount() }) }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            (click)="expanded.set(!expanded())"
            class="focus-ring inline-flex h-9 items-center gap-2 rounded-lg border border-themed px-3 text-xs font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <app-icon [name]="expanded() ? 'chevron-up' : 'chevron-down'" [size]="14" />
            {{ expanded() ? t('distribution.showLess') : t('distribution.showAll') }}
          </button>
          <button
            type="button"
            (click)="copy()"
            class="focus-ring inline-flex h-9 items-center gap-2 rounded-lg bg-brand-500 px-3 text-xs font-medium text-white transition hover:bg-brand-600"
          >
            <app-icon name="copy" [size]="14" />
            {{ t('distribution.copy') }}
          </button>
        </div>
      </div>

      <div class="overflow-auto bg-gray-50 dark:bg-gray-900/60" [style.max-height.px]="height">
        <pre class="min-w-max p-4 font-mono text-[11px] leading-relaxed">@for (line of lines(); track $index) {<code
            class="block whitespace-pre"
          >@for (token of highlight(line); track $index) {<span [class]="tokenClass(token.kind)">{{ token.value }}</span>}{{ line.length === 0 ? ' ' : '' }}</code>}</pre>
      </div>
    </div>
  `,
})
export class RssPreviewComponent {
  @Input({ required: true }) set episodes(v: Episode[]) {
    this._episodes.set(v);
  }
  /** Quantos episódios entram na prévia (o feed real leva todos). */
  @Input() set limit(v: number) {
    this._limit.set(v);
  }
  @Input() height = 420;

  private _episodes = signal<Episode[]>([]);
  private _limit = signal(4);
  protected readonly expanded = signal(false);

  private ui = inject(UiService);
  private transloco = inject(TranslocoService);

  private readonly fullXml = computed(() => buildRssXml(this._episodes()));
  private readonly previewXml = computed(() => buildRssXml(this._episodes(), this._limit()));
  private readonly shown = computed(() => (this.expanded() ? this.fullXml() : this.previewXml()));

  protected readonly lines = computed(() => this.shown().split('\n'));
  protected readonly itemCount = computed(() => (this.shown().match(/<item>/g) ?? []).length);

  protected highlight = highlightXmlLine;
  protected tokenClass(kind: string) {
    return TOKEN_CLASS[kind];
  }

  protected async copy() {
    try {
      await navigator.clipboard.writeText(this.fullXml());
      this.ui.notifySuccess(this.transloco.translate('distribution.copied'));
    } catch {
      this.ui.notifyError(this.transloco.translate('distribution.copyFailed'));
    }
  }
}
