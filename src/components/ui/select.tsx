import { forwardRef, useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from './label'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  helperText?: string
  error?: string
  containerClassName?: string
}

/**
 * Select nativo estilizado (em vez de um listbox customizado): garante
 * acessibilidade e comportamento de teclado corretos "de graça" no desktop
 * e no mobile, sem depender de uma implementação própria de combobox.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, containerClassName, id, label, helperText, error, required, disabled, children, ...props },
    ref,
  ) => {
    const generatedId = useId()
    const selectId = id ?? generatedId
    const describedBy = error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <Label htmlFor={selectId} required={required}>
            {label}
          </Label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            className={cn(
              'h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 pr-9 text-body-sm text-foreground',
              'transition-colors focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive focus-visible:border-destructive focus-visible:outline-destructive',
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        {error ? (
          <p id={`${selectId}-error`} className="text-caption text-destructive">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${selectId}-helper`} className="text-caption text-muted-foreground">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  },
)
Select.displayName = 'Select'
