// =============================================================================
// Fase 23 — update-seller
//
// Edita nome e e-mail de um vendedor já existente. E-mail é um campo de
// auth.users, não de public.profiles — alterá-lo exige a Auth Admin API
// (service_role), pelo mesmo motivo documentado em create-seller (Fase 22).
// Esta function segue exatamente o mesmo padrão de autorização: valida o JWT
// do chamador, confirma que é gerente ativo (nunca confia em role enviada
// pelo frontend), só então usa a service_role internamente.
//
// FLUXO:
//   1. Valida o JWT do chamador (mesmo mecanismo de create-seller).
//   2. Lê o profile do CHAMADOR e confirma role='manager' + is_active.
//   3. Lê o profile do ALVO e confirma que existe e tem role='seller' — nunca
//      confia no id enviado sem checar (permitiria editar outro gerente).
//   4. Se o e-mail mudou: chama auth.admin.updateUserById (Auth), com
//      email_confirm:true (mesma decisão de create-seller — o projeto já
//      roda com enable_confirmations=false, então isso só evita reenviar um
//      fluxo de confirmação que não está configurado, não contorna nada).
//   5. Atualiza public.profiles (full_name + email) para manter Auth e
//      profile consistentes — só depois do Auth confirmar sucesso, nunca
//      antes (evita profile.email divergente se o Auth rejeitar).
//
// NUNCA toca em students/enrollments/sales/sale_installments/goals — só
// profiles.full_name/email e auth.users.email deste um vendedor.
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

interface UpdateSellerPayload {
  id?: string
  full_name?: string
  email?: string
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
    return jsonResponse({ error: 'Não foi possível atualizar o vendedor. Tente novamente.' }, 500)
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
    return jsonResponse({ error: 'Você não tem permissão para editar vendedores.' }, 403)
  }

  let payload: UpdateSellerPayload
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Verifique os dados informados.' }, 400)
  }

  const targetId = payload.id?.trim() ?? ''
  const fullName = payload.full_name?.trim() ?? ''
  const email = payload.email?.trim().toLowerCase() ?? ''

  if (!targetId || !fullName || !email || !isValidEmail(email)) {
    return jsonResponse({ error: 'Verifique os dados informados.' }, 400)
  }

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from('profiles')
    .select('id, role, email')
    .eq('id', targetId)
    .maybeSingle()

  if (targetProfileError || !targetProfile || targetProfile.role !== 'seller') {
    return jsonResponse({ error: 'Vendedor não encontrado.' }, 404)
  }

  const emailChanged = (targetProfile.email ?? '').trim().toLowerCase() !== email

  if (emailChanged) {
    // GoTrue devolve um erro genérico ("Error updating user") tanto para e-mail
    // duplicado quanto para qualquer outra falha de update — não dá para
    // diferenciar pelo texto da mensagem (confirmado testando contra o projeto
    // real). Em vez de tentar adivinhar, checamos duplicidade ANTES de chamar a
    // Admin API, usando profiles.email como espelho confiável de auth.users.email
    // (mantido em sincronia só por esta function e pelo trigger de criação —
    // nenhum outro caminho de código altera e-mail).
    const { data: emailOwner } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .neq('id', targetId)
      .maybeSingle()

    if (emailOwner) {
      return jsonResponse({ error: 'Já existe um usuário cadastrado com este e-mail.' }, 409)
    }

    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(targetId, {
      email,
      email_confirm: true,
    })

    if (authUpdateError) {
      return jsonResponse({ error: 'Não foi possível atualizar o e-mail. Tente novamente.' }, 400)
    }
  }

  const { error: profileUpdateError } = await adminClient
    .from('profiles')
    .update({ full_name: fullName, email })
    .eq('id', targetId)

  if (profileUpdateError) {
    return jsonResponse(
      { error: 'O e-mail foi atualizado, mas não foi possível salvar os demais dados. Tente novamente.' },
      500,
    )
  }

  return jsonResponse({ success: true }, 200)
})
