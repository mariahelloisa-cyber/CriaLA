import type { Course } from './classes'

export type { ClassOption, Course, PaginatedResult, Unit } from './classes'

/**
 * Espelha public.payment_method e public.installment_status
 * (supabase/migrations/20260811120000_extensions_and_enums.sql).
 */
export type PaymentMethod = 'cash' | 'credit_card' | 'bank_slip'
export type InstallmentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

/**
 * "Situação" da venda, exibida na listagem/detalhe. NÃO é uma coluna do
 * banco — public.sales não tem status próprio (só as parcelas têm). É
 * derivada, no client, a partir do agregado dos status das parcelas dessa
 * venda (ver services/sales.service.ts:deriveSaleSituation). Decisão
 * documentada no relatório final da Fase 11, seção O/AD.
 */
export type SaleSituation = 'paid' | 'overdue' | 'cancelled' | 'pending'

export interface SaleStudent {
  id: string
  full_name: string
  cpf: string | null
}

export interface SaleSeller {
  id: string
  full_name: string
}

/** Uma linha da listagem de vendas (raiz em `sales` — todas as colunas usadas aqui são raiz/FK direta). */
export interface SaleListItem {
  id: string
  enrollment_id: string
  sale_date: string
  payment_method: PaymentMethod
  payment_plan: string | null
  total_amount: number
  /** Valor considerado na apuração de metas (PDF seção 5) — à vista/cartão = total_amount; boleto = 1ª parcela. */
  goal_amount: number
  student: SaleStudent
  course: Course
  seller: SaleSeller
  /** Preenchido em lote após a query principal (ver listSales) — null enquanto não carregado. */
  situacao: SaleSituation | null
  /** Quantidade de parcelas (`sale_installments`) — 1 = pagamento único. Preenchido junto com `situacao`. */
  installmentCount: number
  /** Valor da 1ª parcela (== valor de cada parcela quando o plano é uniforme) — usado para exibir "Nx de R$Y". */
  installmentAmount: number
}

export interface SaleInstallment {
  id: string
  installment_number: number
  amount: number
  due_date: string | null
  paid_at: string | null
  status: InstallmentStatus
}

export interface SaleDetail {
  id: string
  enrollment_id: string
  sale_date: string
  payment_method: PaymentMethod
  payment_plan: string | null
  total_amount: number
  goal_amount: number
  goal_student_count: number
  created_at: string
  updated_at: string
  student: SaleStudent
  course: Course
  seller: SaleSeller
  class: { id: string; name: string; unit: { id: string; name: string } | null } | null
  installments: SaleInstallment[]
}

export type SaleStatusFilter = 'all' | SaleSituation

/**
 * A UI da página de Vendas foi simplificada para só busca + forma de
 * pagamento (pedido do usuário, referência visual) — os filtros de
 * curso/turma/unidade (Drawer) foram removidos por não terem nenhum outro
 * consumidor. `sellerId`/`saleDateFrom`/`saleDateTo` continuam aqui porque
 * `listSales()` também é usado por
 * `pages/goals/hooks/use-goals-dashboard.ts` (lista de vendas recentes de UM
 * vendedor num período, para a Visão Geral/Metas) — não são filtros da UI de
 * Vendas, são parâmetros do service reaproveitados por outro módulo.
 */
export interface SaleFilters {
  search: string
  paymentMethod: PaymentMethod | null
  /** Não exposto na UI de Vendas — usado por use-goals-dashboard.ts. */
  sellerId: string | null
  /** Não exposto na UI de Vendas — usado por use-goals-dashboard.ts. */
  saleDateFrom: string | null
  /** Não exposto na UI de Vendas — usado por use-goals-dashboard.ts. */
  saleDateTo: string | null
  page: number
  pageSize: number
}

/** Matrícula elegível para receber uma venda nova (ainda não possui sales.enrollment_id). */
export interface EligibleEnrollment {
  id: string
  enrollment_date: string
  student: SaleStudent
  class: {
    id: string
    name: string
    course: { id: string; name: string } | null
    unit: { id: string; name: string } | null
  } | null
}

export interface InstallmentInput {
  installment_number: number
  amount: number
  due_date: string | null
}

export interface CreateSaleInput {
  enrollment_id: string
  total_amount: number
  payment_method: PaymentMethod
  payment_plan: string | null
  sale_date: string
  installments: InstallmentInput[]
}

/** Campos editáveis de uma venda — ver justificativa no relatório final (seção AD): valor/forma de
 * pagamento/parcelas não são editáveis aqui para não dessincronizar das parcelas já criadas. */
export interface UpdateSaleInput {
  sale_date?: string
  payment_plan?: string | null
}

/**
 * Fase 19, decisão 5: para onde o SaleForm deve enviar os dados comerciais.
 * "existing" preserva o fluxo original (Fase 11: anexar venda a uma
 * matrícula já criada sem venda). "new" é o fluxo unificado (matrícula +
 * venda no mesmo processo, para um aluno já cadastrado) — SaleNewPage decide
 * qual service/RPC chamar a partir deste discriminador.
 */
export type SaleFormTarget =
  | { mode: 'existing'; enrollmentId: string }
  | {
      mode: 'new'
      studentId: string
      classId: string
      enrollmentDate: string
      expectedGraduationDate: string | null
    }

export interface CreateEnrollmentWithSaleInput {
  student_id: string
  class_id: string
  enrollment_date: string
  expected_graduation_date: string | null
  total_amount: number
  payment_method: PaymentMethod
  payment_plan: string | null
  sale_date: string
  installments: InstallmentInput[]
}
