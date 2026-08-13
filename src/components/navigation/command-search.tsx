import { Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * Área de busca global preparada visualmente. Ao clicar, apenas explica que
 * a busca chegará em uma etapa futura — nenhuma busca real é executada.
 */
export function CommandSearch({ className }: { className?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            'hidden h-9 w-64 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-body-sm text-muted-foreground transition-colors md:flex',
            'hover:border-brand-pink-soft hover:bg-brand-pink-soft hover:text-primary',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            className,
          )}
        >
          <Search className="size-4" aria-hidden="true" />
          <span className="flex-1 text-left">Buscar...</span>
          <kbd className="rounded-sm border border-border bg-muted px-1.5 py-0.5 text-caption text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Busca global</DialogTitle>
          <DialogDescription>
            A busca por alunos, vendas, turmas e outros registros chegará em uma próxima etapa.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
