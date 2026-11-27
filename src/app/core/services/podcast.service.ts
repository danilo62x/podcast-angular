import { Injectable, effect, signal } from '@angular/core';
import {
  COUNTRY_STATS,
  DISTRIBUTIONS,
  EPISODES,
  GUESTS,
  MONTHLY_DOWNLOADS,
  MONTHLY_SUBSCRIBERS,
  PLATFORM_STATS,
  SEASONS,
  SPONSORS,
} from '../data/mock';
import { slugify } from '../data/query';
import type {
  Chapter,
  CountryStat,
  Distribution,
  Episode,
  Guest,
  PlatformStat,
  Season,
  SeriesPoint,
  Sponsor,
  TranscriptLine,
} from '../data/types';

const STORAGE_KEY = 'pc-data';

const nextId = (rows: { id: number }[]) => (rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1);

const cloneEpisode = (e: Episode): Episode => ({
  ...e,
  blocks: e.blocks.map((b) => ({ ...b, items: b.items ? [...b.items] : undefined })),
  chapters: e.chapters.map((c) => ({ ...c })),
  transcript: e.transcript.map((t) => ({ ...t })),
  guestIds: [...e.guestIds],
  tags: [...e.tags],
  retention: [...e.retention],
});

export type NewEpisodeInput = Partial<Omit<Episode, 'id'>> & { title: string };

interface Snapshot {
  episodes: Episode[];
  guests: Guest[];
  sponsors: Sponsor[];
  seasons: Season[];
  platformStats: PlatformStat[];
  countryStats: CountryStat[];
  distributions: Distribution[];
  monthlyDownloads: SeriesPoint[];
  monthlySubscribers: SeriesPoint[];
}

const seed = (): Snapshot => ({
  episodes: EPISODES.map(cloneEpisode),
  guests: GUESTS.map((g) => ({ ...g, links: g.links.map((l) => ({ ...l })), episodeIds: [...g.episodeIds] })),
  sponsors: SPONSORS.map((s) => ({ ...s, episodeIds: [...s.episodeIds] })),
  seasons: SEASONS.map((s) => ({ ...s })),
  platformStats: PLATFORM_STATS.map((p) => ({ ...p })),
  countryStats: COUNTRY_STATS.map((c) => ({ ...c })),
  distributions: DISTRIBUTIONS.map((d) => ({ ...d })),
  monthlyDownloads: MONTHLY_DOWNLOADS.map((p) => ({ ...p })),
  monthlySubscribers: MONTHLY_SUBSCRIBERS.map((p) => ({ ...p })),
});

function loadPersisted(): Snapshot {
  const fallback = seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: Partial<Snapshot> } & Partial<Snapshot>;
      const s = parsed.state ?? parsed;
      return { ...fallback, ...s };
    }
  } catch {}
  return fallback;
}

/** Mantém os convidados coerentes com os episódios depois de qualquer mudança. */
function withGuestLinks(guests: Guest[], episodes: Episode[]): Guest[] {
  return guests.map((g) => ({
    ...g,
    episodeIds: episodes.filter((e) => e.guestIds.includes(g.id)).map((e) => e.id),
  }));
}

@Injectable({ providedIn: 'root' })
export class PodcastService {
  private initial = loadPersisted();

