import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { GraduationCap, LineChart, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import loginBackground from '@/assets/kids.png'
import { AuthLoading } from '@/components/auth/auth-loading'
import { Brand } from '@/components/navigation/brand'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { POST_LOGIN_REDIRECT, ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/use-toast'

const HIGHLIGHTS = [
  { icon: GraduationCap, text: 'Alunos, turmas e matrículas em um só lugar' },
  { icon: LineChart, text: 'Metas e desempenho comercial em tempo real' },
  { icon: ShieldCheck, text: 'Acesso por perfil' },
]

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const { loading, isAuthenticated, error: authError, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? POST_LOGIN_REDIRECT

  // Já autenticado (sessão restaurada ou login recém-concluído): sai da
  // LoginPage sem nunca chegar a mostrar o formulário.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(redirectTo, { replace: true })
    }
  }, [loading, isAuthenticated, navigate, redirectTo])

  // signIn() só lança erro em falha de credenciais (síncrono/imediato). Um
  // login com credenciais válidas mas perfil inativo/ausente/inválido é
  // rejeitado de forma assíncrona (pelo listener SIGNED_IN no AuthContext,
  // via authError) — sem isto, o botão ficaria preso em "loading" para
  // sempre nesses casos, já que signIn() nunca teria lançado exceção.
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setSubmitting(false)
    }
  }, [loading, isAuthenticated])

  if (loading || isAuthenticated) {
    return <AuthLoading />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setFormError(null)
    setSubmitting(true)

    try {
      await signIn(email, password)
      // Sucesso: o useEffect acima cuida do redirecionamento assim que
      // isAuthenticated virar true (após o profile ser carregado/validado).
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.')
      setSubmitting(false)
    }
  }

  const displayError = formError ?? authError

  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <img
          src={loginBackground}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-[2px]"
        />
        <div className="absolute inset-0 bg-primary/30" />
        <DotGridBackground />

        {/* Este painel usa fundo sólido pink — o mark precisa de tratamento
            invertido (claro sobre pink). Se a logo oficial tiver uma versão
            "reversa"/monocromática clara, ela deve substituir este bloco. */}
        <Link
          to={ROUTES.home}
          className="relative z-10 flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-primary-foreground/15 text-body-sm font-bold">
            SC
          </span>
          <span className="text-body-sm font-semibold">SouCriaLA</span>
        </Link>

        <div className="relative z-10 flex flex-col gap-6">
          <p className="text-h1 font-semibold leading-tight tracking-tight">
            Gestão comercial e acadêmica em um só lugar.
          </p>
          <ul className="flex flex-col gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-body-sm text-primary-foreground/90">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-foreground/15">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-caption text-primary-foreground/70">
          © {new Date().getFullYear()} SouCriaLA. Todos os direitos reservados.
        </p>
      </div>

      <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <Brand to={ROUTES.home} className="lg:hidden" />

          <div className="flex flex-col gap-1.5">
            <h1 className="text-h2 font-semibold tracking-tight text-foreground">Entrar</h1>
            <p className="text-body-sm text-muted-foreground">
              Acesse sua conta para gerenciar alunos, vendas e metas.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            {displayError && (
              <Alert variant="danger" aria-live="polite">
                <AlertDescription className="text-foreground">{displayError}</AlertDescription>
              </Alert>
            )}

            <Input
              label="E-mail"
              type="email"
              placeholder="voce@soucriala.com.br"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
            />
            <div className="flex flex-col gap-1.5">
              <Input
                label="Senha"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() =>
                  toast({
                    title: 'Recuperação de senha em breve',
                    description: 'Esse fluxo será disponibilizado em uma próxima etapa.',
                    variant: 'info',
                  })
                }
                className="self-end text-caption text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Esqueci minha senha
              </button>
            </div>
            <Button type="submit" className="mt-2 w-full" size="lg" loading={submitting} disabled={submitting}>
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

function DotGridBackground() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-10" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="login-dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#login-dot-grid)" />
    </svg>
  )
}
