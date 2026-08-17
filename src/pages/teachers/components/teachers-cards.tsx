import { Contact, Eye, FileText, GraduationCap, Mail, MoreHorizontal, Pencil, Phone, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { ActiveStatusBadge } from '@/components/shared/active-status-badge'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import type { TeacherListItem } from '@/types/teachers'

interface TeachersCardsProps {
  items: TeacherListItem[]
  onDelete: (item: TeacherListItem) => void
  className?: string
}

export function TeachersCards({ items, onDelete, className }: TeachersCardsProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3', className)}>
      {items.map((item) => (
        <Card key={item.id} className="flex flex-col gap-4 rounded-lg p-5 shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to={ROUTES.teacherDetail(item.id)}
                className="flex items-center gap-2 truncate text-body font-bold text-foreground hover:underline"
              >
                <Contact className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">{item.full_name}</span>
              </Link>
              <p className="truncate text-body-sm text-muted-foreground">{item.subject_area}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ActiveStatusBadge isActive={item.is_active} className="rounded-full" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton label={`Ações de ${item.full_name}`} variant="ghost" className="shrink-0">
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={ROUTES.teacherDetail(item.id)}>
                      <Eye className="size-4" aria-hidden="true" />
                      Visualizar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={ROUTES.teacherEdit(item.id)}>
                      <Pencil className="size-4" aria-hidden="true" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => onDelete(item)}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-caption text-muted-foreground">
            <span className="flex items-center gap-2">
              <Mail className="size-3.5 shrink-0" aria-hidden="true" />
              {item.email ?? 'Sem e-mail cadastrado'}
            </span>
            <span className="flex items-center gap-2">
              <Phone className="size-3.5 shrink-0" aria-hidden="true" />
              {item.phone ?? 'Sem telefone cadastrado'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-caption text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="size-3.5 shrink-0" aria-hidden="true" />
              {item.classCount} turma{item.classCount === 1 ? '' : 's'}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="size-3.5 shrink-0" aria-hidden="true" />
              {item.contract_file_name ? 'Contrato anexado' : 'Sem contrato'}
            </span>
          </div>
        </Card>
      ))}
    </div>
  )
}
