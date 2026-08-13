# SouCriaLA — Sistema de Gestão Comercial e Acadêmica

Sistema de gestão do Projeto SouCriaLA para controle de vendedores, alunos, turmas, vendas,
metas comerciais e indicadores gerenciais em uma única plataforma. A especificação funcional
completa está em [`Sistema de Gestão SOU CRIA.pdf`](./Sistema%20de%20Gestão%20SOU%20CRIA.pdf).

> **Status:** fundação técnica (Fase 01) + fundação do banco de dados (Fase 02). O schema
> PostgreSQL completo, com RLS por perfil, já existe como migrations versionadas. Telas de
> negócio, login e dashboards ainda não foram implementados — serão construídos em etapas
> futuras sobre esta base.

## Stack

- **Frontend:** React + Vite + TypeScript
- **Roteamento:** React Router
- **Estilos:** Tailwind CSS
- **Backend/BaaS:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Ícones:** Lucide React
- **Gráficos (uso futuro):** Recharts

## Estrutura de pastas

```
src/
├── app/            # Componente raiz da aplicação
├── components/
│   ├── ui/         # Componentes de UI genéricos e reutilizáveis
│   └── layout/      # Componentes estruturais (AppLayout, Sidebar, Header...)
├── pages/          # Páginas/telas da aplicação
├── routes/         # Definição das rotas
├── hooks/          # Hooks React customizados
├── services/       # Integrações com APIs e Supabase (camada de dados)
├── lib/            # Configuração de bibliotecas externas (ex.: cliente Supabase)
├── types/          # Tipos e definições TypeScript compartilhadas
├── utils/          # Funções utilitárias puras
├── constants/       # Constantes da aplicação (rotas, etc.)
└── styles/         # Estilos globais
```

## Pré-requisitos

