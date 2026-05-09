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

    const { emails, initial_role } = await req.json()

    if (!emails || !Array.isArray(emails) || emails.length === 0 || !initial_role) {
      return new Response(JSON.stringify({ error: 'Missing emails or initial_role' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!['athlete', 'coach', 'admin'].includes(initial_role)) {
      return new Response(JSON.stringify({ error: 'Invalid initial_role' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: { email: string; status: 'sent' | 'error'; reason?: string }[] = []

    for (const email of emails) {
      const { data: existing } = await supabaseAdmin
        .from('users_invitations')
        .select('id_invitation')
        .eq('email', email)
        .not('status', 'eq', 'cancelled')
        .maybeSingle()

      if (existing) {
        results.push({ email, status: 'error', reason: 'Invitation already exists' })
        continue
      }

      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { initial_role },
      })

      if (inviteError) {
        results.push({ email, status: 'error', reason: inviteError.message })
        continue
      }

      const now = new Date().toISOString()

      const { error: insertError } = await supabaseAdmin
        .from('users_invitations')
        .insert({
          email,
          status: 'sent',
          initial_role,
          last_sent_at: now,
          attempts: 1,
          fk_invited_by: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })

      if (insertError) {
        results.push({ email, status: 'error', reason: insertError.message })
        continue
      }

      results.push({ email, status: 'sent' })
    }

    const allFailed = results.every(r => r.status === 'error')

    return new Response(JSON.stringify({ results }), {
      status: allFailed ? 500 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
