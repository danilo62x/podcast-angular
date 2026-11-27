import type {
  Chapter,
  CountryStat,
  Episode,
  Guest,
  PlatformStat,
  RetentionDrop,
  SeriesPoint,
  Sponsor,
  TranscriptLine,
} from './types'
import { SHOW, seedHash } from './mock'

// ---- Lookups ------------------------------------------------------------

export function episodeById(list: Episode[], id: number): Episode | undefined {
  return list.find((e) => e.id === id)
}
export function episodeBySlug(list: Episode[], slug: string): Episode | undefined {
  return list.find((e) => e.slug === slug)
}
export function guestById(list: Guest[], id: number): Guest | undefined {
  return list.find((g) => g.id === id)
}
export function guestBySlug(list: Guest[], slug: string): Guest | undefined {
  return list.find((g) => g.slug === slug)
}
export function guestsOf(list: Guest[], episode: Episode): Guest[] {
  return episode.guestIds.map((id) => guestById(list, id)).filter((g): g is Guest => Boolean(g))
}

/** Slug simples — usado ao criar episódio no estúdio. */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ---- Recortes por status ------------------------------------------------

const byNewest = (a: Episode, b: Episode) => b.publishedAt.localeCompare(a.publishedAt)

export function publishedEpisodes(list: Episode[]): Episode[] {
  return list.filter((e) => e.status === 'publicado').sort(byNewest)
}

export function scheduledEpisodes(list: Episode[]): Episode[] {
  return list
    .filter((e) => e.status === 'agendado')
    .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''))
}

export function draftEpisodes(list: Episode[]): Episode[] {
  return list.filter((e) => e.status === 'rascunho').sort(byNewest)
}

export function latestEpisode(list: Episode[]): Episode | undefined {
  return publishedEpisodes(list)[0]
}

export function episodesOfSeason(list: Episode[], season: number): Episode[] {
  return list.filter((e) => e.season === season).sort((a, b) => b.number - a.number)
}

export function episodesOfGuest(list: Episode[], guestId: number): Episode[] {
  return publishedEpisodes(list).filter((e) => e.guestIds.includes(guestId))
}

/** Episódios da mesma temporada ou que compartilham tag, exceto ele mesmo. */
export function relatedEpisodes(list: Episode[], episode: Episode, limit = 3): Episode[] {
  const others = publishedEpisodes(list).filter((e) => e.id !== episode.id)
  const scored = others.map((e) => {
    const shared = e.tags.filter((t) => episode.tags.includes(t)).length
    const sameSeason = e.season === episode.season ? 1 : 0
    const sameGuest = e.guestIds.some((g) => episode.guestIds.includes(g)) ? 2 : 0
    return { episode: e, score: shared * 2 + sameSeason + sameGuest }
  })
  return scored
    .sort((a, b) => b.score - a.score || b.episode.publishedAt.localeCompare(a.episode.publishedAt))
    .slice(0, limit)
    .map((s) => s.episode)
}

// ---- Busca e filtros ----------------------------------------------------

export function episodeText(e: Episode): string {
  return [e.title, e.subtitle, e.tags.join(' '), e.blocks.map((b) => b.text ?? b.label ?? '').join(' ')]
    .join(' ')
    .toLowerCase()
}

export interface EpisodeFilters {
  term?: string
  season?: number | 'all'
  guestId?: number | 'all'
  /** curto: < 30min · medio: 30–50min · longo: > 50min */
  duration?: 'all' | 'curto' | 'medio' | 'longo'
  sort?: 'recentes' | 'antigos' | 'populares' | 'longos' | 'curtos'
}

export function filterEpisodes(list: Episode[], filters: EpisodeFilters): Episode[] {
  const term = (filters.term ?? '').trim().toLowerCase()
  let rows = list.filter((e) => {
    if (term && !episodeText(e).includes(term)) return false
    if (filters.season && filters.season !== 'all' && e.season !== filters.season) return false
    if (filters.guestId && filters.guestId !== 'all' && !e.guestIds.includes(filters.guestId)) return false
    if (filters.duration && filters.duration !== 'all') {
      const mins = e.durationSec / 60
      if (filters.duration === 'curto' && mins >= 30) return false
      if (filters.duration === 'medio' && (mins < 30 || mins > 50)) return false
      if (filters.duration === 'longo' && mins <= 50) return false
    }
    return true
  })

  switch (filters.sort) {
    case 'antigos':
      rows = rows.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))
      break
    case 'populares':
      rows = rows.sort((a, b) => b.downloads - a.downloads)
      break
    case 'longos':
      rows = rows.sort((a, b) => b.durationSec - a.durationSec)
      break
    case 'curtos':
      rows = rows.sort((a, b) => a.durationSec - b.durationSec)
      break
    default:
      rows = rows.sort(byNewest)
  }
  return rows
}

// ---- Números da audiência ----------------------------------------------

export function totalDownloads(list: Episode[]): number {
  return list.reduce((sum, e) => sum + e.downloads, 0)
}

