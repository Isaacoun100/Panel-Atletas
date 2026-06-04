import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'Missing Supabase environment variables' }, 500);
    }

    const { user_id, is_active } = await req.json();
    if (typeof user_id !== 'string' || typeof is_active !== 'boolean') {
      return json({ error: 'user_id and is_active are required' }, 400);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await userClient.auth.getUser();

    if (callerError || !caller) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from('users_profiles')
      .select('role,is_active')
      .eq('id_user', caller.id)
      .maybeSingle();

    const callerIsAdmin =
      caller.app_metadata?.role === 'admin' ||
      caller.app_metadata?.role === 'admon' ||
      callerProfile?.role === 'admon';

    if (callerProfileError || !callerIsAdmin || callerProfile?.is_active === false) {
      return json({ error: 'Forbidden' }, 403);
    }

    const { data: targetUser, error: targetUserError } = await adminClient.auth.admin.getUserById(user_id);
    if (targetUserError || !targetUser.user) {
      return json({ error: targetUserError?.message ?? 'User not found' }, 404);
    }

    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(user_id, {
      app_metadata: {
        ...targetUser.user.app_metadata,
        is_active,
      },
      ban_duration: is_active ? 'none' : '876000h',
    });

    if (authUpdateError) {
      return json({ error: authUpdateError.message }, 500);
    }

    const { error: profileUpdateError } = await adminClient
      .from('users_profiles')
      .update({ is_active })
      .eq('id_user', user_id);

    if (profileUpdateError) {
      return json({ error: profileUpdateError.message }, 500);
    }

    return json({ user_id, is_active });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
