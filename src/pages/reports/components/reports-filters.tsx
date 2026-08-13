import { DatePicker } from '@/components/ui/date-picker'
import { Select } from '@/components/ui/select'
import { PAYMENT_METHOD_LABEL } from '@/pages/sales/components/sale-badges'
import type { PaymentMethod } from '@/types/sales'
import type { CourseCategory } from '@/types/classes'
import type { ReportFilters, SellerOption } from '@/types/reports'

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = ['cash', 'credit_card', 'bank_slip']

interface ReportsFiltersProps {
  filters: ReportFilters
  onChange: (patch: Partial<ReportFilters>) => void
  isManager: boolean
  sellers: SellerOption[]
  categories: CourseCategory[]
}

/**
 * Filtros sempre visíveis (não em Drawer, diferente de Vendas/Matrículas) —
 * a Fase 13 pede um conjunto pequeno e fixo de filtros (seção 8: "não criar
 * dezenas de filtros desnecessários"), então um bloco simples acima dos
 * relatórios é mais direto do que reaproveitar o padrão Drawer+busca das
 * listagens de entidade.
 */
export function ReportsFilters({ filters, onChange, isManager, sellers, categories }: ReportsFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-4 rounded-md border border-border p-4 sm:grid-cols-2 lg:grid-cols-5">
      <DatePicker
        label="Período de"
        value={filters.dateFrom}
        onChange={(event) => onChange({ dateFrom: event.target.value })}
      />
      <DatePicker
        label="Período até"
        value={filters.dateTo}
        min={filters.dateFrom || undefined}
        onChange={(event) => onChange({ dateTo: event.target.value })}
      />
      {isManager && (
        <Select
          label="Vendedor"
          value={filters.sellerId ?? ''}
          onChange={(event) => onChange({ sellerId: event.target.value || null })}
        >
          <option value="">Todos os vendedores</option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.full_name}
            </option>
          ))}
        </Select>
      )}
      <Select
        label="Forma de pagamento"
        value={filters.paymentMethod ?? ''}
        onChange={(event) => onChange({ paymentMethod: (event.target.value || null) as PaymentMethod | null })}
      >
        <option value="">Todas</option>
        {PAYMENT_METHOD_OPTIONS.map((method) => (
          <option key={method} value={method}>
            {PAYMENT_METHOD_LABEL[method]}
          </option>
        ))}
      </Select>
      <Select
        label="Categoria de curso"
        value={filters.categoryId ?? ''}
        onChange={(event) => onChange({ categoryId: event.target.value || null })}
      >
        <option value="">Todas</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
    </div>
  )
}
