import { useEffect, useState } from 'react'
import { GraduationCap, Search, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { SearchInput } from '@/components/ui/search-input'
import { Spinner } from '@/components/ui/spinner'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { searchEligibleEnrollmentsForSale } from '@/services/sales.service'
import { formatCpf } from '@/utils/cpf'
import type { EligibleEnrollment } from '@/types/sales'

interface EnrollmentPickerProps {
  value: EligibleEnrollment | null
  onChange: (enrollment: EligibleEnrollment | null) => void
  error?: string
}

/**
 * Mesmo padrão do StudentPicker (Fase 10, pages/enrollments/components/) —
 * não existe combobox no Design System, então busca-e-seleciona é feita com
 * SearchInput + lista de resultados server-side. Só mostra matrículas que
 * ainda não têm venda (searchEligibleEnrollmentsForSale já filtra isso).
 */
export function EnrollmentPicker({ value, onChange, error }: EnrollmentPickerProps) {
  const [term, setTerm] = useState('')
  const debouncedTerm = useDebouncedValue(term, 350)
  const [results, setResults] = useState<EligibleEnrollment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!debouncedTerm.trim()) {
      setResults([])
      return
    }
    let active = true
    setLoading(true)
    searchEligibleEnrollmentsForSale(debouncedTerm)
      .then((data) => {
        if (active) setResults(data)
      })
      .catch(() => {
        if (active) setResults([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [debouncedTerm])

  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>Matrícula</Label>
        <Card className="flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-brand-pink-soft text-primary">
              <GraduationCap className="size-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{value.student.full_name}</span>
              <span className="text-caption text-muted-foreground">
                {value.student.cpf ? formatCpf(value.student.cpf) : 'CPF não informado'}
                {value.class ? ` · ${value.class.course?.name ?? 'Sem curso'} · ${value.class.name}` : ''}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-caption text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-3.5" aria-hidden="true" />
            Trocar matrícula
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label required>Matrícula</Label>
      <SearchInput
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Buscar por nome ou CPF do aluno..."
        aria-label="Buscar matrícula por aluno"
      />
      {error && <p className="text-caption text-destructive">{error}</p>}

      {term.trim() && (
        <Card className="flex flex-col gap-1 p-1.5" role="listbox" aria-label="Resultados da busca de matrículas">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-body-sm text-muted-foreground">
              <Spinner size="sm" />
              Buscando...
            </div>
          )}
          {!loading && results.length === 0 && (
            <p className="px-3 py-2 text-body-sm text-muted-foreground">
              Nenhuma matrícula elegível encontrada para &quot;{term}&quot;. O aluno pode não existir ou a matrícula
              já possuir uma venda registrada.
            </p>
          )}
          {!loading &&
            results.map((enrollment) => (
              <button
                key={enrollment.id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onChange(enrollment)
                  setTerm('')
                }}
                className="flex flex-col items-start rounded-md px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="text-body-sm font-medium text-foreground">{enrollment.student.full_name}</span>
                <span className="text-caption text-muted-foreground">
                  {enrollment.class?.course?.name ?? 'Sem curso'} · {enrollment.class?.name ?? 'Sem turma'} ·{' '}
                  {enrollment.class?.unit?.name ?? 'Sem unidade'}
                </span>
              </button>
            ))}
        </Card>
      )}

      {!term.trim() && (
        <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <Search className="size-3.5" aria-hidden="true" />
          Digite ao menos uma letra para buscar uma matrícula sem venda registrada.
        </p>
      )}
    </div>
  )
}
