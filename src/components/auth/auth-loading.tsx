import { Spinner } from '@/components/ui/spinner'

/**
 * Tela mínima exibida enquanto a sessão/profile ainda estão sendo
 * verificados — evita "flash" da LoginPage ou do AppShell antes da hora.
 */
export function AuthLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-body-sm font-bold text-primary-foreground">
        SC
      </span>
      <Spinner size="md" />
    </div>
  )
}
