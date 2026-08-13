import { Banknote, GraduationCap, TrendingUp, Users2 } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import type { ManagerAcademicSnapshot } from '@/types/dashboard'
import type { SellerGoalSummary } from '@/types/goals'
import { formatCentsToBRL } from '@/utils/currency'

interface OverviewStatsCardsProps {
  summaries: SellerGoalSummary[]
  academic: Pick<ManagerAcademicSnapshot, 'totalEnrollments' | 'activeEnrollments' | 'sellerCount'>
}

/**
 * Topo da Visão Geral do gerente: 4 cards numa única linha — layout, cores e
 * estrutura seguem exatamente o `StatCard` do código de referência do
 * usuário (rótulo+ícone, valor, legenda), adaptado para os componentes e
 * dados reais deste projeto. Gradiente do card em destaque vai de
 * `--primary` a `--secondary` (tokens reais da marca), não das cores
 * arbitrárias do protótipo de referência.
 *
 * As legendas dos 3 cards simples são texto real (não os números de exemplo
 * do protótipo — "No período atual"/"3 unidades"/"1 já formados" não têm
 * query por trás e o projeto nunca mostra dado mockado), mas mantêm a MESMA
 * altura/estrutura de 3 linhas do card em destaque para os 4 cards ficarem
 * visualmente alinhados.
 *
 * `GoalTeamSummary` e `ManagerAcademicCards` não foram alterados — o
 * primeiro também é usado em goals-page.tsx e
 * reports/goals-vs-realized-section.tsx; o segundo foi descontinuado só
 * aqui no Dashboard.
 */
export function OverviewStatsCards({ summaries, academic }: OverviewStatsCardsProps) {
  const totalTarget = summaries.reduce((sum, item) => sum + (item.goal?.financial_target ?? 0), 0)
  const totalRealized = summaries.reduce((sum, item) => sum + item.realizedAmount, 0)
  const hasGoals = summaries.some((item) => item.goal !== null)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Valor total vendido"
        value={formatCentsToBRL(Math.round(totalRealized * 100))}
        detail={hasGoals ? `Meta da empresa: ${formatCentsToBRL(Math.round(totalTarget * 100))}` : 'Sem metas cadastradas'}
        icon={Banknote}
        highlight
      />
      <StatCard
        title="Total de matrículas"
        value={String(academic.totalEnrollments)}
        detail="Desde o início"
        icon={GraduationCap}
      />
      <StatCard title="Vendedores" value={String(academic.sellerCount)} detail="Total cadastrados" icon={Users2} />
      <StatCard
        title="Alunos em formação"
        value={String(academic.activeEnrollments)}
        detail="Matrículas ativas"
        icon={TrendingUp}
      />
    </div>
  )
}
