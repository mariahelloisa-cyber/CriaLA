import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { isValidEmail } from '@/utils/masks'
import type { SellerListItem } from '@/types/sellers'

interface SellerEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  seller: SellerListItem | null
  submitting: boolean
  onSubmit: (values: { full_name: string; email: string }) => void | Promise<void>
}

const EMPTY_VALUES = { full_name: '', email: '' }
type FormErrors = Partial<Record<keyof typeof EMPTY_VALUES, string>>

/**
 * Fase 23 — nome e e-mail editáveis juntos, salvos numa única chamada à Edge
 * Function `update-seller` (sellers.service.ts:updateSeller). Até a Fase 22,
 * o e-mail era somente leitura aqui porque não existia infraestrutura de
 * Auth Admin API no projeto (ver relatório final da Fase 21/22) — essa
 * limitação não existe mais.
 */
export function SellerEditDialog({ open, onOpenChange, seller, submitting, onSubmit }: SellerEditDialogProps) {
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open && seller) {
      setValues({ full_name: seller.full_name, email: seller.email ?? '' })
      setErrors({})
    }
  }, [open, seller])

  function set<K extends keyof typeof EMPTY_VALUES>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {}
    if (!values.full_name.trim()) nextErrors.full_name = 'Nome completo é obrigatório.'
    if (!values.email.trim()) {
      nextErrors.email = 'E-mail é obrigatório.'
    } else if (!isValidEmail(values.email.trim())) {
      nextErrors.email = 'E-mail inválido.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    if (!validate()) return
    await onSubmit({ full_name: values.full_name.trim(), email: values.email.trim().toLowerCase() })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar vendedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            <Input
              label="Nome completo"
              required
              value={values.full_name}
              onChange={(event) => set('full_name', event.target.value)}
              error={errors.full_name}
              disabled={submitting}
            />
            <Input
              label="E-mail"
              type="email"
              required
              autoComplete="email"
              value={values.email}
              onChange={(event) => set('email', event.target.value)}
              error={errors.email}
              disabled={submitting}
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {submitting ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
