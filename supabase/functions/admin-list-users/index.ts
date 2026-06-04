import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'Missing Supabase environment variables' }, 500);
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

    const { data: profiles, error: profilesError } = await adminClient
      .from('users_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      return json({ error: profilesError.message }, 500);
    }

    const profilesById = new Map((profiles ?? []).map((profile) => [profile.id_user, profile]));
    const authUsers = await listAllAuthUsers(adminClient);

    const users = authUsers
      .filter((authUser) => {
        const role = authUser.app_metadata?.role;
        return role === 'admin' || role === 'admon' || role === 'athlete' || profilesById.has(authUser.id);
      })
      .map((authUser) => {
        const profile = profilesById.get(authUser.id) ?? {};
        const authRole = authUser.app_metadata?.role;
        const role = authRole === 'admin' || authRole === 'admon' || profile.role === 'admon'
          ? 'admon'
          : 'athlete';
        const metadataActive = authUser.app_metadata?.is_active;

        return {
          ...profile,
          id_user: authUser.id,
          email: authUser.email ?? '',
          role,
          is_active: profile.is_active ?? metadataActive ?? !authUser.banned_until,
          created_at: profile.created_at ?? authUser.created_at,
        };
      })
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    return json(users);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});

async function listAllAuthUsers(adminClient: ReturnType<typeof createClient>) {
  const users = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    users.push(...(data.users ?? []));
    if (!data.users || data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
