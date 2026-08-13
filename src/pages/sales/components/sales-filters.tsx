import { useEffect, useState } from 'react'
import { SearchInput } from '@/components/ui/search-input'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { SaleFilters } from '@/types/sales'

interface SalesFiltersProps {
  filters: SaleFilters
  onChange: (patch: Partial<Omit<SaleFilters, 'page' | 'pageSize'>>) => void
}

/**
 * Simplificado para só a busca (pedido do usuário, referência visual) — o
 * Drawer de curso/turma/unidade/vendedor/período foi removido (junto com
 * `useSaleOptions`, agora deletado por ficar sem uso). As pílulas de forma
 * de pagamento viraram um componente à parte (`PaymentMethodTabs`), porque
 * na referência elas ficam entre os cards de indicadores e a tabela, não
 * coladas na busca.
 */
export function SalesFilters({ filters, onChange }: SalesFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search)
  const debouncedSearch = useDebouncedValue(searchInput, 350)

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onChange({ search: debouncedSearch })
    }
  }, [debouncedSearch, filters.search, onChange])

  useEffect(() => {
    if (filters.search === '' && searchInput !== '') setSearchInput('')
  }, [filters.search, searchInput])

  return (
    <SearchInput
      value={searchInput}
      onChange={(event) => setSearchInput(event.target.value)}
      placeholder="Buscar por aluno, CPF, curso ou vendedor..."
      aria-label="Buscar vendas"
      containerClassName="sm:max-w-sm"
    />
  )
}
