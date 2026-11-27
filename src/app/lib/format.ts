const LOCALE_MAP: Record<string, { locale: string; currency: string }> = {
  'pt-BR': { locale: 'pt-BR', currency: 'BRL' },
  en: { locale: 'en-US', currency: 'USD' },
  es: { locale: 'es-ES', currency: 'EUR' },
}

/** Format a currency value respecting the active i18n language (BRL by default). */
export function formatCurrency(value: number, lang = 'pt-BR'): string {
  const cfg = LOCALE_MAP[lang] ?? LOCALE_MAP['pt-BR']
  return new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency: cfg.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Compact number format, e.g. 2840 -> 2.8 mil */
export function formatCompact(value: number, lang = 'pt-BR'): string {
  const cfg = LOCALE_MAP[lang] ?? LOCALE_MAP['pt-BR']
  return new Intl.NumberFormat(cfg.locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

/** Locale-aware date + time, e.g. "30/05/2026 14:32". */
export function formatDateTime(iso: string, lang = 'pt-BR'): string {
  const cfg = LOCALE_MAP[lang] ?? LOCALE_MAP['pt-BR']
  return new Intl.DateTimeFormat(cfg.locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
}

/** Locale-aware date only. */
export function formatDate(iso: string, lang = 'pt-BR'): string {
  const cfg = LOCALE_MAP[lang] ?? LOCALE_MAP['pt-BR']
  return new Intl.DateTimeFormat(cfg.locale, { dateStyle: 'medium' }).format(new Date(iso))
}

/** HH:mm only. */
export function formatTime(iso: string, lang = 'pt-BR'): string {
  const cfg = LOCALE_MAP[lang] ?? LOCALE_MAP['pt-BR']
  return new Intl.DateTimeFormat(cfg.locale, { timeStyle: 'short' }).format(new Date(iso))
}

/** Plain integer formatting (e.g. unit counts). */
export function formatNumber(value: number, lang = 'pt-BR'): string {
  const cfg = LOCALE_MAP[lang] ?? LOCALE_MAP['pt-BR']
  return new Intl.NumberFormat(cfg.locale).format(value)
}

/** Human duration from minutes, e.g. 90 -> "1h30", 45 -> "45min". */
export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

/**
 * Duração longa a partir de segundos — `1h 04min` na lista de episódios.
 * Sempre derivada de `durationSec`; nunca gravada como texto.
 */
export function formatDurationLong(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h === 0) return `${m}min`
  return `${h}h ${String(m).padStart(2, '0')}min`
}

/**
 * Relógio a partir de segundos — `01:04:12` no player (ou `04:12` abaixo de 1h).
 */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${String(h).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`
}

/** Percentual com uma casa, e.g. 0.7312 -> "73,1%". */
export function formatPercent(ratio: number, lang = 'pt-BR'): string {
  const cfg = LOCALE_MAP[lang] ?? LOCALE_MAP['pt-BR']
  return new Intl.NumberFormat(cfg.locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(ratio)
}
