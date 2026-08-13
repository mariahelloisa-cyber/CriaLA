import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateBr } from '@/utils/format-date'
import { formatCentsToBRL } from '@/utils/currency'

export interface InstallmentPreviewRow {
  installment_number: number
  amountCents: number
  due_date: string
}

/**
 * Pré-visualização das parcelas antes de salvar a venda (sale-form.tsx já
 * calculou number/valor/vencimento — este componente só exibe). Diferente de
 * installment-table.tsx (usado no detalhe da venda), aqui as parcelas ainda
 * não existem no banco — não têm id nem status, e não há ações.
 */
export function InstallmentPreview({ rows }: { rows: InstallmentPreviewRow[] }) {
  if (rows.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Parcela</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Vencimento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.installment_number}>
              <TableCell>{row.installment_number}x</TableCell>
              <TableCell className="text-muted-foreground">{formatCentsToBRL(row.amountCents)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDateBr(row.due_date)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
