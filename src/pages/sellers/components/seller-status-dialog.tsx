import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { SellerListItem } from '@/types/sellers'

interface SellerStatusDialogProps {
  seller: SellerListItem | null
  onOpenChange: (open: boolean) => void
  submitting: boolean
  onConfirm: () => void | Promise<void>
}

/**
 * Confirmação antes de ativar/desativar (Fase 21) — mensagem explícita de
 * que nada é apagado. Reaproveita profiles.is_active + o comportamento já
 * existente do AuthContext (Fase 04): um profile com is_active=false força
 * signOut no próximo carregamento de sessão. Nenhuma lógica nova de
 * autenticação foi criada.
 */
export function SellerStatusDialog({ seller, onOpenChange, submitting, onConfirm }: SellerStatusDialogProps) {
  const willActivate = seller ? !seller.is_active : false

  return (
    <Dialog open={seller !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{willActivate ? 'Ativar vendedor' : 'Desativar vendedor'}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-body-sm text-muted-foreground">
            {willActivate ? (
              <>
                Tem certeza que deseja ativar <strong className="text-foreground">{seller?.full_name}</strong>? Ele
                voltará a conseguir acessar o sistema.
              </>
            ) : (
              <>
                Tem certeza que deseja desativar <strong className="text-foreground">{seller?.full_name}</strong>?
                Desativar o vendedor impede o acesso ao sistema, mas mantém seus alunos, matrículas, vendas e
                histórico.
              </>
            )}
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant={willActivate ? 'primary' : 'destructive'} onClick={onConfirm} loading={submitting}>
            {willActivate ? 'Ativar' : 'Desativar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
