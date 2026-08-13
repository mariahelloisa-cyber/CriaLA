import { dismissToast, useToasts } from '@/hooks/use-toast'
import { ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from './toast'

export function Toaster() {
  const toasts = useToasts()

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(({ id, title, description, variant, duration }) => (
        <ToastRoot
          key={id}
          variant={variant}
          duration={duration}
          onOpenChange={(open) => {
            if (!open) dismissToast(id)
          }}
        >
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && <ToastDescription>{description}</ToastDescription>}
        </ToastRoot>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
