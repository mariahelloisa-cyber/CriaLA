import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { AuthLoading } from '@/components/auth/auth-loading'
import { ErrorState } from '@/components/ui/error-state'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useShellUser } from '@/hooks/useShellUser'
import { getUnit, updateUnit } from '@/services/units.service'
import type { UnitDetail } from '@/types/units'
import { UnitForm } from './components/unit-form'
import { EMPTY_UNIT_FORM_VALUES, type UnitFormValues } from './components/unit-form-values'

export function UnitEditPage() {
  const shellUser = useShellUser()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [unit, setUnit] = useState<UnitDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await getUnit(id!)
        if (active) setUnit(data)
      } catch (err) {
        if (!active) return
        setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar a unidade.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [id])

  if (!id) return null
  if (loading) return <AuthLoading />

  if (loadError) {
    return (
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Unidades', href: ROUTES.units }]}>
        <ErrorState description={loadError} onRetry={() => window.location.reload()} />
      </AppShell>
    )
  }

  if (!unit) {
    return (
      <AppShell user={shellUser} breadcrumbItems={[{ label: 'Unidades', href: ROUTES.units }]}>
        <ErrorState
          title="Unidade não encontrada"
          description="Ela pode não existir ou ter sido removida."
          onRetry={() => navigate(ROUTES.units)}
          retryLabel="Voltar para Unidades"
        />
      </AppShell>
    )
  }

  const initialValues: UnitFormValues = {
    ...EMPTY_UNIT_FORM_VALUES,
    name: unit.name,
    is_active: unit.is_active,
  }

  async function handleSubmit(values: UnitFormValues) {
    setSubmitting(true)
    try {
      await updateUnit(id!, {
        name: values.name.trim(),
        is_active: values.is_active,
      })

      toast({ title: 'Unidade atualizada com sucesso.', variant: 'success' })
      navigate(ROUTES.unitDetail(id!))
    } catch (err) {
      toast({
        title: 'Não foi possível salvar as alterações.',
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
        { label: unit.name, href: ROUTES.unitDetail(id) },
        { label: 'Editar', href: ROUTES.unitEdit(id) },
      ]}
    >
      <PageHeader eyebrow="Unidades" title={`Editar ${unit.name}`} description="Atualize os dados da unidade." />

      <UnitForm
        mode="edit"
        initialValues={initialValues}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate(ROUTES.unitDetail(id))}
      />
    </AppShell>
  )
}
