import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from './label'

export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  helperText?: string
  error?: string
  containerClassName?: string
}

/**
 * Placeholder de DatePicker: usa o input nativo type="date" (acessível e
 * funcional por padrão) com a mesma linguagem visual dos demais campos.
 * Um calendário customizado poderá substituir a implementação interna sem
 * alterar a API do componente.
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    { className, containerClassName, id, label, helperText, error, required, disabled, ...props },
    ref,
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="date"
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            className={cn(
              'h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-body-sm text-foreground',
              'transition-colors focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive focus-visible:border-destructive focus-visible:outline-destructive',
              className,
            )}
            {...props}
          />
          <Calendar
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-caption text-destructive">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-caption text-muted-foreground">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  },
)
DatePicker.displayName = 'DatePicker'