- Node.js 20+
- Uma conta e projeto criados no [Supabase](https://supabase.com)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) para
  aplicar as migrations (`npm install -g supabase` ou `npx supabase`)

## Instalação

```bash
npm install
```

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**.
3. Duplique o arquivo `.env.example` como `.env` na raiz do projeto:

   ```bash
   cp .env.example .env
   ```

4. Preencha as variáveis com os valores do seu projeto Supabase (veja abaixo).
5. Vincule o projeto local ao projeto remoto e aplique as migrations (veja a seção
   [Banco de dados](#banco-de-dados) abaixo).

> A autenticação (telas de login/signup) ainda não foi implementada nesta etapa. O schema já
> está preparado para recebê-la: ao criar um usuário via Supabase Auth, um `profile`
> correspondente é gerado automaticamente por trigger.

## Variáveis de ambiente

| Variável                  | Descrição                                    |
| -------------------------- | --------------------------------------------- |
| `VITE_SUPABASE_URL`        | URL do projeto Supabase                       |
| `VITE_SUPABASE_ANON_KEY`   | Chave pública (anon) do projeto Supabase      |

Nunca commitar o arquivo `.env` com valores reais — ele já está listado no `.gitignore`.

## Banco de dados

O schema PostgreSQL vive inteiramente em `supabase/migrations/` (versionado, nada é alterado
manualmente pelo dashboard do Supabase). A especificação de negócio por trás de cada tabela
está em [`Sistema de Gestão SOU CRIA.pdf`](./Sistema%20de%20Gestão%20SOU%20CRIA.pdf).

```
supabase/
├── config.toml       # configuração do Supabase CLI (projeto local)
├── seed.sql          # dados iniciais idempotentes (categorias de curso)
└── migrations/
    ├── 20260811120000_extensions_and_enums.sql
    ├── 20260811120100_profiles.sql
    ├── 20260811120200_academic_catalog.sql      # course_categories, courses, units, classes
    ├── 20260811120300_students_enrollments.sql
    ├── 20260811120400_sales_goals.sql           # sales, sale_installments, goals
    ├── 20260811120500_updated_at_triggers.sql
    ├── 20260811120600_indexes.sql
    ├── 20260811120700_auth_profile_trigger.sql  # cria profile ao criar auth.users
    └── 20260811120800_rls_and_policies.sql
```

### Entidades

| Tabela               | Descrição                                                              |
| --------------------- | ----------------------------------------------------------------------- |
| `profiles`            | Perfil de aplicação (1:1 com `auth.users`), com `role` (`seller`/`manager`) |
| `course_categories`   | Categorias fixas de curso (EJA, Curso Técnico, Curso Superior, Curso SouCria, Pós-graduação, Pós Técnico) |
| `courses`              | Cursos oferecidos, vinculados a uma categoria                          |
| `units`                | Unidades físicas/polos                                                 |
| `classes`              | Turmas, vinculadas a curso + unidade                                    |
| `students`             | Cadastro de alunos (dados pessoais + endereço). Não guarda curso/turma diretamente |
| `enrollments`          | Matrícula: vínculo obrigatório aluno ↔ turma                           |
| `sales`                | Venda gerada a partir da matrícula, com `goal_amount`/`goal_student_count` explícitos para apuração de metas |
| `sale_installments`    | Parcelas do plano de pagamento da venda (estrutura preparada para evolução futura) |
| `goals`                | Meta mensal individual por vendedor (valor e/ou quantidade de alunos)  |

### Como aplicar as migrations

```bash
# Login e vínculo com o projeto remoto (uma vez por máquina/projeto)
supabase login
supabase link --project-ref <seu-project-ref>

# Aplica todas as migrations pendentes no projeto remoto
supabase db push
```

Para desenvolvimento local com Postgres + Studio via Docker:

```bash
supabase start     # sobe o stack local (requer Docker)
supabase db reset  # recria o banco local a partir das migrations + seed.sql
```

### Como aplicar o seed

`supabase db reset` já aplica `supabase/seed.sql` automaticamente no ambiente local. Em um
projeto remoto, aplique manualmente uma única vez (o `seed.sql` usa `ON CONFLICT DO NOTHING`,
portanto é seguro reexecutar):

```bash
supabase db execute -f supabase/seed.sql --linked
```

O seed insere **apenas** as 6 categorias de curso definidas no PDF. Nenhum vendedor, aluno,
turma, venda ou meta fictícios é criado.

### Row Level Security (resumo)

RLS está habilitado em todas as tabelas. As regras seguem literalmente a seção "9. Controle de
Permissões" do PDF:

- **Vendedor (`seller`):** enxerga e edita apenas os alunos que ele mesmo cadastrou
  (`students.created_by = auth.uid()`), matrículas/vendas/metas ligadas a esses registros. Não
  pode ver dados de outros vendedores.
- **Gerente (`manager`):** acesso total (SELECT/INSERT/UPDATE/DELETE) a todas as tabelas,
  incluindo criação de turmas e cadastro de metas.
- **Catálogo (`course_categories`, `courses`, `units`, `classes`):** leitura liberada para
  qualquer usuário autenticado (necessário para o vendedor preencher o cadastro de aluno);
  escrita restrita ao gerente.

Duas funções auxiliares `SECURITY DEFINER` — `public.is_manager()` e `public.is_seller()` —
concentram a checagem de papel do usuário a partir de `profiles`. Elas existem especificamente
para **evitar recursão de RLS**: como são `SECURITY DEFINER` e o dono da função é o mesmo role
que possui a tabela `profiles`, a consulta interna roda sem reavaliar as policies da própria
tabela, quebrando qualquer ciclo. `search_path` é fixado como vazio (`set search_path = ''`) em
todas as funções `SECURITY DEFINER`, com todos os objetos referenciados por schema explícito.

## Executando o projeto

```bash
npm run dev
```

A aplicação ficará disponível em `http://localhost:5173`.

## Build de produção

```bash
npm run build
```

Os arquivos otimizados são gerados na pasta `dist/`.

## Pré-visualizar o build

```bash
npm run preview
```

## Próxima etapa recomendada

Implementação da autenticação (telas de login, integração com Supabase Auth) e do roteamento
protegido por perfil (Vendedor / Gerente) no frontend, consumindo o schema e as policies de RLS
já existentes. Ver o relatório da Fase 02 para riscos e decisões arquiteturais pendentes de
validação com o time de negócio.
