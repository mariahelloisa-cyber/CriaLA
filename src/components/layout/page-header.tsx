import type { ReactNode } from 'react'
import { Breadcrumbs, type BreadcrumbItem } from '@/components/navigation/breadcrumbs'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  breadcrumbItems?: BreadcrumbItem[]
  actions?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, breadcrumbItems, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="flex flex-col gap-1.5">
        {breadcrumbItems && breadcrumbItems.length > 0 && <Breadcrumbs items={breadcrumbItems} />}
        {eyebrow && <Text variant="overline">{eyebrow}</Text>}
        <Text variant="h2" as="h1">
          {title}
        </Text>
        {description && <Text className="max-w-2xl text-muted-foreground">{description}</Text>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
