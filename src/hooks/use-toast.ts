import { useEffect, useState } from 'react'

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type Listener = (toasts: ToastItem[]) => void

let toasts: ToastItem[] = []
const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) listener(toasts)
}

/** Dispara um toast a partir de qualquer lugar da aplicação (fora de JSX). */
export function toast(input: Omit<ToastItem, 'id'>) {
  const id = crypto.randomUUID()
  toasts = [...toasts, { duration: 5000, variant: 'default', ...input, id }]
  emit()
  return id
}

export function dismissToast(id: string) {
  toasts = toasts.filter((item) => item.id !== id)
  emit()
}

/** Usado internamente pelo <Toaster />. Não chame diretamente em telas. */
export function useToasts() {
  const [state, setState] = useState(toasts)

  useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])

  return state
}
