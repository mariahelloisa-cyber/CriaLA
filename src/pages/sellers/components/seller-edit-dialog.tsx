import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import type { SellerListItem } from '@/types/sellers'

interface SellerEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  seller: SellerListItem | null
  submitting: boolean
  onSubmit: (fullName: string) => void | Promise<void>
}

/**
 * Fase 21 — só `full_name` é editável aqui. E-mail e senha não são campos de
 * `public.profiles`: alterá-los exige a Auth Admin API do Supabase
 * (`service_role`/Edge Function), infraestrutura que não existe neste
 * projeto (ver relatório final, seção P/Q). Em vez de esconder isso, o
 * diálogo mostra o e-mail como somente leitura com a explicação, para não
 * dar a entender que a edição foi feita quando não foi.
 */
export function SellerEditDialog({ open, onOpenChange, seller, submitting, onSubmit }: SellerEditDialogProps) {
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    if (open && seller) {
      setFullName(seller.full_name)
    }
  }, [open, seller])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!fullName.trim()) return
    await onSubmit(fullName.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar vendedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            <Input
              label="Nome completo"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
            <div className="flex flex-col gap-1">
              <Input label="E-mail" value={seller?.email ?? ''} disabled readOnly />
              <Text variant="caption" className="text-muted-foreground">
                Alterar e-mail ou senha exige um recurso de administração do Supabase (Edge Function) que ainda não
                existe neste projeto — não pode ser feito com segurança por aqui.
              </Text>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {submitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
