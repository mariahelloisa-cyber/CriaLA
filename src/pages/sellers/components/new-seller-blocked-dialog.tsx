import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Text } from '@/components/ui/text'

interface NewSellerBlockedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Fase 21 — cadastro de vendedor pela UI está bloqueado nesta fase: criar um
 * usuário do Supabase Auth com segurança (sem derrubar a sessão do gerente
 * logado, sem senha passando por lógica insegura no client) exige a Auth
 * Admin API, que só funciona com `service_role` — e isso só pode rodar em
 * um ambiente confiável (Edge Function), que não existe neste projeto. Em
 * vez de simular um formulário que não funcionaria de verdade, este diálogo
 * explica o bloqueio e dá o caminho que já funciona hoje.
 */
export function NewSellerBlockedDialog({ open, onOpenChange }: NewSellerBlockedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastro de vendedor indisponível por aqui</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          <Text variant="body-sm" className="text-muted-foreground">
            Criar um novo vendedor exige gerar um usuário de autenticação com senha no Supabase. Fazer isso
            diretamente no navegador (com a chave pública do projeto) não é seguro e derrubaria sua sessão de
            gerente — a forma correta exige uma função de servidor (Edge Function) com acesso administrativo, que
            ainda não existe neste projeto.
          </Text>
          <Text variant="body-sm" className="text-muted-foreground">
            Por enquanto, crie o vendedor diretamente no <strong>Supabase Dashboard → Authentication → Users → Add
            user</strong>, definindo <code className="rounded bg-muted px-1 py-0.5 text-caption">role: "seller"</code>{' '}
            nos metadados do usuário. O perfil em <code className="rounded bg-muted px-1 py-0.5 text-caption">profiles</code>{' '}
            é criado automaticamente e ele aparecerá nesta lista assim que existir.
          </Text>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
