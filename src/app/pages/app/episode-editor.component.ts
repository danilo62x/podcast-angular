import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '@app/components/app/page-header.component';
import type { Crumb } from '@app/components/ui/breadcrumb.component';
import { EmptyStateComponent } from '@app/components/ui/empty-state.component';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { SwitchToggleComponent } from '@app/components/ui/switch-toggle.component';
import { TabsComponent, type TabItem } from '@app/components/ui/tabs.component';
import { BlockEditorComponent } from '@app/components/pc/block-editor.component';
import { ChapterMarkersComponent } from '@app/components/pc/chapter-markers.component';
import { WaveformComponent } from '@app/components/pc/waveform.component';
import { pcImage } from '@app/core/data/mock';
import { episodeById, slugify } from '@app/core/data/query';
import type { Block, Chapter, Episode, EpisodeStatus, TranscriptLine } from '@app/core/data/types';
import { PodcastService } from '@app/core/services/podcast.service';
import { UiService } from '@app/core/services/ui.service';
import { setLiteralTitle } from '@app/core/page-title';
import { formatClock, formatDurationLong } from '@app/lib/format';
import { activeLang } from '@app/lib/lang';

const CONTROL = 'focus-ring w-full rounded-lg border border-themed bg-transparent px-3 py-2.5 text-sm text-body';

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

const emptyDraft = (season: number): Episode => ({
  id: 0,
  slug: '',
  number: 0,
  season,
  title: '',
  subtitle: '',
  coverSeed: 'novo-episodio',
  durationSec: 2400,
  publishedAt: new Date().toISOString(),
  scheduledAt: null,
  status: 'rascunho',
  blocks: [{ type: 'paragraph', text: '' }],
  chapters: [{ id: 1, title: 'Abertura', startSec: 0 }],
  transcript: [],
  guestIds: [],
  tags: [],
  explicit: false,
  downloads: 0,
  uniqueListeners: 0,
  completionRate: 0,
  retention: [],
});

