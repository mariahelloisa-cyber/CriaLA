import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { buttonVariants } from './button'

interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    Pick<VariantProps<typeof buttonVariants>, 'variant'> {
  /** Obrigatório: descreve a ação para leitores de tela, já que não há texto visível. */
  label: string
}

/**
 * Botão apenas com ícone. Sempre exige `label` (vira aria-label) — tooltip
 * não deve ser a única forma de identificar a ação (ver Header/Tooltip).
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', label, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={cn(buttonVariants({ variant, size: 'icon' }), className)}
        {...props}
      >
        {children}
      </button>
    )
  },
)
IconButton.displayName = 'IconButton'
