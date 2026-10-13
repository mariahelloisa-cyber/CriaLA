// =============================================================================
// Fase 22 — create-seller
//
// Única forma segura de criar um vendedor (usuário do Supabase Auth com
// senha) a partir do frontend: a Auth Admin API exige service_role, que
// NUNCA pode existir no browser/bundle. Esta função roda no servidor,
// valida quem está chamando, e só então usa a service_role internamente.
//
// FLUXO (ver relatório final da Fase 22):
//   1. Valida o JWT do chamador contra o Supabase Auth (mesmo mecanismo de
//      qualquer request autenticado — nenhuma verificação nova inventada).
//   2. Usa esse id já autenticado para ler o profile do CHAMADOR (nunca de
//      terceiros) e confirmar role='manager' + is_active — a mesma condição
//      de public.is_manager() (Fase 02), só que reimplementada em código
//      porque uma Edge Function não pode chamar uma função SQL diretamente
//      sem uma query.
//   3. Só então chama supabase.auth.admin.createUser(). O profile é criado
//      pelo TRIGGER public.handle_new_auth_user como seller INATIVO
//      (auditoria 2026-10-13); esta function o ativa logo em seguida e, se a
//      ativação falhar, apaga o usuário recém-criado (nunca outro).
// =============================================================================
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface CreateSellerPayload {
  full_name?: string
  email?: string
  password?: string
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Não autenticado.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Não foi possível criar o vendedor. Tente novamente.' }, 500)
  }

  // Client "do chamador": valida o JWT recebido exatamente como qualquer
  // outra chamada autenticada do projeto (mesmo Supabase Auth de sempre).
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })

  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser()

  if (callerError || !caller) {
    return jsonResponse({ error: 'Não autenticado.' }, 401)
  }

  // Client administrativo — só existe dentro desta function, nunca é
  // devolvido nem exposto na resposta.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  // Autorização: mesma condição de public.is_manager() (role='manager' AND
  // is_active) — lida do profile do próprio chamador, nunca aceita do body.
  const { data: callerProfile, error: profileError } = await adminClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', caller.id)
    .maybeSingle()

  if (profileError || !callerProfile || callerProfile.role !== 'manager' || !callerProfile.is_active) {
    return jsonResponse({ error: 'Você não tem permissão para criar vendedores.' }, 403)
  }

  let payload: CreateSellerPayload
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Verifique os dados informados.' }, 400)
  }

  const fullName = payload.full_name?.trim() ?? ''
  const email = payload.email?.trim().toLowerCase() ?? ''
  const password = payload.password ?? ''

  if (!fullName || !email || !isValidEmail(email) || password.length < 6) {
    return jsonResponse({ error: 'Verifique os dados informados.' }, 400)
  }

  // O role NÃO vai no metadata: o trigger handle_new_auth_user ignora
  // metadata (controlável pelo usuário via signUp) e sempre cria um seller
  // INATIVO — ver 20261013120000_security_hardening.sql.
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createError) {
    const message = createError.message?.toLowerCase() ?? ''
    if (message.includes('already') || message.includes('duplicate') || message.includes('registered')) {
      return jsonResponse({ error: 'Já existe um usuário cadastrado com este e-mail.' }, 409)
    }
    return jsonResponse({ error: 'Não foi possível criar o vendedor. Tente novamente.' }, 400)
  }

  if (!created.user) {
    return jsonResponse({ error: 'Não foi possível criar o vendedor. Tente novamente.' }, 500)
  }

  // Ativação explícita — único caminho que transforma o profile criado pelo
  // trigger em um vendedor ativo. Se falhar, desfaz o usuário do Auth para
  // não deixar uma conta órfã.
  const { data: activated, error: activateError } = await adminClient
    .from('profiles')
    .update({ is_active: true })
    .eq('id', created.user.id)
    .eq('role', 'seller')
    .select('id')

  if (activateError || !activated || activated.length !== 1) {
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(created.user.id)
    if (rollbackError) {
      // A conta fica INATIVA (o trigger cria assim), então não dá acesso; mas
      // ocupa o e-mail e precisa de limpeza manual. Só o id vai para o log.
      console.error('create-seller: falha ao desfazer usuário após erro de ativação', created.user.id)
    }
    return jsonResponse({ error: 'Não foi possível criar o vendedor. Tente novamente.' }, 500)
  }

  return jsonResponse({ id: created.user.id }, 200)
})
