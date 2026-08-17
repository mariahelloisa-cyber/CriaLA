import {
  Banknote,
  BookOpen,
  Building2,
  ClipboardList,
  Contact,
  FileBarChart2,
  GraduationCap,
  LayoutDashboard,
  Target,
  Users,
  Users2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { UserRole } from '@/types/auth'
import { ROUTES } from './routes'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Perfis que podem ver este item. Sem essa restrição, visível a todos. */
  roles?: UserRole[]
}

export interface NavGroup {
  /** Grupos sem título (ex.: "Visão geral") usam label undefined. */
  label?: string
  items: NavItem[]
}

/**
 * Fonte única da navegação da Sidebar. Módulos referenciados aqui ainda não
 * possuem páginas implementadas nesta fase — os links levam a rotas que
 * serão criadas em etapas futuras. `roles` reflete a seção "Rotas por
 * perfil" da Fase 04: vendedor vê Visão geral/Alunos/Vendas/Metas/Cursos/
 * Unidades/Turmas/Matrículas (consulta e criação dos próprios; edição/
 * exclusão de matrícula é exclusiva de gerente — enrollments_update_manager/
 * enrollments_delete_manager não têm cláusula de vendedor); gerente vê tudo.
 * A Sidebar (sidebar-nav.tsx) filtra por `roles` em tempo real.
 *
 * Vendas (Fase 11): item já era visível a ambos os perfis (sem `roles`) desde
 * antes desta fase — RLS `sales_select` permite `seller_id = auth.uid()`, e
 * `/vendas` de fato mostra as vendas do próprio vendedor. Já `/vendas/nova` e
 * `/vendas/:id/editar` são `RoleRoute` manager-only em AppRoutes.tsx, porque
 * `sale_installments_insert_manager`/`update_manager` não têm cláusula de
 * vendedor (só a leitura é compartilhada) — ver relatório final da Fase 11.
 *
 * Relatórios (Fase 13): removida a restrição `roles: ['manager']` que
 * existia desde antes de a página existir de fato — o PDF (seção 9,
 * "Controle de Permissões") lista "Seus relatórios" como algo que o
 * vendedor pode visualizar, e `/relatorios` agora existe e escopa os dados
 * corretamente por role (RLS de `sales`/`goals`, mesma autoridade de sempre;
 * a UI só esconde comparações/rankings globais para o vendedor).
 */
export const NAVIGATION: NavGroup[] = [
  {
    items: [{ label: 'Visão geral', href: ROUTES.dashboard, icon: LayoutDashboard }],
  },
  {
    label: 'Comercial',
    items: [
      { label: 'Alunos', href: ROUTES.students, icon: Users },
      { label: 'Vendas', href: ROUTES.sales, icon: Banknote },
      { label: 'Metas', href: ROUTES.goals, icon: Target },
      { label: 'Vendedores', href: ROUTES.sellers, icon: Users2, roles: ['manager'] },
    ],
  },
  {
    label: 'Acadêmico',
    items: [
      { label: 'Cursos', href: ROUTES.courses, icon: BookOpen },
      { label: 'Unidades', href: ROUTES.units, icon: Building2 },
      { label: 'Turmas', href: ROUTES.classes, icon: GraduationCap },
      { label: 'Matrículas', href: ROUTES.enrollments, icon: ClipboardList },
      { label: 'Professores', href: ROUTES.teachers, icon: Contact, roles: ['manager'] },
    ],
  },
  {
    label: 'Análises',
    items: [{ label: 'Relatórios', href: ROUTES.reports, icon: FileBarChart2 }],
  },
]