@Component({
  selector: 'app-episode-editor-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TranslocoModule,
    PageHeaderComponent,
    EmptyStateComponent,
    IconComponent,
    SwitchToggleComponent,
    TabsComponent,
    BlockEditorComponent,
    ChapterMarkersComponent,
    WaveformComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      @if (!isNew() && !existing()) {
        <app-empty-state
          icon="mic"
          [title]="t('episode.notFoundTitle')"
          [description]="t('episode.notFoundDesc')"
        >
          <a
            routerLink="/app/episodios"
            class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            {{ t('editor.backToList') }}
          </a>
        </app-empty-state>
      } @else {
        <div>
          <app-page-header
            [title]="isNew() ? t('editor.newTitle') : t('editor.editTitle')"
            [subtitle]="isNew() ? t('editor.newSubtitle') : draft().title || t('editor.untitled')"
            [crumbs]="crumbs()"
          >
            <div class="flex flex-wrap items-center gap-2">
              @if (!isNew() && draft().status === 'publicado') {
                <a
                  [routerLink]="['/episodio', draft().slug]"
                  class="inline-flex h-10 items-center gap-2 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <app-icon name="external-link" [size]="15" />
                  {{ t('editor.viewPublic') }}
                </a>
              }
              <button
                type="button"
                (click)="save()"
                class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                <app-icon name="save" [size]="16" />
                {{ t('common.save') }}
              </button>
            </div>
          </app-page-header>

          <div class="surface-card rounded-2xl border p-5">
            <app-tabs [tabs]="tabs()" [value]="tab()" (onChange)="tab.set($event)">
              @switch (tab()) {
                @case (0) {
                  <!-- ---- Áudio ---- -->
                  <div class="space-y-6">
                    <app-chapter-markers
                      [seed]="draft().slug || 'novo-episodio'"
                      [durationSec]="draft().durationSec"
                      [positionSec]="previewSec()"
                      [chapters]="draft().chapters"
                      (move)="moveChapter($event.id, $event.sec)"
                      (rename)="renameChapter($event.id, $event.title)"
                      (remove)="removeChapter($event)"
                      (add)="addChapter()"
                      (seekTo)="previewSec.set($event)"
                    />

                    <div class="grid gap-5 lg:grid-cols-2">
                      <div class="surface-card rounded-xl border p-4">
                        <p class="text-sm font-medium text-heading">{{ t('editor.audio.durationTitle') }}</p>
                        <p class="mt-1 text-xs text-muted">{{ t('editor.audio.durationHint') }}</p>
                        <div class="mt-4 flex items-center gap-3">
                          <input
                            type="range"
                            [min]="300"
                            [max]="7200"
                            [step]="30"
                            [ngModel]="draft().durationSec"
                            (ngModelChange)="setDuration(+$event)"
                            [attr.aria-label]="t('editor.audio.durationTitle')"
                            class="h-1 min-w-0 flex-1 cursor-pointer"
                          />
                          <span class="w-24 shrink-0 text-right font-mono text-sm text-heading tabular-nums">
                            {{ durationLong(draft().durationSec) }}
                          </span>
                        </div>
                      </div>

                      <div class="surface-card rounded-xl border p-4">
                        <p class="text-sm font-medium text-heading">{{ t('editor.audio.trimTitle') }}</p>
                        <p class="mt-1 text-xs text-muted">{{ t('editor.audio.trimHint') }}</p>

                        <div class="relative mt-4 h-10 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                          <div
                            class="absolute inset-y-0 bg-brand-500/25"
                            [style.left.%]="(trimStart() / draft().durationSec) * 100"
                            [style.width.%]="(trimmed() / draft().durationSec) * 100"
                          ></div>
                          <div class="absolute inset-0 px-1 py-1 opacity-70">
                            <app-waveform
                              [seed]="draft().slug || 'novo-episodio'"
                              [durationSec]="draft().durationSec"
                              [positionSec]="trimEnd()"
                              [bars]="64"
                              [height]="32"
                            />
                          </div>
                        </div>

                        <div class="mt-3 grid gap-3 sm:grid-cols-2">
                          <label class="text-xs text-muted">
                            {{ t('editor.audio.trimStart') }}
                            <input
                              type="range"
                              [min]="0"
                              [max]="draft().durationSec"
                              [step]="5"
                              [ngModel]="trimStart()"
                              (ngModelChange)="setTrimStart(+$event)"
                              class="mt-1 h-1 w-full cursor-pointer"
                            />
                            <span class="font-mono">{{ clock(trimStart()) }}</span>
                          </label>
                          <label class="text-xs text-muted">
                            {{ t('editor.audio.trimEnd') }}
                            <input
                              type="range"
                              [min]="0"
                              [max]="draft().durationSec"
                              [step]="5"
                              [ngModel]="trimEnd()"
                              (ngModelChange)="setTrimEnd(+$event)"
                              class="mt-1 h-1 w-full cursor-pointer"
                            />
                            <span class="font-mono">{{ clock(trimEnd()) }}</span>
                          </label>
                        </div>

                        <p class="mt-3 text-xs font-medium text-body">
                          {{ t('editor.audio.trimResult', { duration: durationLong(trimmed()) }) }}
                        </p>
                      </div>
                    </div>
                  </div>
                }

                @case (1) {
                  <!-- ---- Notas ---- -->
                  <div>
                    <p class="text-sm font-medium text-heading">{{ t('editor.notes.title') }}</p>
                    <p class="mt-1 mb-4 text-xs text-muted">{{ t('editor.notes.hint') }}</p>
                    <app-block-editor [blocks]="draft().blocks" (blocksChange)="setBlocks($event)" />
                  </div>
                }

                @case (2) {
                  <!-- ---- Convidados ---- -->
                  <div>
                    <p class="text-sm font-medium text-heading">{{ t('editor.guests.title') }}</p>
                    <p class="mt-1 text-xs text-muted">{{ t('editor.guests.hint') }}</p>
                    <p class="mt-3 text-xs font-medium text-brand-600 dark:text-brand-400">
                      {{ t('editor.guests.selected', { count: draft().guestIds.length }) }}
                    </p>

                    @if (podcast.guests().length === 0) {
                      <app-empty-state icon="users" [title]="t('editor.guests.empty')" />
                    } @else {
                      <div class="mt-4 grid gap-3 sm:grid-cols-2">
                        @for (guest of podcast.guests(); track guest.id) {
                          <label
                            [class]="
                              'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ' +
                              (draft().guestIds.includes(guest.id)
                                ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
                                : 'border-themed')
                            "
                          >
                            <input
                              type="checkbox"
                              [ngModel]="draft().guestIds.includes(guest.id)"
                              (ngModelChange)="toggleGuest(guest.id)"
                              class="h-4 w-4 shrink-0 rounded border-themed accent-brand-500"
                            />
                            <img [src]="guest.avatar" alt="" class="h-10 w-10 shrink-0 rounded-full object-cover" />
                            <span class="min-w-0">
                              <span class="block truncate text-sm font-medium text-heading">{{ guest.name }}</span>
                              <span class="block truncate text-xs text-muted">{{ guest.role }}</span>
                            </span>
                          </label>
                        }
                      </div>
                    }
                  </div>
                }

                @case (3) {
                  <!-- ---- Transcrição ---- -->
                  <div>
                    <p class="text-sm font-medium text-heading">{{ t('editor.transcriptTab.title') }}</p>
                    <p class="mt-1 mb-4 text-xs text-muted">{{ t('editor.transcriptTab.hint') }}</p>

                    @if (draft().transcript.length === 0) {
                      <app-empty-state icon="book-open" [title]="t('editor.transcriptTab.empty')" />
                    } @else {
                      <div class="space-y-2">
                        @for (line of draft().transcript; track line.id) {
                          <div class="surface-card rounded-xl border p-3">
                            <div class="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                (click)="previewSec.set(line.startSec)"
                                [title]="t('editor.audio.goTo')"
                                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-themed text-muted transition hover:text-brand-600"
                              >
                                <app-icon name="play" [size]="13" />
                              </button>
                              <span class="font-mono text-xs text-muted tabular-nums">
                                {{ clock(line.startSec) }} – {{ clock(line.endSec) }}
                              </span>
                              <input
                                list="pc-speakers"
                                [ngModel]="line.speaker"
                                (ngModelChange)="patchLine(line.id, { speaker: $event })"
                                [attr.aria-label]="t('editor.transcriptTab.speaker')"
                                class="focus-ring w-32 rounded-lg border border-themed bg-transparent px-2 py-1 text-xs font-semibold text-body"
                              />
                              <button
                                type="button"
                                (click)="removeLine(line.id)"
                                [attr.aria-label]="t('common.remove')"
                                class="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:text-error-500"
                              >
                                <app-icon name="trash" [size]="14" />
                              </button>
                            </div>
                            <textarea
                              [ngModel]="line.text"
                              (ngModelChange)="patchLine(line.id, { text: $event })"
                              [rows]="2"
                              [attr.aria-label]="t('editor.transcriptTab.text')"
                              [class]="control + ' mt-2'"
                            ></textarea>
                          </div>
                        }
                        <datalist id="pc-speakers">
                          @for (s of speakers(); track s) {
                            <option [value]="s"></option>
                          }
                        </datalist>
                      </div>
                    }
                  </div>
                }

                @default {
                  <!-- ---- Publicação ---- -->
                  <div class="grid gap-5 lg:grid-cols-[1fr_280px]">
                    <div class="min-w-0 space-y-4">
                      <div>
                        <label class="mb-1.5 block text-sm font-medium text-heading" for="ep-title">
                          {{ t('editor.publish.title') }}
                        </label>
                        <input
                          id="ep-title"
                          [ngModel]="draft().title"
                          (ngModelChange)="patch({ title: $event })"
                          [placeholder]="t('editor.publish.titlePlaceholder')"
                          [class]="control"
                        />
                      </div>

                      <div>
                        <label class="mb-1.5 block text-sm font-medium text-heading" for="ep-subtitle">
                          {{ t('editor.publish.subtitle') }}
                        </label>
                        <input
                          id="ep-subtitle"
                          [ngModel]="draft().subtitle"
                          (ngModelChange)="patch({ subtitle: $event })"
                          [placeholder]="t('editor.publish.subtitlePlaceholder')"
                          [class]="control"
                        />
                      </div>

                      <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label class="mb-1.5 block text-sm font-medium text-heading" for="ep-slug">
                            {{ t('editor.publish.slug') }}
                          </label>
                          <input
                            id="ep-slug"
                            [ngModel]="draft().slug"
                            (ngModelChange)="patch({ slug: slugify($event) })"
                            [class]="control"
                          />
                        </div>
                        <div>
                          <label class="mb-1.5 block text-sm font-medium text-heading" for="ep-cover">
                            {{ t('editor.publish.cover') }}
                          </label>
                          <input
                            id="ep-cover"
                            [ngModel]="draft().coverSeed"
                            (ngModelChange)="patch({ coverSeed: $event })"
                            [class]="control"
                          />
                          <p class="mt-1 text-xs text-muted">{{ t('editor.publish.coverHint') }}</p>
                        </div>
                      </div>

                      <div class="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label class="mb-1.5 block text-sm font-medium text-heading" for="ep-season">
                            {{ t('editor.publish.season') }}
                          </label>
                          <select
                            id="ep-season"
                            [ngModel]="draft().season"
                            (ngModelChange)="patch({ season: +$event })"
                            [class]="control"
                          >
                            @for (s of podcast.seasons(); track s.number) {
                              <option [value]="s.number">{{ t('episode.season', { season: s.number }) }}</option>
                            }
                          </select>
                        </div>
                        <div>
                          <label class="mb-1.5 block text-sm font-medium text-heading" for="ep-number">
                            {{ t('editor.publish.number') }}
                          </label>
                          <input
                            id="ep-number"
                            type="number"
                            [min]="1"
                            [ngModel]="draft().number"
                            (ngModelChange)="patch({ number: +$event })"
                            [class]="control"
                          />
                        </div>
                        <div>
                          <label class="mb-1.5 block text-sm font-medium text-heading" for="ep-status">
                            {{ t('editor.publish.status') }}
                          </label>
                          <select
                            id="ep-status"
                            [ngModel]="draft().status"
                            (ngModelChange)="patch({ status: $any($event) })"
                            [class]="control"
                          >
                            @for (s of statuses; track s) {
                              <option [value]="s">{{ t('episodeStatuses.' + s) }}</option>
                            }
                          </select>
                        </div>
                      </div>

                      <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label class="mb-1.5 block text-sm font-medium text-heading" for="ep-date">
                            {{ t('editor.publish.date') }}
                          </label>
                          <input
                            id="ep-date"
                            type="datetime-local"
                            [ngModel]="localInput(draft().publishedAt)"
                            (ngModelChange)="setPublishedAt($event)"
                            [class]="control"
                          />
                        </div>
                        @if (draft().status === 'agendado') {
                          <div>
                            <label class="mb-1.5 block text-sm font-medium text-heading" for="ep-sched">
                              {{ t('editor.publish.scheduledAt') }}
                            </label>
                            <input
                              id="ep-sched"
                              type="datetime-local"
                              [ngModel]="localInput(draft().scheduledAt ?? draft().publishedAt)"
                              (ngModelChange)="setScheduledAt($event)"
                              [class]="control"
                            />
                          </div>
                        }
                      </div>

                      <div>
                        <label class="mb-1.5 block text-sm font-medium text-heading" for="ep-tags">
                          {{ t('editor.publish.tags') }}
                        </label>
                        <input
                          id="ep-tags"
                          [ngModel]="tagInput()"
                          (ngModelChange)="tagInput.set($event)"
                          (keydown)="addTag($event)"
                          [placeholder]="t('editor.publish.tagsPlaceholder')"
                          [class]="control"
                        />
                        @if (draft().tags.length > 0) {
                          <div class="mt-2 flex flex-wrap gap-2">
                            @for (tag of draft().tags; track tag) {
                              <span
                                class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-body dark:bg-gray-800"
                              >
                                {{ tag }}
                                <button
                                  type="button"
                                  (click)="removeTag(tag)"
                                  [attr.aria-label]="t('common.remove')"
                                  class="text-muted hover:text-error-500"
                                >
                                  <app-icon name="x" [size]="12" />
                                </button>
                              </span>
                            }
                          </div>
                        }
                      </div>

                      <div class="flex items-start justify-between gap-4 rounded-xl border border-themed p-4">
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-heading">{{ t('editor.publish.explicit') }}</p>
                          <p class="mt-0.5 text-xs text-muted">{{ t('editor.publish.explicitHint') }}</p>
                        </div>
                        <app-switch-toggle
                          [checked]="draft().explicit"
                          (changed)="patch({ explicit: $event })"
                        />
                      </div>
                    </div>

                    <aside class="min-w-0">
                      <div class="surface-card rounded-xl border p-4">
                        <img [src]="coverPreview()" alt="" class="aspect-square w-full rounded-lg object-cover" />
                        <p class="mt-3 truncate text-sm font-semibold text-heading">
                          {{ draft().title || t('editor.untitled') }}
                        </p>
                        <p class="mt-0.5 text-xs text-muted">
                          {{ t('episode.seasonEpisode', { season: draft().season, number: draft().number }) }} ·
                          {{ durationLong(draft().durationSec) }}
                        </p>
                      </div>
                    </aside>
                  </div>
                }
              }
            </app-tabs>
          </div>
        </div>
      }
    </ng-container>
  `,
})
export class EpisodeEditorPageComponent {
  /** Vem do `withComponentInputBinding()` — rota `/app/episodios/:id` (aceita `novo`). */
  readonly id = input<string>('');

  podcast = inject(PodcastService);
  private ui = inject(UiService);
  private router = inject(Router);
  private transloco = inject(TranslocoService);
  private lang = activeLang();

  // selectTranslate espera o JSON do idioma carregar — translate() puro devolveria
  // a chave crua no primeiro render (e ela apareceria no título da aba).
  private readonly newTitleLabel = toSignal(this.transloco.selectTranslate('editor.newTitle'), {
    initialValue: '',
  });
  private readonly untitledLabel = toSignal(this.transloco.selectTranslate('editor.untitled'), {
    initialValue: '',
  });

  protected readonly control = CONTROL;
  protected readonly statuses: EpisodeStatus[] = ['rascunho', 'agendado', 'publicado'];
  protected readonly slugify = slugify;
  protected readonly clock = formatClock;
  protected readonly durationLong = formatDurationLong;
  protected readonly localInput = toLocalInput;

  protected readonly isNew = computed(() => this.id() === 'novo');
  protected readonly existing = computed(() =>
    this.isNew() ? undefined : episodeById(this.podcast.episodes(), Number(this.id()))
  );

  protected readonly draft = signal<Episode>(emptyDraft(1));
  protected readonly tab = signal(0);
  protected readonly previewSec = signal(0);
  protected readonly tagInput = signal('');
  protected readonly trimStart = signal(0);
  protected readonly trimEnd = signal(0);

  protected readonly trimmed = computed(() => Math.max(0, this.trimEnd() - this.trimStart()));

  protected readonly speakers = computed(() =>
    Array.from(new Set(this.draft().transcript.map((l) => l.speaker))).sort()
  );

  protected readonly tabs = computed<TabItem[]>(() => {
    this.lang();
    const t = (key: string) => this.transloco.translate(key);
    return [
      { label: t('editor.tabs.audio'), icon: 'waveform' },
      { label: t('editor.tabs.notes'), icon: 'file-text' },
      { label: t('editor.tabs.guests'), icon: 'users' },
      { label: t('editor.tabs.transcript'), icon: 'book-open' },
      { label: t('editor.tabs.publish'), icon: 'upload' },
    ];
  });

  protected readonly crumbs = computed<Crumb[]>(() => {
    this.lang();
    return [
      { label: this.transloco.translate('appNav.episodes'), href: '/app/episodios', icon: 'mic' },
      {
        label: this.isNew() ? this.newTitleLabel() : this.draft().title || this.untitledLabel(),
      },
    ];
  });

  constructor() {
    // Carrega o rascunho do episódio da rota (ou um em branco para `novo`).
    effect(() => {
      const existing = this.existing();
      if (existing) {
        this.draft.set({ ...existing });
        this.trimStart.set(0);
        this.trimEnd.set(existing.durationSec);
        this.previewSec.set(0);
      } else if (this.isNew()) {
        const seasons = this.podcast.seasons();
        const fresh = emptyDraft(seasons[seasons.length - 1]?.number ?? 1);
        this.draft.set(fresh);
        this.trimStart.set(0);
        this.trimEnd.set(fresh.durationSec);
        this.previewSec.set(0);
      }
    });

    // O título da aba nunca pode mostrar a chave crua: os rótulos vêm de
    // selectTranslate(), que só emite depois de o JSON do idioma carregar.
    effect(() => {
      const title = this.isNew() ? this.newTitleLabel() : this.draft().title || this.untitledLabel();
      if (title) setLiteralTitle(title);
    });
  }

  protected patch(next: Partial<Episode>) {
    this.draft.update((d) => ({ ...d, ...next }));
  }

  protected coverPreview() {
    return pcImage(this.draft().coverSeed || 'novo-episodio', 480, 480);
  }

  protected setBlocks(blocks: Block[]) {
    this.patch({ blocks });
  }

  protected setDuration(value: number) {
    this.patch({ durationSec: value });
    this.trimStart.update((a) => Math.min(a, value));
    this.trimEnd.update((b) => Math.min(b, value));
  }

  protected setTrimStart(value: number) {
    this.trimStart.set(Math.min(value, this.trimEnd()));
  }

  protected setTrimEnd(value: number) {
    this.trimEnd.set(Math.max(value, this.trimStart()));
  }

  protected setPublishedAt(value: string) {
    if (!value) return;
    this.patch({ publishedAt: new Date(value).toISOString() });
  }

  protected setScheduledAt(value: string) {
    if (!value) return;
    const iso = new Date(value).toISOString();
    this.patch({ scheduledAt: iso, publishedAt: iso });
  }

  protected toggleGuest(guestId: number) {
    const ids = this.draft().guestIds;
    this.patch({
      guestIds: ids.includes(guestId) ? ids.filter((g) => g !== guestId) : [...ids, guestId],
    });
  }

  // ---- Capítulos ----------------------------------------------------------

  protected moveChapter(chapterId: number, startSec: number) {
    const d = this.draft();
    this.patch({
      chapters: d.chapters
        .map((c) =>
          c.id === chapterId
            ? { ...c, startSec: Math.max(0, Math.min(Math.round(startSec), d.durationSec - 1)) }
            : c
        )
        .sort((a, b) => a.startSec - b.startSec),
    });
  }

  protected renameChapter(chapterId: number, title: string) {
    this.patch({
      chapters: this.draft().chapters.map((c) => (c.id === chapterId ? { ...c, title } : c)),
    });
  }

  protected removeChapter(chapterId: number) {
    this.patch({ chapters: this.draft().chapters.filter((c) => c.id !== chapterId) });
  }

  protected addChapter() {
    const d = this.draft();
    const nextId = d.chapters.length ? Math.max(...d.chapters.map((c) => c.id)) + 1 : 1;
    const chapter: Chapter = {
      id: nextId,
      title: this.transloco.translate('editor.audio.chapterTitle'),
      startSec: Math.min(this.previewSec(), d.durationSec - 1),
    };
    this.patch({ chapters: [...d.chapters, chapter].sort((a, b) => a.startSec - b.startSec) });
  }

  // ---- Transcrição --------------------------------------------------------

  protected patchLine(lineId: number, next: Partial<TranscriptLine>) {
    this.patch({
      transcript: this.draft().transcript.map((l) => (l.id === lineId ? { ...l, ...next } : l)),
    });
  }

  protected removeLine(lineId: number) {
    this.patch({ transcript: this.draft().transcript.filter((l) => l.id !== lineId) });
  }

  // ---- Tags ---------------------------------------------------------------

  protected addTag(e: Event) {
    const event = e as KeyboardEvent;
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const value = this.tagInput().trim();
    if (!value || this.draft().tags.includes(value)) return;
    this.patch({ tags: [...this.draft().tags, value] });
    this.tagInput.set('');
  }

  protected removeTag(tag: string) {
    this.patch({ tags: this.draft().tags.filter((x) => x !== tag) });
  }

  // ---- Salvar -------------------------------------------------------------

  protected save() {
    const d = this.draft();
    if (this.isNew()) {
      const created = this.podcast.addEpisode({
        ...d,
        title: d.title || this.transloco.translate('editor.untitled'),
        slug: d.slug || slugify(d.title || 'novo-episodio'),
      });
      this.ui.notifySuccess(this.transloco.translate('editor.created'));
      this.router.navigate(['/app/episodios', created.id]);
      return;
    }
    this.podcast.updateEpisode(d.id, d);
    this.ui.notifySuccess(this.transloco.translate('editor.saved'));
  }
}
