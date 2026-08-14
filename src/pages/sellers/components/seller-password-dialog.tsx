import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { SellerListItem } from '@/types/sellers'

interface SellerPasswordDialogProps {
  seller: SellerListItem | null
  onOpenChange: (open: boolean) => void
  submitting: boolean
  onSubmit: (password: string) => void | Promise<void>
}

const EMPTY_VALUES = { password: '', confirmPassword: '' }
type FormErrors = Partial<Record<keyof typeof EMPTY_VALUES, string>>

/**
 * Fase 23 — define uma nova senha para o vendedor via Edge Function
 * reset-seller-password (sellers.service.ts:resetSellerPassword). Mesmas
 * regras de senha do cadastro (NewSellerDialog): mínimo 6 caracteres
 * (supabase/config.toml:minimum_password_length), confirmação obrigatória e
 * igual à senha. A senha nunca é reexibida depois de salva — o diálogo só
 * fecha com um toast de sucesso.
 */
export function SellerPasswordDialog({ seller, onOpenChange, submitting, onSubmit }: SellerPasswordDialogProps) {
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (seller) {
      setValues(EMPTY_VALUES)
      setErrors({})
    }
  }, [seller])

  function set<K extends keyof typeof EMPTY_VALUES>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {}
    if (!values.password) {
      nextErrors.password = 'Senha é obrigatória.'
    } else if (values.password.length < 6) {
      nextErrors.password = 'A senha deve ter pelo menos 6 caracteres.'
    }
    if (!values.confirmPassword) {
      nextErrors.confirmPassword = 'Confirme a nova senha.'
    } else if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = 'As senhas não coincidem.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    if (!validate()) return
    await onSubmit(values.password)
  }

  return (
    <Dialog open={seller !== null} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar senha do vendedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            <p className="text-body-sm text-muted-foreground">
              Defina uma nova senha para <strong className="text-foreground">{seller?.full_name}</strong>. Ele
              precisará usar a nova senha no próximo login.
            </p>
            <Input
              label="Nova senha"
              type="password"
              required
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => set('password', event.target.value)}
              error={errors.password}
              disabled={submitting}
              helperText={!errors.password ? 'Mínimo de 6 caracteres.' : undefined}
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              required
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(event) => set('confirmPassword', event.target.value)}
              error={errors.confirmPassword}
              disabled={submitting}
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {submitting ? 'Alterando...' : 'Alterar senha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
