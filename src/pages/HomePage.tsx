import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-lg bg-primary text-body font-bold text-primary-foreground">
        SC
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-semibold tracking-tight text-foreground">SouCriaLA</h1>
        <p className="text-body-sm text-muted-foreground">Sistema de Gestão Comercial e Acadêmica</p>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <Link to={ROUTES.login} className={buttonVariants({ variant: 'primary' })}>
          Entrar
        </Link>
        <Link to={ROUTES.preview} className={buttonVariants({ variant: 'outline' })}>
          Ver Design System
        </Link>
      </div>
    </div>
  )
}