export function totalUniqueListeners(list: Episode[]): number {
  return list.reduce((sum, e) => sum + e.uniqueListeners, 0)
}

/** Média ponderada pelos downloads — episódio grande pesa mais. */
export function averageCompletion(list: Episode[]): number {
  const rows = list.filter((e) => e.status === 'publicado' && e.downloads > 0)
  const total = totalDownloads(rows)
  if (!total) return 0
  return rows.reduce((sum, e) => sum + e.completionRate * e.downloads, 0) / total
}

/** Episódios mais ouvidos, do maior para o menor. */
export function topEpisodes(list: Episode[], limit = 5): Episode[] {
  return publishedEpisodes(list)
    .slice()
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, limit)
}

/**
 * Downloads por dia dos últimos `days` dias. A série é determinística: cada dia
 * combina uma base semanal (fim de semana rende menos) com um ruído por seed.
 */
export function downloadsByDay(list: Episode[], days = 30): SeriesPoint[] {
  const monthly = Math.max(1, Math.round(totalDownloads(list) * 0.08))
  const daily = monthly / days
  const out: SeriesPoint[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const weekend = d.getDay() === 0 || d.getDay() === 6 ? 0.72 : 1.06
    const noise = 0.85 + (seedHash('dia-' + d.toDateString()) % 32) / 100
    out.push({
      label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      value: Math.round(daily * weekend * noise),
    })
  }
  return out
}

/** Downloads por plataforma, do maior para o menor. */
export function downloadsByPlatform(stats: PlatformStat[]): PlatformStat[] {
  return stats.slice().sort((a, b) => b.downloads - a.downloads)
}

/** Downloads por país, do maior para o menor, com o percentual do total. */
export function downloadsByCountry(stats: CountryStat[]): (CountryStat & { share: number })[] {
  const total = stats.reduce((sum, c) => sum + c.downloads, 0) || 1
  return stats
    .slice()
    .sort((a, b) => b.downloads - a.downloads)
    .map((c) => ({ ...c, share: c.downloads / total }))
}

/**
 * Ponto de maior queda da curva de retenção — é o que a tela de audiência
 * anota como "onde as pessoas param".
 */
export function biggestRetentionDrop(retention: number[], durationSec: number): RetentionDrop | null {
  if (retention.length < 2) return null
  let index = 1
  let delta = 0
  for (let i = 1; i < retention.length; i++) {
    const d = retention[i - 1] - retention[i]
    if (d > delta) {
      delta = d
      index = i
    }
  }
  const at = index / (retention.length - 1)
  return { index, at, atSec: Math.round(durationSec * at), delta: Number(delta.toFixed(4)) }
}

/** Faturamento estimado de um patrocinador: impressões / 1000 × CPM. */
export function sponsorRevenue(sponsor: Sponsor): number {
  return (sponsor.impressions / 1000) * sponsor.cpm
}

export function totalSponsorRevenue(list: Sponsor[]): number {
  return list.reduce((sum, s) => sum + sponsorRevenue(s), 0)
}

// ---- Capítulos e transcrição -------------------------------------------

/** Capítulo que contém o segundo informado. */
export function chapterAt(chapters: Chapter[], sec: number): Chapter | undefined {
  const sorted = chapters.slice().sort((a, b) => a.startSec - b.startSec)
  let found: Chapter | undefined
  for (const c of sorted) {
    if (c.startSec <= sec) found = c
    else break
  }
  return found ?? sorted[0]
}

/** Linha da transcrição correspondente ao segundo informado. */
export function lineAt(transcript: TranscriptLine[], sec: number): TranscriptLine | undefined {
  const exact = transcript.find((l) => sec >= l.startSec && sec <= l.endSec)
  if (exact) return exact
  // Fora de um trecho transcrito: destaca a última linha já ultrapassada.
  const before = transcript.filter((l) => l.startSec <= sec)
  return before.length ? before[before.length - 1] : undefined
}

/** Fim do capítulo (início do próximo, ou fim do episódio). */
export function chapterEnd(chapters: Chapter[], chapter: Chapter, durationSec: number): number {
  const next = chapters
    .slice()
    .sort((a, b) => a.startSec - b.startSec)
    .find((c) => c.startSec > chapter.startSec)
  return next ? next.startSec : durationSec
}

// ---- Forma de onda ------------------------------------------------------

/**
 * Barras verticais determinísticas a partir de um seed — nada de imagem nem de
 * biblioteca. Os valores vão de 0.12 a 1 e desenham um envelope com alguns
 * picos, parecido com uma conversa gravada.
 */
export function waveformBars(seed: string, count = 120): number[] {
  const bars: number[] = []
  for (let i = 0; i < count; i++) {
    const h = seedHash(`${seed}:${i}`)
    const base = 0.34 + (h % 46) / 100
    const swell = Math.sin((i / count) * Math.PI * 6 + (seedHash(seed) % 100) / 16) * 0.18
    const spike = h % 17 === 0 ? 0.26 : 0
    bars.push(Math.min(1, Math.max(0.12, Number((base + swell + spike).toFixed(3)))))
  }
  return bars
}

