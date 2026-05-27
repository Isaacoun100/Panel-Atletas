import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
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

    // Query params
    const url = new URL(req.url)
    const activityLimit = Math.min(parseInt(url.searchParams.get('activity_limit') ?? '5'), 50)
    const activityOffset = Math.max(parseInt(url.searchParams.get('activity_offset') ?? '0'), 0)
    const activityOrder = url.searchParams.get('activity_order') === 'asc' ? true : false
    const athletesLimit = Math.min(parseInt(url.searchParams.get('athletes_limit') ?? '5'), 50)
    const athletesOffset = Math.max(parseInt(url.searchParams.get('athletes_offset') ?? '0'), 0)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // All queries in parallel
    const [
      { count: totalAthletes },
      { count: thisMonthAthletes },
      { count: activeDisciplines },
      { count: pendingInvitations },
      { count: inactiveAthletes },
      { data: recentAthletes, count: athletesTotal },
      { data: activity, count: activityTotal },
    ] = await Promise.all([
      supabaseAdmin
        .from('users_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'athlete'),

      supabaseAdmin
        .from('users_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'athlete')
        .gte('created_at', monthStart),

      supabaseAdmin
        .from('disciplines')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),

      supabaseAdmin
        .from('users_invitations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['sent', 'expired']),

      supabaseAdmin
        .from('users_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'athlete')
        .eq('is_active', false),

      supabaseAdmin
        .from('users_profiles')
        .select('id_user, name, first_last_name, is_active, created_at', { count: 'exact' })
        .eq('role', 'athlete')
        .order('created_at', { ascending: false })
        .range(athletesOffset, athletesOffset + athletesLimit - 1),

      supabaseAdmin
        .from('audit_log')
        .select('id_audit_log, action, actor_id, metadata, created_at', { count: 'exact' })
        .order('created_at', { ascending: activityOrder })
        .range(activityOffset, activityOffset + activityLimit - 1),
    ])

    return new Response(
      JSON.stringify({
        stats: {
          totalAthletes: totalAthletes ?? 0,
          thisMonthAthletes: thisMonthAthletes ?? 0,
          activeDisciplines: activeDisciplines ?? 0,
          pendingInvitations: pendingInvitations ?? 0,
          inactiveAthletes: inactiveAthletes ?? 0,
        },
        recentAthletes: {
          data: recentAthletes ?? [],
          total: athletesTotal ?? 0,
          limit: athletesLimit,
          offset: athletesOffset,
        },
        activity: {
          data: activity ?? [],
          total: activityTotal ?? 0,
          limit: activityLimit,
          offset: activityOffset,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
