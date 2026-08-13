import { Bell, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ErrorState } from '@/components/ui/error-state'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { Radio } from '@/components/ui/radio'
import { SearchInput } from '@/components/ui/search-input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Text } from '@/components/ui/text'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/hooks/use-toast'

export function ComponentsTab() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Botões</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <IconButton label="Adicionar" variant="outline">
              <Plus className="size-4" aria-hidden="true" />
            </IconButton>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button loading>Salvando</Button>
            <Button disabled>Desabilitado</Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton label="Excluir" variant="ghost">
                  <Trash2 className="size-4" aria-hidden="true" />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>Excluir registro</TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badges e estados</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Text variant="caption" className="mr-1">
              Turma:
            </Text>
            <Badge variant="success">Aberta</Badge>
            <Badge variant="info">Em andamento</Badge>
            <Badge variant="neutral">Encerrada</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Text variant="caption" className="mr-1">
              Parcela:
            </Text>
            <Badge variant="success">Pago</Badge>
            <Badge variant="warning">Pendente</Badge>
            <Badge variant="danger">Atrasado</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campos de formulário</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Nome completo" placeholder="Ex.: João da Silva" required />
          <Input label="E-mail" type="email" placeholder="nome@email.com" helperText="Usado para contato." />
          <Input label="CPF" placeholder="000.000.000-00" error="CPF inválido." />
          <Select label="Categoria do curso" defaultValue="">
            <option value="" disabled>
              Selecione...
            </option>
            <option value="eja">EJA</option>
            <option value="tecnico">Curso Técnico</option>
            <option value="superior">Curso Superior</option>
          </Select>
          <DatePicker label="Data da matrícula" />
          <SearchInput aria-label="Buscar aluno" placeholder="Buscar aluno..." />
          <Textarea
            label="Observações"
            placeholder="Escreva uma observação..."
            className="sm:col-span-2"
            helperText="Campo opcional."
          />
          <div className="flex flex-col gap-3 sm:col-span-2">
            <Checkbox label="Aceito os termos de uso" description="Necessário para concluir o cadastro." />
            <div className="flex gap-6">
              <Radio name="demo-radio" label="À vista" defaultChecked />
              <Radio name="demo-radio" label="Cartão de crédito" />
              <Radio name="demo-radio" label="Boleto bancário" />
            </div>
            <Switch label="Receber notificações por e-mail" description="Aplica-se apenas a este dispositivo." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overlays</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Abrir modal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar aluno</DialogTitle>
                <DialogDescription>Exemplo de modal do Design System — sem lógica de negócio.</DialogDescription>
              </DialogHeader>
              <DialogBody>
                <Input label="Nome completo" placeholder="Ex.: João da Silva" />
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost">Cancelar</Button>
                <Button>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Abrir drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Nova venda</DrawerTitle>
              </DrawerHeader>
              <DrawerBody className="flex flex-col gap-4">
                <Input label="Aluno" placeholder="Selecione um aluno" />
                <Input label="Valor" placeholder="R$ 0,00" />
              </DrawerBody>
              <DrawerFooter>
                <Button variant="ghost">Cancelar</Button>
                <Button>Confirmar</Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Ações
                <ChevronDown className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Duplicar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                title: 'Aluno cadastrado com sucesso.',
                description: 'João da Silva foi adicionado à turma.',
                variant: 'success',
              })
            }
          >
            <Bell className="size-4" aria-hidden="true" />
            Disparar toast
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estados de carregamento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alertas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Alert variant="info">
            <AlertTitle>Novo período de matrículas</AlertTitle>
            <AlertDescription>As matrículas do próximo semestre abrem em 5 dias.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTitle>Meta abaixo do esperado</AlertTitle>
            <AlertDescription>Faltam 18% para atingir a meta financeira deste mês.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <Text variant="h4">Exemplo de erro</Text>
        <ErrorState onRetry={() => toast({ title: 'Tentando novamente...', variant: 'info' })} />
      </div>
    </div>
  )
}
