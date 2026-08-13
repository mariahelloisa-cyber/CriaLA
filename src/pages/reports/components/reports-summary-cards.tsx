import { Banknote, GraduationCap, Receipt } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { formatCentsToBRL } from '@/utils/currency'

interface ReportsSummaryCardsProps {
  salesCount: number
  amount: number
  students: number
}

/** Resumo do período/filtros selecionados — computado a partir das mesmas linhas usadas pelos relatórios abaixo, sem query própria. */
export function ReportsSummaryCards({ salesCount, amount, students }: ReportsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard title="Vendas" value={String(salesCount)} icon={Receipt} />
      <StatCard title="Valor comercial" value={formatCentsToBRL(Math.round(amount * 100))} icon={Banknote} />
      <StatCard title="Alunos" value={String(students)} icon={GraduationCap} />
    </div>
  )
}
