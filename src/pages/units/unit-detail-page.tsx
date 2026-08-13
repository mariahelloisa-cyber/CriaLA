import { useEffect, useState } from 'react'
import { ArrowLeft, GraduationCap, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AuthLoading } from '@/components/auth/auth-loading'
import { AppShell } from '@/components/layout/app-shell'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorState } from '@/components/ui/error-state'
import { Separator } from '@/components/ui/separator'
import { ROUTES } from '@/constants/routes'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useShellUser } from '@/hooks/useShellUser'
import { deleteUnit, getUnit, listClassesForUnit } from '@/services/units.service'
import type { UnitClassSummary, UnitDetail } from '@/types/units'
import { ActiveStatusBadge } from '@/components/shared/active-status-badge'
import { ClassStatusBadge } from '@/pages/students/components/status-badges'

export function UnitDetailPage() {
  const shellUser = useShellUser()
  const { isManager } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [unit, setUnit] = useState<UnitDetail | null>(null)
  const [classes, setClasses] = useState<UnitClassSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const unitData = await getUnit(id!)
        if (!active) return
        setUnit(unitData)
        if (unitData) {
          const classesData = await listClassesForUnit(unitData.id).catch(() => [])
          if (active) setClasses(classesData)
        }
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

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteUnit(id!)
      toast({ title: 'Unidade excluída com sucesso.', variant: 'success' })
      navigate(ROUTES.units)
    } catch (err) {
      toast({
        title: 'Não foi possível excluir a unidade.',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
      setDeleting(false)
      setConfirmDeleteOpen(false)
    }
  }

  return (
    <AppShell
      user={shellUser}
      breadcrumbItems={[
        { label: 'Unidades', href: ROUTES.units },
        { label: unit.name, href: ROUTES.unitDetail(id) },
      ]}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-h2 font-semibold tracking-tight text-foreground">{unit.name}</h1>
            <ActiveStatusBadge isActive={unit.is_active} className="rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.units} className={buttonVariants({ variant: 'outline' })}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar
            </Link>
            {isManager && (
              <>
                <Link to={ROUTES.unitEdit(id)} className={buttonVariants({ variant: 'outline' })}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Editar
                </Link>
                <Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Excluir
                </Button>
              </>
            )}
          </div>
        </div>

        <Card className="rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-body">
              <GraduationCap className="size-4" aria-hidden="true" />
              Turmas da unidade
              <span className="text-body-sm font-normal text-muted-foreground">({classes.length})</span>
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5">
            {classes.length === 0 ? (
              <p className="text-body-sm text-muted-foreground">Nenhuma turma vinculada a esta unidade ainda.</p>
            ) : (
              <ul className="flex flex-col">
                {classes.map((klass, index) => (
                  <li key={klass.id}>
                    {index > 0 && <Separator className="my-2" />}
                    <Link
                      to={ROUTES.classDetail(klass.id)}
                      className="flex items-center justify-between gap-2 py-1 hover:underline"
                    >
                      <span className="text-body-sm text-foreground">{klass.name}</span>
                      <ClassStatusBadge status={klass.status} className="rounded-full" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir unidade</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-body-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong className="text-foreground">{unit.name}</strong>? Esta ação
              não poderá ser desfeita.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
