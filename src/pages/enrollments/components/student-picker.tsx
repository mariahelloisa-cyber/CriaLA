import { useEffect, useState } from 'react'
import { Search, User, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { SearchInput } from '@/components/ui/search-input'
import { Spinner } from '@/components/ui/spinner'
import { searchStudentsForEnrollment } from '@/services/enrollments.service'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatCpf } from '@/utils/cpf'
import type { StudentOption } from '@/types/enrollments'

interface StudentPickerProps {
  value: StudentOption | null
  onChange: (student: StudentOption | null) => void
  error?: string
}

/**
 * Não existe um componente de combobox/autocomplete no Design System ainda
 * (ver auditoria da Fase 10) — a busca de aluno reaproveita SearchInput +
 * uma lista de resultados server-side, em vez de carregar todos os alunos
 * num <Select>, que não escalaria (aviso explícito do prompt desta fase).
 */
export function StudentPicker({ value, onChange, error }: StudentPickerProps) {
  const [term, setTerm] = useState('')
  const debouncedTerm = useDebouncedValue(term, 350)
  const [results, setResults] = useState<StudentOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!debouncedTerm.trim()) {
      setResults([])
      return
    }
    let active = true
    setLoading(true)
    searchStudentsForEnrollment(debouncedTerm)
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
        <Label>Aluno</Label>
        <Card className="flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-brand-pink-soft text-primary">
              <User className="size-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{value.full_name}</span>
              <span className="text-caption text-muted-foreground">
                {value.cpf ? formatCpf(value.cpf) : 'CPF não informado'}
                {value.email ? ` · ${value.email}` : ''}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-caption text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-3.5" aria-hidden="true" />
            Trocar aluno
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label required>Aluno</Label>
      <SearchInput
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Buscar aluno por nome ou CPF..."
        aria-label="Buscar aluno por nome ou CPF"
      />
      {error && <p className="text-caption text-destructive">{error}</p>}

      {term.trim() && (
        <Card className="flex flex-col gap-1 p-1.5" role="listbox" aria-label="Resultados da busca de alunos">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-body-sm text-muted-foreground">
              <Spinner size="sm" />
              Buscando...
            </div>
          )}
          {!loading && results.length === 0 && (
            <p className="px-3 py-2 text-body-sm text-muted-foreground">
              Nenhum aluno encontrado para &quot;{term}&quot;.
            </p>
          )}
          {!loading &&
            results.map((student) => (
              <button
                key={student.id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onChange(student)
                  setTerm('')
                }}
                className="flex flex-col items-start rounded-md px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="text-body-sm font-medium text-foreground">{student.full_name}</span>
                <span className="text-caption text-muted-foreground">
                  {student.cpf ? formatCpf(student.cpf) : 'CPF não informado'}
                </span>
              </button>
            ))}
        </Card>
      )}

      {!term.trim() && (
        <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <Search className="size-3.5" aria-hidden="true" />
          Digite ao menos uma letra para buscar um aluno já cadastrado.
        </p>
      )}
    </div>
  )
}
