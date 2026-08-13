import { cn } from '@/lib/utils'

/** Badge de status ativo/inativo, compartilhado entre Cursos e Unidades (ambos só têm is_active, sem enum de status). */
export function ActiveStatusBadge({ isActive, className }: { isActive: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-medium leading-none',
        isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      <span
        className={cn('size-1.5 shrink-0 rounded-full', isActive ? 'bg-success' : 'bg-muted-foreground')}
        aria-hidden="true"
      />
      {isActive ? 'Ativo' : 'Inativo'}
    </span>
  )
}
