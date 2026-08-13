import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ProgressCardProps {
  title: string
  current: string
  target: string
  percentage: number
  description?: string
  className?: string
}

export function ProgressCard({ title, current, target, percentage, description, className }: ProgressCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-body-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-h3 font-semibold text-foreground">{current}</span>
          <span className="text-body-sm text-muted-foreground">de {target}</span>
        </div>
        <Progress value={percentage} />
      </CardContent>
    </Card>
  )
}