  readonly episodes = signal<Episode[]>(this.initial.episodes);
  readonly guests = signal<Guest[]>(this.initial.guests);
  readonly sponsors = signal<Sponsor[]>(this.initial.sponsors);
  readonly seasons = signal<Season[]>(this.initial.seasons);
  readonly platformStats = signal<PlatformStat[]>(this.initial.platformStats);
  readonly countryStats = signal<CountryStat[]>(this.initial.countryStats);
  readonly distributions = signal<Distribution[]>(this.initial.distributions);
  readonly monthlyDownloads = signal<SeriesPoint[]>(this.initial.monthlyDownloads);
  readonly monthlySubscribers = signal<SeriesPoint[]>(this.initial.monthlySubscribers);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            episodes: this.episodes(),
            guests: this.guests(),
            sponsors: this.sponsors(),
            seasons: this.seasons(),
            platformStats: this.platformStats(),
            countryStats: this.countryStats(),
            distributions: this.distributions(),
            monthlyDownloads: this.monthlyDownloads(),
            monthlySubscribers: this.monthlySubscribers(),
          })
        );
      } catch {}
    });
  }

  // ---- Episódios ---------------------------------------------------------

  addEpisode(data: NewEpisodeInput): Episode {
    const episodes = this.episodes();
    const season = data.season ?? Math.max(...this.seasons().map((s) => s.number));
    const episode: Episode = {
      id: nextId(episodes),
      slug: data.slug || slugify(data.title),
      number: data.number ?? Math.max(0, ...episodes.map((e) => e.number)) + 1,
      season,
      title: data.title,
      subtitle: data.subtitle ?? '',
      coverSeed: data.coverSeed ?? (slugify(data.title) || 'novo-episodio'),
      durationSec: data.durationSec ?? 1800,
      publishedAt: data.publishedAt ?? new Date().toISOString(),
      scheduledAt: data.scheduledAt ?? null,
      status: data.status ?? 'rascunho',
      blocks: data.blocks ?? [{ type: 'paragraph', text: '' }],
      chapters: data.chapters ?? [{ id: 1, title: 'Abertura', startSec: 0 }],
      transcript: data.transcript ?? [],
      guestIds: data.guestIds ?? [],
      tags: data.tags ?? [],
      explicit: data.explicit ?? false,
      downloads: 0,
      uniqueListeners: 0,
      completionRate: 0,
      retention: [],
    };
    const next = [...episodes, episode];
    this.episodes.set(next);
    this.guests.set(withGuestLinks(this.guests(), next));
    return episode;
  }

  updateEpisode(id: number, patch: Partial<Episode>) {
    const episodes = this.episodes().map((e) => (e.id === id ? { ...e, ...patch } : e));
    this.episodes.set(episodes);
    this.guests.set(withGuestLinks(this.guests(), episodes));
  }

  removeEpisode(id: number) {
    const episodes = this.episodes().filter((e) => e.id !== id);
    this.episodes.set(episodes);
    this.guests.set(withGuestLinks(this.guests(), episodes));
    this.sponsors.set(
      this.sponsors().map((s) => ({ ...s, episodeIds: s.episodeIds.filter((eid) => eid !== id) }))
    );
  }

  duplicateEpisode(id: number): Episode | undefined {
    const original = this.episodes().find((e) => e.id === id);
    if (!original) return undefined;
    const episodes = this.episodes();
    const copy: Episode = {
      ...cloneEpisode(original),
      id: nextId(episodes),
      number: Math.max(0, ...episodes.map((e) => e.number)) + 1,
      slug: `${original.slug}-copia`,
      title: `${original.title} (cópia)`,
      status: 'rascunho',
      scheduledAt: null,
      publishedAt: new Date().toISOString(),
      downloads: 0,
      uniqueListeners: 0,
      completionRate: 0,
      retention: [],
    };
    const next = [...episodes, copy];
    this.episodes.set(next);
    this.guests.set(withGuestLinks(this.guests(), next));
    return copy;
  }

  publishEpisode(id: number) {
    this.updateEpisode(id, {
      status: 'publicado',
      scheduledAt: null,
      publishedAt: new Date().toISOString(),
    });
  }

  scheduleEpisode(id: number, isoDate: string) {
    this.updateEpisode(id, { status: 'agendado', scheduledAt: isoDate, publishedAt: isoDate });
  }

  unpublishEpisode(id: number) {
    this.updateEpisode(id, { status: 'rascunho', scheduledAt: null });
  }

  // ---- Capítulos ---------------------------------------------------------

  addChapter(episodeId: number, title: string, startSec: number) {
    const episode = this.episodes().find((e) => e.id === episodeId);
    if (!episode) return;
    const chapter: Chapter = {
      id: nextId(episode.chapters),
      title,
      startSec: Math.max(0, Math.min(Math.round(startSec), episode.durationSec)),
    };
    this.updateEpisode(episodeId, {
      chapters: [...episode.chapters, chapter].sort((a, b) => a.startSec - b.startSec),
    });
  }

  updateChapter(episodeId: number, chapterId: number, patch: Partial<Chapter>) {
    const episode = this.episodes().find((e) => e.id === episodeId);
    if (!episode) return;
    this.updateEpisode(episodeId, {
      chapters: episode.chapters.map((c) => (c.id === chapterId ? { ...c, ...patch } : c)),
    });
  }

  /** Arrastar o marcador na forma de onda — mantém a ordem por `startSec`. */
  moveChapter(episodeId: number, chapterId: number, startSec: number) {
    const episode = this.episodes().find((e) => e.id === episodeId);
    if (!episode) return;
    const clamped = Math.max(0, Math.min(Math.round(startSec), episode.durationSec - 1));
    this.updateEpisode(episodeId, {
      chapters: episode.chapters
        .map((c) => (c.id === chapterId ? { ...c, startSec: clamped } : c))
        .sort((a, b) => a.startSec - b.startSec),
    });
  }

  removeChapter(episodeId: number, chapterId: number) {
    const episode = this.episodes().find((e) => e.id === episodeId);
    if (!episode) return;
    this.updateEpisode(episodeId, {
      chapters: episode.chapters.filter((c) => c.id !== chapterId),
    });
  }

  // ---- Transcrição -------------------------------------------------------

  updateTranscriptLine(episodeId: number, lineId: number, patch: Partial<TranscriptLine>) {
    const episode = this.episodes().find((e) => e.id === episodeId);
    if (!episode) return;
    this.updateEpisode(episodeId, {
      transcript: episode.transcript.map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
    });
  }

  removeTranscriptLine(episodeId: number, lineId: number) {
    const episode = this.episodes().find((e) => e.id === episodeId);
    if (!episode) return;
    this.updateEpisode(episodeId, {
      transcript: episode.transcript.filter((l) => l.id !== lineId),
    });
  }

  // ---- Convidados --------------------------------------------------------

  addGuest(data: Omit<Guest, 'id' | 'episodeIds'>): Guest {
    const guest: Guest = {
      ...data,
      id: nextId(this.guests()),
      slug: data.slug || slugify(data.name),
      episodeIds: [],
    };
    this.guests.set([...this.guests(), guest]);
    return guest;
  }

  updateGuest(id: number, patch: Partial<Guest>) {
    this.guests.set(this.guests().map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  removeGuest(id: number) {
    const episodes = this.episodes().map((e) => ({
      ...e,
      guestIds: e.guestIds.filter((gid) => gid !== id),
    }));
    this.episodes.set(episodes);
    this.guests.set(this.guests().filter((g) => g.id !== id));
  }

  // ---- Patrocinadores ----------------------------------------------------

  updateSponsor(id: number, patch: Partial<Sponsor>) {
    this.sponsors.set(this.sponsors().map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  toggleSponsorEpisode(sponsorId: number, episodeId: number) {
    this.sponsors.set(
      this.sponsors().map((s) =>
        s.id === sponsorId
          ? {
              ...s,
              episodeIds: s.episodeIds.includes(episodeId)
                ? s.episodeIds.filter((id) => id !== episodeId)
                : [...s.episodeIds, episodeId].sort((a, b) => a - b),
            }
          : s
      )
    );
  }

  reset() {
    const fresh = seed();
    this.episodes.set(fresh.episodes);
    this.guests.set(fresh.guests);
    this.sponsors.set(fresh.sponsors);
    this.seasons.set(fresh.seasons);
    this.platformStats.set(fresh.platformStats);
    this.countryStats.set(fresh.countryStats);
    this.distributions.set(fresh.distributions);
    this.monthlyDownloads.set(fresh.monthlyDownloads);
    this.monthlySubscribers.set(fresh.monthlySubscribers);
  }
}
