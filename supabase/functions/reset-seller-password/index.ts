// =============================================================================
// Fase 23 — reset-seller-password
//
// Define uma nova senha para um vendedor, via Auth Admin API (única forma —
// senha não é um campo de public.profiles nem de nenhuma tabela própria do
// projeto). Mesmo padrão de autorização de create-seller/update-seller:
// valida o JWT do chamador, confirma gerente ativo no servidor, só então usa
// a service_role internamente. Vendedor não pode chamar isto para si mesmo
// nem para outros (a mesma checagem de role='manager' barra ambos os casos).
//
// Requisito mínimo de senha (>=6 caracteres) é o MESMO já usado em
// create-seller — reflete supabase/config.toml (minimum_password_length=6,
// password_requirements=""), nenhuma política nova foi inventada aqui.
//
// Não grava a senha em nenhum lugar próprio, não loga o valor, não a expõe
// na resposta — só repassa para auth.admin.updateUserById e retorna sucesso.
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

interface ResetPasswordPayload {
  id?: string
  password?: string
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
    return jsonResponse({ error: 'Não foi possível alterar a senha. Tente novamente.' }, 500)
  }

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

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const { data: callerProfile, error: callerProfileError } = await adminClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', caller.id)
    .maybeSingle()

  if (callerProfileError || !callerProfile || callerProfile.role !== 'manager' || !callerProfile.is_active) {
    return jsonResponse({ error: 'Você não tem permissão para alterar a senha de vendedores.' }, 403)
  }

  let payload: ResetPasswordPayload
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Verifique os dados informados.' }, 400)
  }

  const targetId = payload.id?.trim() ?? ''
  const password = payload.password ?? ''

  if (!targetId || password.length < 6) {
    return jsonResponse({ error: 'Verifique os dados informados.' }, 400)
  }

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from('profiles')
    .select('id, role')
    .eq('id', targetId)
    .maybeSingle()

  if (targetProfileError || !targetProfile || targetProfile.role !== 'seller') {
    return jsonResponse({ error: 'Vendedor não encontrado.' }, 404)
  }

  const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(targetId, { password })

  if (authUpdateError) {
    return jsonResponse({ error: 'Não foi possível alterar a senha. Tente novamente.' }, 400)
  }

  return jsonResponse({ success: true }, 200)
})
