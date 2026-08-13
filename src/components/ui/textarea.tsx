import { forwardRef, useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Label } from './label'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  error?: string
  containerClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, containerClassName, id, label, helperText, error, required, disabled, rows = 4, ...props },
    ref,
  ) => {
    const generatedId = useId()
    const textareaId = id ?? generatedId
    const describedBy = error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <Label htmlFor={textareaId} required={required}>
            {label}
          </Label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-body-sm text-foreground',
            'placeholder:text-muted-foreground',
            'transition-colors focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:border-destructive focus-visible:outline-destructive',
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={`${textareaId}-error`} className="text-caption text-destructive">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${textareaId}-helper`} className="text-caption text-muted-foreground">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
