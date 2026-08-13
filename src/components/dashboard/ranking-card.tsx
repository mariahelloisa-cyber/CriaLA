import { Avatar } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface RankingItem {
  id: string
  name: string
  value: string
  avatarUrl?: string
}

interface RankingCardProps {
  title: string
  items: RankingItem[]
  description?: string
  className?: string
}

export function RankingCard({ title, items, description, className }: RankingCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-body-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-1">
          {items.map((item, index) => {
            const position = index + 1
            return (
              <li key={item.id} className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-semibold',
                    position === 1 && 'bg-primary text-primary-foreground',
                    position === 2 && 'bg-brand-blue-soft text-secondary',
                    position >= 3 && 'bg-muted text-muted-foreground',
                  )}
                >
                  {position}
                </span>
                <Avatar name={item.name} src={item.avatarUrl} size="sm" />
                <span className="flex-1 truncate text-body-sm font-medium text-foreground">{item.name}</span>
                <span className="text-body-sm font-semibold text-foreground">{item.value}</span>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
