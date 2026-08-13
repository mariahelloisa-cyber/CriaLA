import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge não conhece a escala tipográfica customizada definida em
 * src/styles/globals.css (--text-display, --text-h1...--text-h4, --text-body,
 * --text-body-sm, --text-caption, --text-label, --text-overline). Sem esta
 * extensão, ele classifica "text-body", "text-h4" etc. no mesmo grupo de
 * conflito de "text-primary-foreground"/"text-muted-foreground" (cor do
 * texto) só por compartilharem o prefixo "text-", e descarta uma das duas
 * classes ao mesclar (ex.: Button perdia text-primary-foreground para
 * text-body, Badge perdia text-caption para text-primary). Registrar os
 * tokens aqui resolve isso para todos os componentes de uma vez.
 */
const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: ['display', 'h1', 'h2', 'h3', 'h4', 'body', 'body-sm', 'caption', 'label', 'overline'],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}
