import { Tag } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Separator } from '@/components/ui/separator'
import type { CategoryStudentCount } from '@/types/dashboard'
import { DonutChart } from './donut-chart'

/**
 * Mapeamento categoria → variável CSS de cor (definidas logo abaixo, com
 * valores diferentes para claro/escuro). Por identidade da categoria, não
 * por posição no array — a lista vem ordenada por quantidade
 * (dashboard.service.ts:listStudentCountByCategory), e a cor não pode
 * "repintar" ao reordenar (categoria com mais alunos muda de mês a mês).
 * As 6 categorias são fixas no sistema (PDF seção 2); qualquer nome fora
 * dessa lista (ou "sem categoria") cai no tom neutro de fallback.
 */
const CATEGORY_COLOR_VAR: Record<string, string> = {
  EJA: 'var(--cat-1)',
  'Curso Técnico': 'var(--cat-2)',
  'Curso Superior': 'var(--cat-3)',
  'Curso SouCria': 'var(--cat-4)',
  'Pós-graduação': 'var(--cat-5)',
  'Pós Técnico': 'var(--cat-6)',
}
const FALLBACK_COLOR_VAR = 'var(--cat-fallback)'

function colorForCategory(name: string | null): string {
  if (!name) return FALLBACK_COLOR_VAR
  return CATEGORY_COLOR_VAR[name] ?? FALLBACK_COLOR_VAR
}

/**
 * "Quantidade de Alunos por Categoria" (PDF seção 7) — mesmos dados/query/
 * agregação de sempre (dashboard.service.ts, inalterado); só o visual deste
 * card mudou (barras → donut + legenda), a pedido do usuário. As variáveis
 * --cat-* seguem o mesmo mecanismo de dark mode do resto do projeto (classe
 * `.dark` na raiz, ou preferência do sistema quando nenhum tema explícito
 * está setado — mesmo guard duplo de src/styles/globals.css), escopadas a
 * este card via a classe `.category-donut-scope` para não afetar nenhum
 * outro componente.
 */
export function StudentsByCategoryCard({ items }: { items: CategoryStudentCount[] }) {
  const donutItems = items.map((item) => ({
    key: item.category?.id ?? 'sem-categoria',
    value: item.studentCount,
    color: colorForCategory(item.category?.name ?? null),
  }))

  return (
    <Card className="category-donut-scope rounded-lg shadow-md">
      <style>{`
        .category-donut-scope {
          --cat-1: #eb1f7e;
          --cat-2: #2998e0;
          --cat-3: #1a1a1a;
          --cat-4: #eda100;
          --cat-5: #f472b6;
          --cat-6: #14304d;
          --cat-fallback: #78716c;
        }
        @media (prefers-color-scheme: dark) {
          :root:not(.light):not(.dark) .category-donut-scope {
            --cat-1: #f0398c;
            --cat-2: #4ba6e8;
            --cat-3: #a8a29b;
            --cat-4: #c98500;
            --cat-5: #f78ac4;
            --cat-6: #3c5a7a;
            --cat-fallback: #a8a29b;
          }
        }
        :root.dark .category-donut-scope {
          --cat-1: #f0398c;
          --cat-2: #4ba6e8;
          --cat-3: #a8a29b;
          --cat-4: #c98500;
          --cat-5: #f78ac4;
          --cat-6: #3c5a7a;
          --cat-fallback: #a8a29b;
        }
      `}</style>

      <CardHeader>
        <CardTitle className="text-body">Alunos por categoria</CardTitle>
        <CardDescription className="text-caption">Distribuição da base</CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="pt-5">
        {items.length === 0 ? (
          <EmptyState
            icon={<Tag className="size-6" aria-hidden="true" />}
            title="Nenhuma matrícula cadastrada"
            description="A distribuição por categoria aparecerá aqui quando houver matrículas."
          />
        ) : (
          <div className="flex flex-col gap-6">
            <DonutChart items={donutItems} ariaLabel="Distribuição de alunos por categoria" />

            <ul className="flex flex-col gap-2.5">
              {items.map((item) => (
                <li key={item.category?.id ?? 'sem-categoria'} className="flex items-center gap-2.5 text-body-sm">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colorForCategory(item.category?.name ?? null) }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-foreground">{item.category?.name ?? 'Sem categoria'}</span>
                  <span className="shrink-0 font-medium tabular-nums text-foreground">{item.studentCount}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
