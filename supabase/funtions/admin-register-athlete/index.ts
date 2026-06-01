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

    // --- Auth: validate caller is active admin ---
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

    // --- Parse & validate body ---
    const body = await req.json()

    const required = [
      'email', 'password',
      'name', 'first_last_name', 'dni_type', 'dni', 'birth_date', 'sex',
      'phone', 'district_of_residence',
      'weekly_exercise', 'satisfaction_level', 'facility_satisfaction_level',
      'disciplines',
      'accepts_data_usage', 'accepts_info_accuracy',
    ]
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return jsonError(`Missing required field: ${field}`, 400)
      }
    }

    if (!body.accepts_data_usage || !body.accepts_info_accuracy) {
      return jsonError('accepts_data_usage and accepts_info_accuracy must be true', 400)
    }

    if (!Array.isArray(body.disciplines) || body.disciplines.length === 0) {
      return jsonError('disciplines must be a non-empty array', 400)
    }
    for (const d of body.disciplines) {
      if (!Number.isInteger(d?.id) || d.id <= 0) {
        return jsonError('Each discipline must have a positive integer id', 400)
      }
      if (typeof d.is_representative !== 'boolean') {
        return jsonError('Each discipline must have a boolean is_representative', 400)
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

    const validDistricts = ['san_pedro', 'sabanilla', 'mercedes', 'san_rafael', 'other']
    if (!validDistricts.includes(body.district_of_residence)) {
      return jsonError(`Invalid district_of_residence. Must be one of: ${validDistricts.join(', ')}`, 400)
    }

    const validSatisfaction = ['very_satisfied', 'satisfied', 'neutral', 'dissatisfied']
    if (!validSatisfaction.includes(body.satisfaction_level)) {
      return jsonError(`Invalid satisfaction_level. Must be one of: ${validSatisfaction.join(', ')}`, 400)
    }

    const validFacility = ['yes', 'no', 'partial']
    if (!validFacility.includes(body.facility_satisfaction_level)) {
      return jsonError(`Invalid facility_satisfaction_level. Must be one of: ${validFacility.join(', ')}`, 400)
    }

    const weekly = Number(body.weekly_exercise)
    if (!Number.isInteger(weekly) || weekly < 1 || weekly > 7) {
      return jsonError('weekly_exercise must be an integer between 1 and 7', 400)
    }

    if (body.has_previous_committee && !body.previous_committee_name) {
      return jsonError('previous_committee_name required when has_previous_committee is true', 400)
    }
    if (!body.has_previous_committee && body.previous_committee_name != null) {
      return jsonError('previous_committee_name must be null when has_previous_committee is false', 400)
    }

    if (body.is_club_member && !body.club_name) {
      return jsonError('club_name required when is_club_member is true', 400)
    }
    if (!body.is_club_member && body.club_name != null) {
      return jsonError('club_name must be null when is_club_member is false', 400)
    }

    if (body.has_disability) {
      if (!body.disability_type) return jsonError('disability_type required when has_disability is true', 400)
      if (!body.disability_description) return jsonError('disability_description required when has_disability is true', 400)
    }
    if (!body.has_disability && (body.disability_type != null || body.disability_description != null)) {
      return jsonError('disability_type and disability_description must be null when has_disability is false', 400)
    }
    if (body.disability_type != null && !['physical', 'cognitive'].includes(body.disability_type)) {
      return jsonError('Invalid disability_type. Must be physical or cognitive', 400)
    }

    if (body.has_functional_classification) {
      if (!body.classification_category) return jsonError('classification_category required when has_functional_classification is true', 400)
      if (!body.classification_document_url) return jsonError('classification_document_url required when has_functional_classification is true', 400)
    }
    if (!body.has_functional_classification && (body.classification_category != null || body.classification_document_url != null)) {
      return jsonError('classification_category and classification_document_url must be null when has_functional_classification is false', 400)
    }
    if (body.classification_category != null && !['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].includes(body.classification_category)) {
      return jsonError('Invalid classification_category. Must be one of: a1, a2, b1, b2, c1, c2', 400)
    }

    if (body.medals !== undefined && !Array.isArray(body.medals)) {
      return jsonError('medals must be an array', 400)
    }

    // Validate is_representative=true only sent for sport disciplines
    const disciplineIds = body.disciplines.map((d: { id: number }) => d.id)
    const { data: disciplineRows } = await supabaseAdmin
      .from('disciplines')
      .select('id_discipline, discipline_type')
      .in('id_discipline', disciplineIds)

    const typeMap = new Map((disciplineRows ?? []).map((r: { id_discipline: number; discipline_type: string }) => [r.id_discipline, r.discipline_type]))
    for (const d of body.disciplines) {
      if (!typeMap.has(d.id)) return jsonError(`Discipline id ${d.id} not found`, 400)
      if (d.is_representative && typeMap.get(d.id) !== 'sport') {
        return jsonError(`Discipline id ${d.id} is recreational — is_representative must be false`, 400)
      }
    }

    const medals: Array<{ competition_name: string; year: number; medal_type: string }> = body.medals ?? []
    const validMedalTypes = ['gold', 'silver', 'bronze']
    for (const medal of medals) {
      if (!medal.competition_name || !medal.year || !medal.medal_type) {
        return jsonError('Each medal must have competition_name, year, and medal_type', 400)
      }
      if (!validMedalTypes.includes(medal.medal_type)) {
        return jsonError(`Invalid medal_type: ${medal.medal_type}. Must be one of: gold, silver, bronze`, 400)
      }
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
      app_metadata: { role: 'athlete', is_active: true },
    })

    if (metaError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return jsonError(`Failed to set app_metadata: ${metaError.message}`, 500)
    }

    // --- Step 3: Run transactional RPC ---
    const { error: rpcError } = await supabaseAdmin.rpc('admin_register_athlete_transaction', {
      p_user_id: newUserId,
      p_admin_id: callerUser.id,
      p_email: body.email,
      // profile
      p_name: body.name,
      p_first_last_name: body.first_last_name,
      p_second_last_name: body.second_last_name ?? null,
      p_dni_type: body.dni_type,
      p_dni: body.dni,
      p_birth_date: body.birth_date,
      p_sex: body.sex,
      // athlete
      p_phone: body.phone,
      p_district_of_residence: body.district_of_residence,
      p_legal_guardian_name: body.legal_guardian_name ?? null,
      p_legal_guardian_phone: body.legal_guardian_phone ?? null,
      p_nacional_games_participation: body.nacional_games_participation ?? false,
      p_international_games_participation: body.international_games_participation ?? false,
      p_weekly_exercise: weekly,
      p_has_family_support: body.has_family_support ?? false,
      p_satisfaction_level: body.satisfaction_level,
      p_has_family_in_committee: body.has_family_in_committee ?? false,
      p_has_previous_committee: body.has_previous_committee ?? false,
      p_previous_committee_name: body.previous_committee_name ?? null,
      p_is_club_member: body.is_club_member ?? false,
      p_club_name: body.club_name ?? null,
      p_facility_satisfaction_level: body.facility_satisfaction_level,
      p_has_disability: body.has_disability ?? false,
      p_disability_type: body.disability_type ?? null,
      p_disability_description: body.disability_description ?? null,
      p_has_functional_classification: body.has_functional_classification ?? false,
      p_classification_category: body.classification_category ?? null,
      p_classification_document_url: body.classification_document_url ?? null,
      p_accepts_data_usage: body.accepts_data_usage,
      p_accepts_info_accuracy: body.accepts_info_accuracy,
      // disciplines: [{id, is_representative}]
      p_disciplines: body.disciplines,
      // medals
      p_medals: medals,
    })

    if (rpcError) {
      // Compensation: remove auth user so no orphan exists
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
