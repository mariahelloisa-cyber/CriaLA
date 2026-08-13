import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, id, label, description, disabled, ...props }, ref) => {
    const generatedId = useId()
    const checkboxId = id ?? generatedId

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'flex cursor-pointer items-start gap-2.5 select-none',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          disabled={disabled}
          className={cn(
            'mt-0.5 size-4 shrink-0 cursor-pointer rounded-sm accent-primary',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'disabled:cursor-not-allowed',
            className,
          )}
          {...props}
        />
        {(label || description) && (
          <span className="flex flex-col">
            {label && <span className="text-body-sm font-medium leading-tight">{label}</span>}
            {description && <span className="text-caption text-muted-foreground">{description}</span>}
          </span>
        )}
      </label>
    )
  },
)
Checkbox.displayName = 'Checkbox'