// ---- Contagem regressiva ------------------------------------------------

export interface Countdown {
  days: number
  hours: number
  minutes: number
  /** Milissegundos restantes; 0 ou menos quando a data já passou. */
  total: number
}

export function countdownTo(iso: string, now: Date = new Date()): Countdown {
  const total = new Date(iso).getTime() - now.getTime()
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, total: 0 }
  const minutes = Math.floor(total / 60000)
  return {
    days: Math.floor(minutes / 1440),
    hours: Math.floor((minutes % 1440) / 60),
    minutes: minutes % 60,
    total,
  }
}

// ---- Feed RSS -----------------------------------------------------------

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const RFC822_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const RFC822_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** Data no formato exigido pelo RSS (RFC 822), sempre em GMT. */
export function rfc822(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${RFC822_DAYS[d.getUTCDay()]}, ${pad(d.getUTCDate())} ${RFC822_MONTHS[d.getUTCMonth()]} ` +
    `${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} GMT`
  )
}

/** Descrição em texto puro a partir dos blocos do episódio. */
export function plainDescription(episode: Episode): string {
  return episode.blocks
    .map((b) => {
      if (b.type === 'list') return (b.items ?? []).map((i) => `• ${i}`).join(' ')
      if (b.type === 'link') return `${b.label ?? ''}: ${b.href ?? ''}`
      return b.text ?? ''
    })
    .filter(Boolean)
    .join(' ')
}

/** Tamanho fictício do arquivo — 128 kbps estéreo. */
export function enclosureLength(durationSec: number): number {
  return Math.round((durationSec * 128000) / 8)
}

/**
 * XML do feed gerado dos episódios publicados. É a mesma função usada pela
 * prévia da tela de distribuição — nada de arquivo estático.
 */
export function buildRssXml(list: Episode[], limit = 50): string {
  const items = publishedEpisodes(list).slice(0, limit)
  const lastBuild = items.length ? rfc822(items[0].publishedAt) : rfc822(new Date().toISOString())

  const body = items
    .map((e) => {
      const url = `${SHOW.siteUrl}/episodio/${e.slug}`
      return [
        '    <item>',
        `      <title>${escapeXml(`${e.number}. ${e.title}`)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${rfc822(e.publishedAt)}</pubDate>`,
        `      <description>${escapeXml(plainDescription(e))}</description>`,
        `      <enclosure url="${escapeXml(`${SHOW.siteUrl}/audio/${e.slug}.mp3`)}" length="${enclosureLength(
          e.durationSec
        )}" type="audio/mpeg"/>`,
        `      <itunes:duration>${e.durationSec}</itunes:duration>`,
        `      <itunes:season>${e.season}</itunes:season>`,
        `      <itunes:episode>${e.number}</itunes:episode>`,
        `      <itunes:explicit>${e.explicit ? 'true' : 'false'}</itunes:explicit>`,
        `      <itunes:subtitle>${escapeXml(e.subtitle)}</itunes:subtitle>`,
        '    </item>',
      ].join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">',
    '  <channel>',
    `    <title>${escapeXml(SHOW.name)}</title>`,
    `    <link>${escapeXml(SHOW.siteUrl)}</link>`,
    `    <language>${escapeXml(SHOW.language)}</language>`,
    `    <description>${escapeXml(SHOW.description)}</description>`,
    `    <copyright>${escapeXml(SHOW.copyright)}</copyright>`,
    `    <lastBuildDate>${lastBuild}</lastBuildDate>`,
    `    <itunes:author>${escapeXml(SHOW.author)}</itunes:author>`,
    `    <itunes:owner><itunes:email>${escapeXml(SHOW.email)}</itunes:email></itunes:owner>`,
    `    <itunes:category text="${escapeXml(SHOW.category)}"/>`,
    `    <itunes:explicit>${SHOW.explicit ? 'true' : 'false'}</itunes:explicit>`,
    body,
    '  </channel>',
    '</rss>',
  ].join('\n')
}

export type XmlTokenKind = 'tag' | 'attr' | 'text' | 'decl'

export interface XmlToken {
  kind: XmlTokenKind
  value: string
}

/** Destaque de sintaxe simples para a prévia do XML, linha a linha. */
export function highlightXmlLine(line: string): XmlToken[] {
  const tokens: XmlToken[] = []
  const re = /(<\?[^?]*\?>)|(<\/?[A-Za-z:][\w:.-]*)|([A-Za-z:][\w:.-]*="[^"]*")|(\/?>)|([^<>]+)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(line)) !== null) {
    if (match[1]) tokens.push({ kind: 'decl', value: match[1] })
    else if (match[2]) tokens.push({ kind: 'tag', value: match[2] })
    else if (match[3]) tokens.push({ kind: 'attr', value: match[3] })
    else if (match[4]) tokens.push({ kind: 'tag', value: match[4] })
    else if (match[5]) tokens.push({ kind: 'text', value: match[5] })
  }
  return tokens
}
