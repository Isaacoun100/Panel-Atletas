import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await supabaseAdmin
      .from('users_profiles')
      .select('role, is_active')
      .eq('id_user', user.id)
      .single()

    if (!profile || profile.role !== 'admin' || !profile.is_active) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from('users_invitations')
      .select('id_invitation, initial_role, status, attempts')
      .eq('email', email)
      .not('status', 'eq', 'accepted')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError || !invitation) {
      return new Response(JSON.stringify({ error: 'No resendable invitation found for this email' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { initial_role: invitation.initial_role },
    })

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const now = new Date().toISOString()

    await supabaseAdmin
      .from('users_invitations')
      .update({
        status: 'sent',
        last_sent_at: now,
        attempts: invitation.attempts + 1,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: now,
      })
      .eq('id_invitation', invitation.id_invitation)

    return new Response(JSON.stringify({ success: true, email, attempts: invitation.attempts + 1 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
