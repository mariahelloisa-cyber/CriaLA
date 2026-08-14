import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { isValidEmail } from '@/utils/masks'
import type { CreateSellerInput } from '@/types/sellers'

interface NewSellerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submitting: boolean
  onSubmit: (values: CreateSellerInput) => void | Promise<void>
}

const EMPTY_VALUES = { full_name: '', email: '', password: '', confirmPassword: '' }

type FormErrors = Partial<Record<keyof typeof EMPTY_VALUES, string>>

/**
 * Fase 22 — cadastro real de vendedor, via Edge Function create-seller (a
 * única forma segura: cria o usuário do Supabase Auth no servidor, com
 * service_role restrita à function, nunca no client). O front só coleta os
 * dados e mostra o resultado — toda a validação de autorização (é gerente?)
 * e criação em si acontecem do lado de lá.
 */
export function NewSellerDialog({ open, onOpenChange, submitting, onSubmit }: NewSellerDialogProps) {
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
      setValues(EMPTY_VALUES)
      setErrors({})
    }
  }, [open])

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
    if (!values.password) {
      nextErrors.password = 'Senha é obrigatória.'
    } else if (values.password.length < 6) {
      nextErrors.password = 'A senha deve ter pelo menos 6 caracteres.'
    }
    if (!values.confirmPassword) {
      nextErrors.confirmPassword = 'Confirme a senha.'
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
    await onSubmit({
      full_name: values.full_name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo vendedor</DialogTitle>
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
            <Input
              label="Senha"
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
              label="Confirmar senha"
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
              {submitting ? 'Criando...' : 'Criar vendedor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
