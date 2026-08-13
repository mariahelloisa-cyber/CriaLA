import { Banknote, GraduationCap, Target, Users2 } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/metric-card'
import { ProgressCard } from '@/components/dashboard/progress-card'
import { RankingCard } from '@/components/dashboard/ranking-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Text } from '@/components/ui/text'
import {
  DEMO_RANKING,
  DEMO_STUDENTS,
  DEMO_STUDENT_STATUS_LABEL,
  DEMO_STUDENT_STATUS_VARIANT,
} from './demo-data'

export function IndicatorsTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Valor vendido"
          value="R$ 24.800"
          icon={Banknote}
          tone="primary"
          trend={{ value: 12.4, direction: 'up', label: 'vs. mês anterior' }}
        />
        <MetricCard
          title="Matrículas"
          value="18"
          icon={GraduationCap}
          tone="info"
          trend={{ value: 5.1, direction: 'up', label: 'vs. mês anterior' }}
        />
        <MetricCard
          title="Vendedores ativos"
          value="6"
          icon={Users2}
          tone="neutral"
          trend={{ value: 0, direction: 'neutral', label: 'sem alteração' }}
        />
        <MetricCard
          title="Meta atingida"
          value="82%"
          icon={Target}
          tone="primary"
          trend={{ value: 3.2, direction: 'down', label: 'vs. mês anterior' }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ProgressCard
          title="Meta financeira"
          description="Progresso do mês atual"
          current="R$ 24.800"
          target="R$ 30.000"
          percentage={82}
          className="lg:col-span-3"
        />
        <RankingCard
          title="Ranking de vendedores"
          description="Valor vendido no mês"
          items={DEMO_RANKING}
          className="lg:col-span-2"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Text variant="h4">Alunos recentes</Text>
          <Button variant="outline" size="sm">
            Ver todos
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DEMO_STUDENTS.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium text-foreground">{student.name}</TableCell>
                <TableCell className="text-muted-foreground">{student.course}</TableCell>
                <TableCell className="text-muted-foreground">{student.seller}</TableCell>
                <TableCell>
                  <Badge variant={DEMO_STUDENT_STATUS_VARIANT[student.status]}>
                    {DEMO_STUDENT_STATUS_LABEL[student.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">{student.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3">
        <Text variant="h4">Turmas encerradas neste período</Text>
        <EmptyState
          icon={<GraduationCap className="size-6" aria-hidden="true" />}
          title="Nenhuma turma encerrada"
          description="Quando uma turma for encerrada neste período, ela aparecerá aqui."
        />
      </div>
    </div>
  )
}
