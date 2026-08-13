import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

const LOGO_FULL_SRC = '/brand/soucriala-logo.svg'
const LOGO_MARK_SRC = '/brand/soucriala-mark.svg'

interface BrandProps {
  collapsed?: boolean
  className?: string
  /** Destino do link. Padrão: dashboard (uso na Sidebar autenticada). */
  to?: string
  /** Fundo rosa (Sidebar) em vez do fundo claro padrão (Login) — troca as cores do placeholder para permanecer legível. */
  onPrimary?: boolean
}

/**
 * Área de marca da Sidebar/Login. Tenta carregar o asset oficial em
 * public/brand/ (ver README lá); se ainda não existir, cai automaticamente
 * para um placeholder neutro nas cores da marca — nunca uma logo inventada.
 * Basta adicionar os arquivos oficiais para a logo real passar a aparecer,
 * sem alterar este componente.
 */
export function Brand({ collapsed, className, to = ROUTES.dashboard, onPrimary }: BrandProps) {
  const [fullLogoFailed, setFullLogoFailed] = useState(false)
  const [markFailed, setMarkFailed] = useState(false)

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-1.5 py-1 transition-colors',
        onPrimary ? 'hover:bg-primary-foreground/10' : 'hover:bg-muted',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      {collapsed ? (
        markFailed ? (
          <PlaceholderMark onPrimary={onPrimary} />
        ) : (
          <img
            src={LOGO_MARK_SRC}
            alt="SouCriaLA"
            className="size-8 shrink-0 object-contain"
            onError={() => setMarkFailed(true)}
          />
        )
      ) : fullLogoFailed ? (
        <>
          <PlaceholderMark onPrimary={onPrimary} />
          <span className="flex flex-col leading-none">
            <span className={cn('text-body-sm font-semibold', onPrimary ? 'text-primary-foreground' : 'text-foreground')}>
              SouCriaLA
            </span>
            <span className={cn('text-caption', onPrimary ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
              Gestão
            </span>
          </span>
        </>
      ) : (
        <img
          src={LOGO_FULL_SRC}
          alt="SouCriaLA"
          className="h-8 w-auto shrink-0 object-contain"
          onError={() => setFullLogoFailed(true)}
        />
      )}
    </Link>
  )
}

function PlaceholderMark({ onPrimary }: { onPrimary?: boolean }) {
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-md text-body-sm font-bold',
        onPrimary ? 'bg-brand-black text-white' : 'bg-brand-pink text-white',
      )}
    >
      SC
    </span>
  )
}
