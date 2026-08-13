import type { HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const alertVariants = cva('flex gap-3 rounded-md border p-4', {
  variants: {
    variant: {
      default: 'border-border bg-card text-card-foreground',
      success: 'border-success/25 bg-success/5 text-foreground',
      warning: 'border-warning/25 bg-warning/5 text-foreground',
      danger: 'border-destructive/25 bg-destructive/5 text-foreground',
      info: 'border-info/25 bg-info/5 text-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
})

const alertIcon: Record<NonNullable<VariantProps<typeof alertVariants>['variant']>, ReactNode> = {
  default: null,
  success: <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />,
  warning: <TriangleAlert className="size-5 shrink-0 text-warning" aria-hidden="true" />,
  danger: <XCircle className="size-5 shrink-0 text-destructive" aria-hidden="true" />,
  info: <Info className="size-5 shrink-0 text-info" aria-hidden="true" />,
}

interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant = 'default', children, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {alertIcon[variant ?? 'default']}
      <div className="flex-1 space-y-1">{children}</div>
    </div>
  )
}

export function AlertTitle({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-body-sm font-semibold', className)} {...props} />
}

export function AlertDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-body-sm text-muted-foreground', className)} {...props} />
}
