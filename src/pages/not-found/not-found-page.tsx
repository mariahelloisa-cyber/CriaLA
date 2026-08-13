import { Compass } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { Button, buttonVariants } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { ROUTES } from '@/constants/routes'
import { useShellUser } from '@/hooks/useShellUser'

/**
 * Rota coringa (Fase 16) — antes desta fase, uma URL não registrada em
 * AppRoutes.tsx simplesmente não casava com nenhuma <Route>, e como não há
 * layout persistente fora de <AppRoutes /> (ver src/app/App.tsx), o
 * resultado era uma tela em branco, sem Sidebar/Header. Esta página só é
 * alcançada por um usuário JÁ autenticado — a própria rota coringa é
 * envolvida em <ProtectedRoute> em AppRoutes.tsx, então um usuário sem
 * sessão continua sendo redirecionado para /login normalmente antes de
 * chegar aqui (ProtectedRoute não distingue "rota não encontrada" de
 * qualquer outra rota protegida).
 */
export function NotFoundPage() {
  const shellUser = useShellUser()
  const navigate = useNavigate()

  return (
    <AppShell user={shellUser}>
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Compass className="size-8" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-2">
          <Text variant="overline">Erro 404</Text>
          <Text variant="h2" as="h1">
            Página não encontrada
          </Text>
          <Text className="max-w-md text-muted-foreground">
            O endereço que você tentou acessar não existe ou foi removido. Verifique o link ou volte para a visão
            geral do sistema.
          </Text>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
          <Link to={ROUTES.dashboard} className={buttonVariants({ variant: 'primary' })}>
            Ir para a visão geral
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
