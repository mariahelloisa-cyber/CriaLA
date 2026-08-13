import { forwardRef, useId } from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'
import { Label } from './label'

export interface SwitchProps extends SwitchPrimitive.SwitchProps {
  label?: string
  description?: string
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, id, label, description, ...props }, ref) => {
    const generatedId = useId()
    const switchId = id ?? generatedId

    const control = (
      <SwitchPrimitive.Root
        ref={ref}
        id={switchId}
        className={cn(
          'inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-muted transition-colors',
          'data-[state=checked]:bg-primary',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'block size-4 translate-x-0.5 rounded-full bg-background shadow-sm transition-transform',
            'data-[state=checked]:translate-x-[18px]',
          )}
        />
      </SwitchPrimitive.Root>
    )

    if (!label && !description) return control

    return (
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          {label && (
            <Label htmlFor={switchId} className="font-medium">
              {label}
            </Label>
          )}
          {description && <span className="text-caption text-muted-foreground">{description}</span>}
        </div>
        {control}
      </div>
    )
  },
)
Switch.displayName = 'Switch'
