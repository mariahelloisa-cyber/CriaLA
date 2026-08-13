import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PaymentMethod } from '@/types/sales'
import { PAYMENT_METHOD_LABEL } from './sale-badges'

const TABS: { value: PaymentMethod | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'cash', label: PAYMENT_METHOD_LABEL.cash },
  { value: 'credit_card', label: PAYMENT_METHOD_LABEL.credit_card },
  { value: 'bank_slip', label: PAYMENT_METHOD_LABEL.bank_slip },
]

interface PaymentMethodTabsProps {
  value: PaymentMethod | null
  onChange: (value: PaymentMethod | null) => void
  hasActiveFilters: boolean
  onClear: () => void
}

/** Pílulas de forma de pagamento (referência visual do usuário) — "Todas" com preenchimento sólido quando ativa, as demais com contorno. */
export function PaymentMethodTabs({ value, onChange, hasActiveFilters, onClear }: PaymentMethodTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value === 'all' ? null : tab.value)}
          className={cn(
            'rounded-full px-4 py-1.5 text-body-sm font-medium transition-colors',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            (value ?? 'all') === tab.value
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-foreground hover:bg-muted',
          )}
        >
          {tab.label}
        </button>
      ))}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="ml-1 flex items-center gap-1 rounded-md px-2 py-1 text-caption text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X className="size-3.5" aria-hidden="true" />
          Limpar
        </button>
      )}
    </div>
  )
}
