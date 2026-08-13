import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import { monthLabel } from '@/utils/period'
import type { Period } from '@/utils/period'

interface PeriodSelectorProps {
  period: Period
  onPrevious: () => void
  onNext: () => void
  onCurrent: () => void
  isCurrent: boolean
}

export function PeriodSelector({ period, onPrevious, onNext, onCurrent, isCurrent }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <IconButton label="Mês anterior" variant="outline" onClick={onPrevious}>
        <ChevronLeft className="size-4" aria-hidden="true" />
      </IconButton>
      <span className="min-w-36 text-center text-body-sm font-medium text-foreground">
        {monthLabel(period.month)} de {period.year}
      </span>
      <IconButton label="Próximo mês" variant="outline" onClick={onNext}>
        <ChevronRight className="size-4" aria-hidden="true" />
      </IconButton>
      {!isCurrent && (
        <Button variant="ghost" size="sm" onClick={onCurrent}>
          Mês atual
        </Button>
      )}
    </div>
  )
}
