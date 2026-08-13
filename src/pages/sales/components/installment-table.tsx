import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { effectiveInstallmentStatus } from '@/services/sales.service'
import { formatCentsToBRL } from '@/utils/currency'
import { formatDateBr } from '@/utils/format-date'
import type { SaleInstallment } from '@/types/sales'
import { InstallmentStatusBadge } from './sale-badges'

interface InstallmentTableProps {
  installments: SaleInstallment[]
  isManager: boolean
  onMarkPaid: (installment: SaleInstallment) => void
  onCancel: (installment: SaleInstallment) => void
}

/**
 * Transições de status controladas (não é edição livre de parcela — ver
 * relatório final, seção AB): só "Marcar como pago" e "Cancelar parcela",
 * disponíveis apenas para parcelas pendentes/em atraso, e só para gerente
 * (RLS sale_installments_update_manager não tem cláusula de vendedor).
 */
export function InstallmentTable({ installments, isManager, onMarkPaid, onCancel }: InstallmentTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Parcela</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pagamento</TableHead>
            {isManager && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.map((installment) => {
            const canTransition = installment.status === 'pending' || installment.status === 'overdue'
            return (
              <TableRow key={installment.id}>
                <TableCell>{installment.installment_number}x</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatCentsToBRL(Math.round(installment.amount * 100))}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDateBr(installment.due_date)}</TableCell>
                <TableCell>
                  <InstallmentStatusBadge status={effectiveInstallmentStatus(installment)} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {installment.paid_at
                    ? new Date(installment.paid_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                    : '—'}
                </TableCell>
                {isManager && (
                  <TableCell className="text-right">
                    {canTransition ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <IconButton label={`Ações da parcela ${installment.installment_number}`} variant="ghost">
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                          </IconButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => onMarkPaid(installment)}>
                            Marcar como pago
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => onCancel(installment)}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            Cancelar parcela
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-caption text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
