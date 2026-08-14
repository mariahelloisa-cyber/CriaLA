import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { ErrorState } from '@/components/ui/error-state'
import { CardSkeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROUTES } from '@/constants/routes'
import { useShellUser } from '@/hooks/useShellUser'
import { useScopedSellers } from '@/pages/goals/hooks/use-scoped-sellers'
import { listCourseCategories } from '@/services/students.service'
import { firstDayOfPeriodIso, lastDayOfPeriodIso, currentPeriod } from '@/utils/period'
import type { CourseCategory } from '@/types/classes'
import type { ReportFilters } from '@/types/reports'
import { AcademicReportsSection } from './components/academic/academic-reports-section'
import { CategoryReport } from './components/category-report'
import { GoalsVsRealizedSection } from './components/goals-vs-realized-section'
import { PaymentMethodReport } from './components/payment-method-report'
import { PeriodReport } from './components/period-report'
import { ReportsFilters } from './components/reports-filters'
import { ReportsSummaryCards } from './components/reports-summary-cards'
import { SellerRankingReport } from './components/seller-ranking-report'
import { SellersReportTable } from './components/sellers-report-table'
import { useReportsData } from './hooks/use-reports-data'

type OtherFilters = Omit<ReportFilters, 'sellerId'>

const DEFAULT_OTHER_FILTERS: OtherFilters = {
  dateFrom: firstDayOfPeriodIso(currentPeriod()),
  dateTo: lastDayOfPeriodIso(currentPeriod()),
  paymentMethod: null,
  categoryId: null,
}

type CommercialTab = 'sellers' | 'ranking' | 'period' | 'goals' | 'payment' | 'category'
type TopTab = 'commercial' | 'academic'

export function ReportsPage() {
  const shellUser = useShellUser()
  const { isManager, sellers, sellerFilter, setSellerFilter, scopedSellers, ownSeller, enabled } = useScopedSellers()
  const [otherFilters, setOtherFilters] = useState<OtherFilters>(DEFAULT_OTHER_FILTERS)
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [topTab, setTopTab] = useState<TopTab>('commercial')
  const [commercialTab, setCommercialTab] = useState<CommercialTab>('sellers')

  useEffect(() => {
    let active = true
    listCourseCategories()
      .then((data) => {
        if (active) setCategories(data)
      })
      .catch(() => {
        if (active) setCategories([])
      })
    return () => {
      active = false
    }
  }, [])

  function updateFilters(patch: Partial<ReportFilters>) {
    if (patch.sellerId !== undefined) {
      setSellerFilter(patch.sellerId)
    }
    const { sellerId: _sellerId, ...rest } = patch
    if (Object.keys(rest).length > 0) {
      setOtherFilters((prev) => ({ ...prev, ...rest }))
    }
  }

  // Vendedor nunca envia sellerId=null para a query — mesmo que o estado
  // interno permita, o efetivo é sempre o próprio id (RLS já garantiria isso
  // de qualquer forma, mas a UI não deve "fingir" que filtra por outro
  // vendedor). Gerente controla livremente via sellerFilter.
  const effectiveSellerId = isManager ? sellerFilter : ownSeller?.id ?? null

  const filters: ReportFilters = useMemo(
    () => ({ ...otherFilters, sellerId: effectiveSellerId }),
    [otherFilters, effectiveSellerId],
  )

  // Para a tabela "por vendedor": se um vendedor específico está filtrado,
  // mostra só a linha dele (não todos os outros zerados) — mesma lógica de
  // "visão única" já usada em Metas (Fase 12).
  const sellersForTable = useMemo(
    () => (sellerFilter ? scopedSellers.filter((seller) => seller.id === sellerFilter) : scopedSellers),
    [sellerFilter, scopedSellers],
  )

  const { bySeller, byDay, byPaymentMethod, byCategory, summary, fullMonth, state, error, retry } = useReportsData(
    filters,
    sellersForTable,
  )

  return (
    <AppShell user={shellUser} breadcrumbItems={[{ label: 'Relatórios', href: ROUTES.reports }]}>
      <PageHeader
        title="Relatórios"
        description="Transforme os dados acadêmicos, comerciais e de metas em relatórios de operação e gestão."
      />

      <div className="flex flex-col gap-6">
        <Tabs value={topTab} onValueChange={(value) => setTopTab(value as TopTab)}>
          <TabsList>
            <TabsTrigger value="commercial">Comerciais</TabsTrigger>
            <TabsTrigger value="academic">Acadêmicos</TabsTrigger>
          </TabsList>

          <TabsContent value="commercial">
            <div className="flex flex-col gap-6">
              <ReportsFilters
                filters={filters}
                onChange={updateFilters}
                isManager={isManager}
                sellers={sellers}
                categories={categories}
              />

              {state === 'loading' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              )}

              {state === 'error' && <ErrorState description={error ?? undefined} onRetry={retry} />}

              {state === 'success' && (
                <>
                  <ReportsSummaryCards
                    salesCount={summary.salesCount}
                    amount={summary.amount}
                    students={summary.students}
                  />

                  <Tabs value={commercialTab} onValueChange={(value) => setCommercialTab(value as CommercialTab)}>
                    <TabsList>
                      <TabsTrigger value="sellers">Por vendedor</TabsTrigger>
                      <TabsTrigger value="ranking">Ranking de vendedores</TabsTrigger>
                      <TabsTrigger value="period">Por período</TabsTrigger>
                      <TabsTrigger value="goals">Metas x realizado</TabsTrigger>
                      <TabsTrigger value="payment">Forma de pagamento</TabsTrigger>
                      <TabsTrigger value="category">Categoria</TabsTrigger>
                    </TabsList>

                    <TabsContent value="sellers">
                      <SellersReportTable items={bySeller} isFullMonth={Boolean(fullMonth)} />
                    </TabsContent>

                    {/* Só monta (e só consulta o ranking) quando a aba está aberta — mesmo cuidado das abas "goals"/"academic". */}
                    <TabsContent value="ranking">
                      {commercialTab === 'ranking' && (
                        <SellerRankingReport isManager={isManager} sellers={sellers} enabled={enabled} />
                      )}
                    </TabsContent>

                    <TabsContent value="period">
                      <PeriodReport items={byDay} />
                    </TabsContent>

                    {/* Só monta (e só consulta goals/sales do mês) quando a aba está aberta — evita query desnecessária. */}
                    <TabsContent value="goals">
                      {commercialTab === 'goals' && <GoalsVsRealizedSection />}
                    </TabsContent>

                    <TabsContent value="payment">
                      <PaymentMethodReport items={byPaymentMethod} />
                    </TabsContent>

                    <TabsContent value="category">
                      <CategoryReport items={byCategory} />
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          </TabsContent>

          {/* Só monta (e só consulta enrollments) quando a aba Acadêmicos está aberta — mesmo cuidado de performance da aba "Metas x realizado" acima. `sellers`/`isManager` reaproveitam o useScopedSellers já chamado no topo desta página — nenhuma query de vendedores nova. */}
          <TabsContent value="academic">
            {topTab === 'academic' && <AcademicReportsSection isManager={isManager} sellers={sellers} />}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
