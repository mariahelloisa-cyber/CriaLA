import { Trophy } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCentsToBRL } from '@/utils/currency'
import type { MyRankSummary } from '@/types/goals'

interface MyRankCardProps {
  data: MyRankSummary
}

/**
 * Fase 19 — "Ranking pessoal" do vendedor, retomando o gap deixado
 * explicitamente em aberto na Fase 14 (ver dashboard-page.tsx/memória do
 * projeto). Alimentado por getMySellerRank() (RPC get_my_seller_rank),
 * único jeito de um vendedor saber a própria posição sem enxergar dados de
 * outros vendedores — RLS normal não permite a comparação no client.
 */
export function MyRankCard({ data }: MyRankCardProps) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-pink-soft text-h3 font-bold text-primary">
        <Trophy className="size-6" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-body-sm font-medium text-muted-foreground">Sua posição no ranking (mês atual)</span>
        <span className="text-h4 font-semibold text-foreground">
          {data.rank}º de {data.totalSellers} {data.totalSellers === 1 ? 'vendedor' : 'vendedores'}
        </span>
        <span className="text-caption text-muted-foreground">
          {formatCentsToBRL(Math.round(data.realizedAmount * 100))} apurado · {data.realizedStudents}{' '}
          {data.realizedStudents === 1 ? 'aluno' : 'alunos'}
        </span>
      </div>
    </Card>
  )
}
