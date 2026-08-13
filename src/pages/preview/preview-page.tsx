import { Plus } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROUTES } from '@/constants/routes'
import { useShellUser } from '@/hooks/useShellUser'
import { ComponentsTab } from './components-tab'
import { IndicatorsTab } from './indicators-tab'

/**
 * Página exclusiva para demonstrar o Design System / App Shell (Fase 03).
 * Não é o dashboard real do sistema — os indicadores/tabela/cards abaixo
 * continuam fictícios (Fase 04 não implementa dados reais), mas o usuário
 * exibido no Header/UserMenu já é a sessão autenticada de verdade.
 */
export function PreviewPage() {
  const shellUser = useShellUser()

  return (
    <AppShell user={shellUser} breadcrumbItems={[{ label: 'Visão geral', href: ROUTES.preview }]}>
      <PageHeader
        eyebrow="Design system"
        title="Dashboard Preview"
        description="Composição visual usada apenas para demonstrar tokens, componentes e o App Shell do SouCriaLA. Não é o dashboard final do sistema."
        actions={
          <>
            <Button variant="outline">Exportar</Button>
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Novo aluno
            </Button>
          </>
        }
      />

      <Alert variant="info" className="mb-6">
        <AlertTitle>Dados demonstrativos</AlertTitle>
        <AlertDescription>
          Todos os valores, nomes e indicadores desta página são fictícios e servem apenas para
          ilustrar o Design System. Nenhuma informação vem do banco de dados.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="indicadores">
        <TabsList>
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
          <TabsTrigger value="componentes">Componentes</TabsTrigger>
        </TabsList>
        <TabsContent value="indicadores">
          <IndicatorsTab />
        </TabsContent>
        <TabsContent value="componentes">
          <ComponentsTab />
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}
