import { useCallback, useState } from 'react'
import { currentPeriod, shiftPeriod } from '@/utils/period'
import type { Period } from '@/utils/period'

export function useGoalPeriod() {
  const [period, setPeriod] = useState<Period>(currentPeriod())

  const goToPreviousMonth = useCallback(() => {
    setPeriod((prev) => shiftPeriod(prev, -1))
  }, [])

  const goToNextMonth = useCallback(() => {
    setPeriod((prev) => shiftPeriod(prev, 1))
  }, [])

  const goToCurrentMonth = useCallback(() => {
    setPeriod(currentPeriod())
  }, [])

  return { period, setPeriod, goToPreviousMonth, goToNextMonth, goToCurrentMonth }
}
