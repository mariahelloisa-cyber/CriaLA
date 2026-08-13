/**
 * Dados fictícios usados SOMENTE pela página /preview para demonstrar o
 * Design System. Nenhum destes valores vem do Supabase — ver Fase 03.
 * (O usuário exibido no Header/UserMenu, por outro lado, já é real — ver
 * preview-page.tsx, que usa useAuth() em vez de um DEMO_USER fictício.)
 */
export const DEMO_RANKING = [
  { id: '1', name: 'Carla Mendes', value: 'R$ 38.200' },
  { id: '2', name: 'Rafael Lima', value: 'R$ 31.450' },
  { id: '3', name: 'Bruno Alves', value: 'R$ 27.900' },
  { id: '4', name: 'Juliana Reis', value: 'R$ 22.100' },
  { id: '5', name: 'Diego Farias', value: 'R$ 19.780' },
]

export interface DemoStudent {
  id: string
  name: string
  course: string
  seller: string
  status: 'active' | 'completed' | 'cancelled'
  amount: string
}

export const DEMO_STUDENTS: DemoStudent[] = [
  { id: '1', name: 'João da Silva', course: 'Técnico em Enfermagem', seller: 'Carla Mendes', status: 'active', amount: 'R$ 1.200' },
  { id: '2', name: 'Maria Oliveira', course: 'Pós-graduação em Gestão', seller: 'Rafael Lima', status: 'active', amount: 'R$ 2.400' },
  { id: '3', name: 'Pedro Santos', course: 'Curso SouCria de Marketing', seller: 'Bruno Alves', status: 'completed', amount: 'R$ 890' },
  { id: '4', name: 'Fernanda Costa', course: 'EJA — Ensino Médio', seller: 'Juliana Reis', status: 'cancelled', amount: 'R$ 0' },
  { id: '5', name: 'Lucas Pereira', course: 'Técnico em Administração', seller: 'Carla Mendes', status: 'active', amount: 'R$ 1.500' },
]

export const DEMO_STUDENT_STATUS_LABEL: Record<DemoStudent['status'], string> = {
  active: 'Ativa',
  completed: 'Concluída',
  cancelled: 'Cancelada',
}

export const DEMO_STUDENT_STATUS_VARIANT: Record<DemoStudent['status'], 'success' | 'neutral' | 'danger'> = {
  active: 'success',
  completed: 'neutral',
  cancelled: 'danger',
}
