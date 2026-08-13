import { Construction } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ROUTES } from '@/constants/routes'
import { useShellUser } from '@/hooks/useShellUser'

interface ComingSoonPageProps {
  title: string
  description: string
  /** Rota atual (para o breadcrumb — mesma convenção das demais páginas, mesmo o item sendo sempre o último/não-clicável). */
  href: string
}

/**
 * Placeholder genérico (Fase 16) para itens de menu cuja rota já é real e
 * navegável, mas cujo módulo ainda não foi implementado — hoje usado por
 * /vendedores e /configuracoes (ambos previstos no PDF/na Sidebar desde
 * fases anteriores, nenhum dos dois com escopo definido ainda). Não é a
 * mesma coisa que 404: a rota existe de propósito, só o conteúdo não foi
 * construído. Reaproveita EmptyState (mesmo componente usado em toda
 * listagem vazia do sistema) em vez de um padrão visual novo.
 */
export function ComingSoonPage({ title, description, href }: ComingSoonPageProps) {
  const shellUser = useShellUser()

  return (
    <AppShell user={shellUser} breadcrumbItems={[{ label: title, href }]}>
      <PageHeader title={title} description="Este módulo ainda não está disponível." />
      <EmptyState
        icon={<Construction className="size-6" aria-hidden="true" />}
        title="Em desenvolvimento"
        description={description}
        action={
          <Link to={ROUTES.dashboard} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Voltar à visão geral
          </Link>
        }
      />
    </AppShell>
  )
}
