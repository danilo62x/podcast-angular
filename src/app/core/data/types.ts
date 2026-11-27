// ===== Onda — Podcast & Áudio — domínio =====

export type EpisodeStatus = 'rascunho' | 'agendado' | 'publicado'

export type AdSlot = 'pre-roll' | 'mid-roll' | 'pos-roll'

export type BlockType = 'paragraph' | 'heading' | 'list' | 'quote' | 'link'

/** Bloco da descrição do episódio (notas do programa). */
export interface Block {
  type: BlockType
  /** paragraph / heading / quote */
  text?: string
  /** list */
  items?: string[]
  /** link */
  href?: string
  label?: string
}

/** Marcador de capítulo — `startSec` sempre dentro de `durationSec`. */
export interface Chapter {
  id: number
  title: string
  startSec: number
}

/** Linha da transcrição sincronizada. */
export interface TranscriptLine {
  id: number
  startSec: number
  endSec: number
  speaker: string
  text: string
}

export interface Guest {
  id: number
  slug: string
  name: string
  /** Seed determinístico do avatar (conjunto `people`). */
  avatar: string
  role: string
  bio: string
  links: { label: string; href: string }[]
  episodeIds: number[]
}

export interface Episode {
  id: number
  slug: string
  number: number
  season: number
  title: string
  subtitle: string
  /** Seed determinístico da capa (conjunto `work` / `city`). */
  coverSeed: string
  durationSec: number
  publishedAt: string
  /** Preenchido apenas quando o status é `agendado`. */
  scheduledAt: string | null
  status: EpisodeStatus
  blocks: Block[]
  chapters: Chapter[]
  transcript: TranscriptLine[]
  guestIds: number[]
  tags: string[]
  explicit: boolean
  downloads: number
  uniqueListeners: number
  /** 0..1 */
  completionRate: number
  /** 20 pontos, 0..1, decrescentes. */
  retention: number[]
}

export interface Sponsor {
  id: number
  name: string
  logoSeed: string
  slot: AdSlot
  episodeIds: number[]
  impressions: number
  /** Custo por mil impressões, em reais. */
  cpm: number
}

export type PlatformName = 'Spotify' | 'Apple' | 'Google' | 'YouTube' | 'Site'

export interface PlatformStat {
  platform: PlatformName
  downloads: number
  /** 0..1 */
  share: number
}

export interface CountryStat {
  country: string
  downloads: number
}

/** Apresentador fixo do programa. */
export interface Host {
  id: number
  name: string
  role: string
  avatar: string
  bio: string
}

/** Temporada do programa. */
export interface Season {
  number: number
  title: string
  description: string
  year: number
}

/** Estado da distribuição em uma plataforma. */
export type FeedState = 'ativo' | 'pendente' | 'erro'

export interface Distribution {
  platform: PlatformName
  state: FeedState
  url: string
  followers: number
  lastSyncAt: string
}

// ---- Derivados usados nas telas ----------------------------------------

export interface SeriesPoint {
  label: string
  value: number
}

/** Ponto de maior queda da curva de retenção. */
export interface RetentionDrop {
  index: number
  /** Fração do episódio onde a queda acontece (0..1). */
  at: number
  /** Segundo correspondente dentro do episódio. */
  atSec: number
  /** Queda em pontos percentuais (0..1). */
  delta: number
}
