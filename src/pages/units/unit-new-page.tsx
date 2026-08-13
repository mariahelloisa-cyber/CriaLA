import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import { createUnit } from '@/services/units.service'
import { UnitForm } from './components/unit-form'
import { EMPTY_UNIT_FORM_VALUES, type UnitFormValues } from './components/unit-form-values'

export function UnitNewPage() {
  const shellUser = useShellUser()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values: UnitFormValues) {
    setSubmitting(true)
    try {
      const { id } = await createUnit({
        name: values.name.trim(),
        is_active: values.is_active,
      })

      toast({ title: 'Unidade criada com sucesso.', variant: 'success' })
      navigate(ROUTES.unitDetail(id))
    } catch (err) {
      toast({
        title: 'Não foi possível criar a unidade.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell
      user={shellUser}
      breadcrumbItems={[
        { label: 'Unidades', href: ROUTES.units },
        { label: 'Nova unidade', href: ROUTES.unitNew },
      ]}
    >
      <PageHeader eyebrow="Unidades" title="Nova unidade" description="Cadastre uma unidade para o sistema." />

      <UnitForm
        mode="create"
        initialValues={EMPTY_UNIT_FORM_VALUES}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.units)}
      />
    </AppShell>
  )
}
