import { Signal, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Signal com o idioma ativo, reemitido a cada troca. Usado por tudo que formata
 * número, moeda e data — a formatação segue o idioma escolhido.
 * Chamar de dentro de um contexto de injeção (campo de classe / construtor).
 */
export function activeLang(): Signal<string> {
  const transloco = inject(TranslocoService);
  const lang = signal(transloco.getActiveLang());
  transloco.langChanges$.pipe(takeUntilDestroyed()).subscribe((l) => lang.set(l));
  return lang;
}
