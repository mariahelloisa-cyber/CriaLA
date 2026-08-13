import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCentsToBRL } from '@/utils/currency'
import type { SellerReportItem } from '@/types/reports'
import { Users } from 'lucide-react'

/**
 * "% da meta" só aparece quando o intervalo selecionado é um mês cheio (ver
 * use-reports-data.ts:fullMonth) — fora disso, financialPercent é null e a
 * célula mostra "—" com uma explicação, em vez de inventar um número.
 */
export function SellersReportTable({ items, isFullMonth }: { items: SellerReportItem[]; isFullMonth: boolean }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Users className="size-6" aria-hidden="true" />}
        title="Nenhum vendedor no período"
        description="Ajuste os filtros para ver resultados."
      />
    )
  }

  const sorted = [...items].sort((a, b) => b.amount - a.amount)

  return (
    <Table wrapperClassName="rounded-none border-0">
      <TableHeader className="bg-transparent">
        <TableRow>
          <TableHead className="uppercase tracking-wide text-caption">Vendedor</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">Vendas</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">Valor</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">Alunos</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">% da meta</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((item) => (
          <TableRow key={item.seller.id}>
            <TableCell className="py-4 text-body">
              <div className="flex items-center gap-3">
                <Avatar name={item.seller.full_name} size="sm" />
                <span className="font-medium text-foreground">{item.seller.full_name}</span>
              </div>
            </TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">{item.salesCount}</TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">
              {formatCentsToBRL(Math.round(item.amount * 100))}
            </TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">{item.students}</TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">
              {item.financialPercent === null
                ? isFullMonth
                  ? 'Sem meta cadastrada'
                  : 'Não aplicável (selecione um mês inteiro)'
                : `${Math.round(item.financialPercent)}%`}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
