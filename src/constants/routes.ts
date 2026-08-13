/**
 * Todas as rotas do sistema (PDF seções 2–8), registradas em AppRoutes.tsx
 * conforme cada módulo foi implementado. `preview` é um resquício da Fase 04
 * (autenticação, antes de o Dashboard real existir) — mantido por não haver
 * necessidade de removê-lo, mas não é mais o destino pós-login.
 */
export const ROUTES = {
  home: '/',
  login: '/login',
  preview: '/preview',

  dashboard: '/dashboard',
  students: '/alunos',
  studentNew: '/alunos/novo',
  studentDetail: (id: string) => `/alunos/${id}`,
  studentEdit: (id: string) => `/alunos/${id}/editar`,
  courses: '/cursos',
  courseNew: '/cursos/novo',
  courseDetail: (id: string) => `/cursos/${id}`,
  courseEdit: (id: string) => `/cursos/${id}/editar`,
  units: '/unidades',
  unitNew: '/unidades/nova',
  unitDetail: (id: string) => `/unidades/${id}`,
  unitEdit: (id: string) => `/unidades/${id}/editar`,
  classes: '/turmas',
  classNew: '/turmas/nova',
  classDetail: (id: string) => `/turmas/${id}`,
  classEdit: (id: string) => `/turmas/${id}/editar`,
  enrollments: '/matriculas',
  enrollmentNew: '/matriculas/nova',
  enrollmentDetail: (id: string) => `/matriculas/${id}`,
  enrollmentEdit: (id: string) => `/matriculas/${id}/editar`,
  sales: '/vendas',
  saleNew: '/vendas/nova',
  saleDetail: (id: string) => `/vendas/${id}`,
  saleEdit: (id: string) => `/vendas/${id}/editar`,
  goals: '/metas',
  sellers: '/vendedores',
  sellerDetail: (id: string) => `/vendedores/${id}`,
  reports: '/relatorios',
} as const

/**
 * Destino padrão após login bem-sucedido. Trocado de ROUTES.preview para
 * ROUTES.dashboard na Fase 14, exatamente como o comentário original previa
 * — nenhum outro arquivo precisou mudar além deste.
 */
export const POST_LOGIN_REDIRECT = ROUTES.dashboard
