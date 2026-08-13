import type { ReactNode } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export const ToastProvider = ToastPrimitive.Provider

export function ToastViewport({ className, ...props }: ToastPrimitive.ToastViewportProps) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        'fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4 outline-none sm:bottom-4 sm:right-4',
        className,
      )}
      {...props}
    />
  )
}

const toastVariants = cva(
  'pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-md border p-4 shadow-md',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-card-foreground',
        success: 'border-success/20 bg-card text-card-foreground',
        error: 'border-destructive/20 bg-card text-card-foreground',
        warning: 'border-warning/20 bg-card text-card-foreground',
        info: 'border-info/20 bg-card text-card-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

const toastIcon: Record<NonNullable<VariantProps<typeof toastVariants>['variant']>, ReactNode> = {
  default: null,
  success: <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />,
  error: <XCircle className="size-5 shrink-0 text-destructive" aria-hidden="true" />,
  warning: <TriangleAlert className="size-5 shrink-0 text-warning" aria-hidden="true" />,
  info: <Info className="size-5 shrink-0 text-info" aria-hidden="true" />,
}

export interface ToastRootProps extends ToastPrimitive.ToastProps, VariantProps<typeof toastVariants> {}

export function ToastRoot({ className, variant = 'default', children, ...props }: ToastRootProps) {
  return (
    <ToastPrimitive.Root
      className={cn(
        toastVariants({ variant }),
        'data-[state=open]:animate-drawer-in-right data-[swipe=move]:transition-none',
        'data-[state=closed]:animate-drawer-out-right',
        className,
      )}
      {...props}
    >
      {toastIcon[variant ?? 'default']}
      <div className="flex-1">{children}</div>
      <ToastPrimitive.Close
        className="shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Fechar notificação"
      >
        <X className="size-4" aria-hidden="true" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  )
}

export function ToastTitle({ className, ...props }: ToastPrimitive.ToastTitleProps) {
  return <ToastPrimitive.Title className={cn('text-body-sm font-semibold', className)} {...props} />
}

export function ToastDescription({ className, ...props }: ToastPrimitive.ToastDescriptionProps) {
  return <ToastPrimitive.Description className={cn('text-body-sm text-muted-foreground', className)} {...props} />
}

export type { VariantProps }
