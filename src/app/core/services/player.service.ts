import { Injectable, effect, signal } from '@angular/core';

export const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export type Speed = (typeof SPEEDS)[number];

const STORAGE_KEY = 'pc-player';

interface Persisted {
  episodeId: number | null;
  positionSec: number;
  durationSec: number;
  playing: boolean;
  speed: Speed;
  volume: number;
  muted: boolean;
}

function load(): Persisted {
  const fallback: Persisted = {
    episodeId: null,
    positionSec: 0,
    durationSec: 0,
    playing: false,
    speed: 1,
    volume: 0.8,
    muted: false,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: Partial<Persisted> } & Partial<Persisted>;
      const s = parsed.state ?? parsed;
      return { ...fallback, ...s };
    }
  } catch {}
  return fallback;
}

/**
 * Estado do player global. Não existe arquivo de áudio: a posição avança por um
 * temporizador de 1s (na `PlayerBarComponent`), somando `speed` segundos a cada
 * disparo. Tudo é persistido em `pc-player` para o player sobreviver ao F5 e à
 * troca de rota.
 */
@Injectable({ providedIn: 'root' })
export class PlayerService {
  private initial = load();

  /** Episódio na barra do rodapé; `null` esconde o player. */
  readonly episodeId = signal<number | null>(this.initial.episodeId);
  /** Posição em segundos — avança por temporizador, não existe áudio real. */
  readonly positionSec = signal(this.initial.positionSec);
  /** Duração do episódio carregado, para o temporizador saber onde parar. */
  readonly durationSec = signal(this.initial.durationSec);
  readonly playing = signal(this.initial.playing);
  readonly speed = signal<Speed>(this.initial.speed);
  /** 0..1 */
  readonly volume = signal(this.initial.volume);
  readonly muted = signal(this.initial.muted);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            episodeId: this.episodeId(),
            positionSec: this.positionSec(),
            durationSec: this.durationSec(),
            playing: this.playing(),
            speed: this.speed(),
            volume: this.volume(),
            muted: this.muted(),
          })
        );
      } catch {}
    });
  }

  load(episodeId: number, durationSec: number, autoplay = true) {
    const sameEpisode = this.episodeId() === episodeId;
    this.episodeId.set(episodeId);
    this.durationSec.set(durationSec);
    this.positionSec.set(sameEpisode ? Math.min(this.positionSec(), durationSec) : 0);
    this.playing.set(autoplay);
  }

  play() {
    if (this.episodeId() === null) return;
    this.playing.set(true);
  }

  pause() {
    this.playing.set(false);
  }

  toggle() {
    if (this.episodeId() === null) return;
    this.playing.update((v) => !v);
  }

  /**
   * Chamado uma vez por segundo enquanto tocando; avança `speed` segundos.
   * Devolve `false` quando nada mudou — a barra usa isso para não entrar na
   * zona do Angular à toa.
   */
  tick(): boolean {
    const durationSec = this.durationSec();
    if (!this.playing() || !durationSec) return false;
    const next = this.positionSec() + this.speed();
    if (next >= durationSec) {
      this.positionSec.set(durationSec);
      this.playing.set(false);
      return true;
    }
    this.positionSec.set(next);
    return true;
  }

  seek(sec: number) {
    this.positionSec.set(Math.max(0, Math.min(Math.round(sec), this.durationSec())));
  }

  /** Pular 15s para frente ou para trás. */
  skip(deltaSec: number) {
    this.seek(this.positionSec() + deltaSec);
  }

  setSpeed(speed: Speed) {
    this.speed.set(speed);
  }

  cycleSpeed() {
    const i = SPEEDS.indexOf(this.speed());
    this.speed.set(SPEEDS[(i + 1) % SPEEDS.length]);
  }

  setVolume(volume: number) {
    this.volume.set(Math.max(0, Math.min(1, volume)));
    this.muted.set(volume === 0);
  }

  toggleMute() {
    this.muted.update((v) => !v);
  }

  close() {
    this.episodeId.set(null);
    this.playing.set(false);
    this.positionSec.set(0);
    this.durationSec.set(0);
  }
}
