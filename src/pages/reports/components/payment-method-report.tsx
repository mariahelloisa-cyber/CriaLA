import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PAYMENT_METHOD_LABEL } from '@/pages/sales/components/sale-badges'
import { formatCentsToBRL } from '@/utils/currency'
import type { PaymentMethodReportItem } from '@/types/reports'

/**
 * "Valor comercial" (goal_amount, a métrica oficial — PDF seção 5) e "Valor
 * bruto" (total_amount) aparecem como colunas claramente separadas e
 * rotuladas, conforme exigido na seção 6 do prompt — nunca substituindo uma
 * pela outra.
 */
export function PaymentMethodReport({ items }: { items: PaymentMethodReportItem[] }) {
  return (
    <Table wrapperClassName="rounded-none border-0">
      <TableHeader className="bg-transparent">
        <TableRow>
          <TableHead className="uppercase tracking-wide text-caption">Forma de pagamento</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">Vendas</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">Valor comercial</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">Valor bruto (informativo)</TableHead>
          <TableHead className="uppercase tracking-wide text-caption">% do total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.paymentMethod}>
            <TableCell className="py-4 text-body font-medium text-foreground">
              {PAYMENT_METHOD_LABEL[item.paymentMethod]}
            </TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">{item.salesCount}</TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">
              {formatCentsToBRL(Math.round(item.amount * 100))}
            </TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">
              {formatCentsToBRL(Math.round(item.totalAmountRaw * 100))}
            </TableCell>
            <TableCell className="py-4 text-body text-muted-foreground">{Math.round(item.percentOfTotal)}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
