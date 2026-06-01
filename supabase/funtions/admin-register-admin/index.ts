import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      secretKeys['default'],
    )

    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !callerUser) {
      return jsonError('Unauthorized', 401)
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('users_profiles')
      .select('role, is_active')
      .eq('id_user', callerUser.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_active) {
      return jsonError('Forbidden', 403)
    }

    const body = await req.json()

    const required = ['email', 'password', 'name', 'first_last_name', 'dni_type', 'dni', 'birth_date', 'sex']
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return jsonError(`Missing required field: ${field}`, 400)
      }
    }

    const validDniTypes = ['cedula', 'dimex', 'pasaporte']
    if (!validDniTypes.includes(body.dni_type)) {
      return jsonError(`Invalid dni_type. Must be one of: ${validDniTypes.join(', ')}`, 400)
    }

    const validSex = ['male', 'female']
    if (!validSex.includes(body.sex)) {
      return jsonError(`Invalid sex. Must be one of: ${validSex.join(', ')}`, 400)
    }

    // --- Step 1: Create auth user ---
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    })

    if (createError || !createData.user) {
      return jsonError(`Failed to create auth user: ${createError?.message ?? 'unknown error'}`, 500)
    }

    const newUserId = createData.user.id

    // --- Step 2: Set app_metadata ---
    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(newUserId, {
      app_metadata: { role: 'admin', is_active: true },
    })

    if (metaError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return jsonError(`Failed to set app_metadata: ${metaError.message}`, 500)
    }

    // --- Step 3: Run transactional RPC ---
    const { error: rpcError } = await supabaseAdmin.rpc('admin_register_admin_transaction', {
      p_user_id: newUserId,
      p_admin_id: callerUser.id,
      p_email: body.email,
      p_name: body.name,
      p_first_last_name: body.first_last_name,
      p_second_last_name: body.second_last_name ?? null,
      p_dni_type: body.dni_type,
      p_dni: body.dni,
      p_birth_date: body.birth_date,
      p_sex: body.sex,
    })

    if (rpcError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return jsonError(`Transaction failed: ${rpcError.message}`, 500)
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUserId, email: body.email }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
