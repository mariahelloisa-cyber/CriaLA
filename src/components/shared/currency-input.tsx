import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { digitsToCents, formatCentsToBRL } from '@/utils/currency'

interface CurrencyInputProps {
  label?: string
  valueCents: number
  onChange: (cents: number) => void
  error?: string
  required?: boolean
  disabled?: boolean
  id?: string
}

/**
 * Não existe um input de moeda no Design System ainda. Segue o padrão de UX
 * mais comum para valores em real: o usuário digita apenas dígitos e eles são
 * interpretados como centavos (evita o usuário ter que digitar vírgula/ponto
 * manualmente e erros de formatação). Promovido de pages/sales/components
 * para cá na Fase 12, quando o módulo de Metas passou a precisar do mesmo
 * padrão (critério já documentado: promover só quando um segundo módulo
 * precisar, mesma regra usada para StudentPicker/EnrollmentPicker).
 */
export function CurrencyInput({ label, valueCents, onChange, error, required, disabled, id }: CurrencyInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        value={formatCentsToBRL(valueCents)}
        onChange={(event) => onChange(digitsToCents(event.target.value))}
        className={cn(
          'h-9 w-full rounded-md border border-input bg-transparent px-3 text-body-sm text-foreground',
          'transition-colors focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:border-destructive focus-visible:outline-destructive',
        )}
      />
      {error && <p className="text-caption text-destructive">{error}</p>}
    </div>
  )
}
