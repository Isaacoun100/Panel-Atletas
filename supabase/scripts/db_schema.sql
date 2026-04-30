DO $$
BEGIN
  RAISE NOTICE 'Starting database setup...';
END $$;

-- =========================
-- ENUM TYPES
-- =========================

DO $$
BEGIN
  RAISE NOTICE 'Creating enum types...';

  CREATE TYPE public.gender AS ENUM (
    'male',
    'female',
    'prefer_not_to_say',
    'other'
  );

  CREATE TYPE public.user_role AS ENUM (
    'athlete',
    'coach',
    'admin'
  );

  CREATE TYPE public.education_level AS ENUM (
    'elementary_school',
    'high_school',
    'university',
    'technical_school',
    'not_studying'
  );

  CREATE TYPE public.participation_type AS ENUM (
    'sport',
    'recreational',
    'both'
  );

  CREATE TYPE public.medal_type AS ENUM (
    'gold',
    'silver',
    'bronze'
  );

  CREATE TYPE public.main_goal AS ENUM (
    'recreation',
    'health',
    'high_performance',
    'social'
  );

  CREATE TYPE public.family_support_level AS ENUM (
    'yes',
    'no',
    'partial'
  );

  CREATE TYPE public.satisfaction_level AS ENUM (
    'very_satisfied',
    'satisfied',
    'neutral',
    'dissatisfied'
  );

  CREATE TYPE public.medical_insurance_type AS ENUM (
    'ccss',
    'private',
    'none'
  );

  CREATE TYPE public.preferred_schedule AS ENUM (
    'morning',
    'afternoon',
    'night'
  );

  CREATE TYPE public.facility_condition AS ENUM (
    'yes',
    'no',
    'partial'
  );

  CREATE TYPE public.how_found_out AS ENUM (
    'social_media',
    'municipality',
    'educational_institution',
    'recommendation',
    'other'
  );

  CREATE TYPE public.contact_method AS ENUM (
    'whatsapp',
    'email',
    'phone_call'
  );

  CREATE TYPE public.invitation_status AS ENUM (
    'sent',
    'expired',
    'cancelled',
    'accepted'
  );

  RAISE NOTICE 'Enum types created successfully.';
END $$;

-- =========================
-- TABLES
-- =========================

DO $$
BEGIN
  RAISE NOTICE 'Creating dni_types table...';
END $$;

CREATE TABLE public.dni_types (
  id_dni_type SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE
);

DO $$
BEGIN
  RAISE NOTICE 'Creating users_profiles table...';
END $$;

CREATE TABLE public.users_profiles (
  id_user UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(64) NOT NULL,
  first_last_name VARCHAR(64) NOT NULL,
  second_last_name VARCHAR(64),
  dni VARCHAR(32) UNIQUE,
  fk_dni_type INTEGER REFERENCES public.dni_types(id_dni_type),
  birth_date DATE,
  gender public.gender,
  phone TEXT,
  email VARCHAR(128) UNIQUE,
  profile_image_url TEXT,
  role public.user_role NOT NULL DEFAULT 'athlete',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  RAISE NOTICE 'Creating cantons, districts, and addresses tables...';
END $$;

CREATE TABLE public.cantons (
  id_canton SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE
);

CREATE TABLE public.districts (
  id_district SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  fk_canton INTEGER NOT NULL REFERENCES public.cantons(id_canton),
  UNIQUE (name, fk_canton)
);

CREATE TABLE public.addresses (
  id_address SERIAL PRIMARY KEY,
  address TEXT NOT NULL,
  fk_district INTEGER NOT NULL REFERENCES public.districts(id_district),
  fk_residence_canton INTEGER REFERENCES public.cantons(id_canton),
  is_permanent_canton_resident BOOLEAN NOT NULL DEFAULT TRUE,

  CONSTRAINT residence_canton_consistency CHECK (
    (is_permanent_canton_resident = TRUE AND fk_residence_canton = 1)
    OR
    (is_permanent_canton_resident = FALSE AND fk_residence_canton IS NOT NULL)
  )
);

DO $$
BEGIN
  RAISE NOTICE 'Creating disciplines table...';
END $$;

CREATE TABLE public.disciplines (
  id_discipline SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE
);

DO $$
BEGIN
  RAISE NOTICE 'Creating athletes table...';
END $$;

CREATE TABLE public.athletes (
  id_user UUID PRIMARY KEY REFERENCES public.users_profiles(id_user) ON DELETE CASCADE,
  fk_address INTEGER REFERENCES public.addresses(id_address),

  education_level public.education_level,
  educational_institution_name VARCHAR(64),

  is_employed BOOLEAN NOT NULL DEFAULT FALSE,
  occupation VARCHAR(64),

  nacional_games_participation BOOLEAN NOT NULL DEFAULT FALSE,
  regional_games_participation BOOLEAN NOT NULL DEFAULT FALSE,
  internation_games_participation BOOLEAN NOT NULL DEFAULT FALSE,

  has_won_medal BOOLEAN NOT NULL DEFAULT FALSE,
  medal_type public.medal_type,
  medal_discipline_name VARCHAR(64),
  medal_year INTEGER,
  medal_competence_name VARCHAR(128),

  main_goal public.main_goal,
  activity_frequency_per_week INTEGER CHECK (activity_frequency_per_week >= 0),

  has_dropped_sports_programs BOOLEAN NOT NULL DEFAULT FALSE,
  dropout_reason TEXT,

  family_support_level public.family_support_level,
  satisfaction_level public.satisfaction_level,

  has_medical_condition BOOLEAN NOT NULL DEFAULT FALSE,
  medical_condition_details TEXT,

  has_allergies BOOLEAN NOT NULL DEFAULT FALSE,
  allergies_details TEXT,

  has_mental_health_condition BOOLEAN NOT NULL DEFAULT FALSE,
  mental_health_condition_details TEXT,

  requires_adaptation BOOLEAN NOT NULL DEFAULT FALSE,
  adaptation_details TEXT,

  medical_insurance_type public.medical_insurance_type,

  guardian_full_name VARCHAR(128),
  guardian_phone VARCHAR(32),

  has_committee_relatives BOOLEAN NOT NULL DEFAULT FALSE,
  relative_full_name VARCHAR(128),
  relative_relationship VARCHAR(64),
  relative_discipline_name VARCHAR(64),

  has_previous_committee BOOLEAN NOT NULL DEFAULT FALSE,
  previous_committee_name VARCHAR(128),
  previous_committee_period VARCHAR(64),

  belongs_to_club BOOLEAN NOT NULL DEFAULT FALSE,
  club_name VARCHAR(128),

  fk_desired_discipline INTEGER REFERENCES public.disciplines(id_discipline),
  preferred_schedule public.preferred_schedule,
  facilities_used TEXT,
  facilities_condition public.facility_condition,
  improvement_suggestions TEXT,

  has_physical_limitation BOOLEAN NOT NULL DEFAULT FALSE,
  requires_transport BOOLEAN NOT NULL DEFAULT FALSE,
  has_equipment BOOLEAN NOT NULL DEFAULT FALSE,

  how_found_out public.how_found_out,
  wants_information BOOLEAN NOT NULL DEFAULT TRUE,
  preferred_contact_method public.contact_method,

  data_usage_consent BOOLEAN NOT NULL DEFAULT FALSE,
  image_usage_consent BOOLEAN NOT NULL DEFAULT FALSE,
  signed_full_name VARCHAR(128),
  signed_at TIMESTAMPTZ,

  additional_details TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT employment_consistency CHECK (
    (is_employed = FALSE AND occupation IS NULL)
    OR
    (is_employed = TRUE AND occupation IS NOT NULL)
  ),

  CONSTRAINT medal_consistency CHECK (
    (
      has_won_medal = FALSE
      AND medal_type IS NULL
      AND medal_discipline_name IS NULL
      AND medal_year IS NULL
      AND medal_competence_name IS NULL
    )
    OR
    (
      has_won_medal = TRUE
      AND medal_type IS NOT NULL
      AND medal_discipline_name IS NOT NULL
      AND medal_year IS NOT NULL
      AND medal_competence_name IS NOT NULL
    )
  ),

  CONSTRAINT dropout_consistency CHECK (
    (has_dropped_sports_programs = FALSE AND dropout_reason IS NULL)
    OR
    (has_dropped_sports_programs = TRUE AND dropout_reason IS NOT NULL)
  ),

  CONSTRAINT medical_condition_consistency CHECK (
    (has_medical_condition = FALSE AND medical_condition_details IS NULL)
    OR
    (has_medical_condition = TRUE AND medical_condition_details IS NOT NULL)
  ),

  CONSTRAINT allergies_consistency CHECK (
    (has_allergies = FALSE AND allergies_details IS NULL)
    OR
    (has_allergies = TRUE AND allergies_details IS NOT NULL)
  ),

  CONSTRAINT mental_health_condition_consistency CHECK (
    (has_mental_health_condition = FALSE AND mental_health_condition_details IS NULL)
    OR
    (has_mental_health_condition = TRUE AND mental_health_condition_details IS NOT NULL)
  ),

  CONSTRAINT adaptation_consistency CHECK (
    (requires_adaptation = FALSE AND adaptation_details IS NULL)
    OR
    (requires_adaptation = TRUE AND adaptation_details IS NOT NULL)
  ),

  CONSTRAINT committee_relatives_consistency CHECK (
    (
      has_committee_relatives = FALSE
      AND relative_full_name IS NULL
      AND relative_relationship IS NULL
      AND relative_discipline_name IS NULL
    )
    OR
    (
      has_committee_relatives = TRUE
      AND relative_full_name IS NOT NULL
      AND relative_relationship IS NOT NULL
      AND relative_discipline_name IS NOT NULL
    )
  ),

  CONSTRAINT previous_committee_consistency CHECK (
    (
      has_previous_committee = FALSE
      AND previous_committee_name IS NULL
      AND previous_committee_period IS NULL
    )
    OR
    (
      has_previous_committee = TRUE
      AND previous_committee_name IS NOT NULL
      AND previous_committee_period IS NOT NULL
    )
  ),

  CONSTRAINT club_consistency CHECK (
    (belongs_to_club = FALSE AND club_name IS NULL)
    OR
    (belongs_to_club = TRUE AND club_name IS NOT NULL)
  )
);

DO $$
BEGIN
  RAISE NOTICE 'Creating users_disciplines table...';
END $$;

CREATE TABLE public.users_disciplines (
  id_user_discipline SERIAL PRIMARY KEY,
  fk_user UUID NOT NULL REFERENCES public.users_profiles(id_user) ON DELETE CASCADE,
  fk_discipline INTEGER NOT NULL REFERENCES public.disciplines(id_discipline),
  functional_category VARCHAR(64),
  participation_type public.participation_type NOT NULL,
  is_representative BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (fk_user, fk_discipline)
);

DO $$
BEGIN
  RAISE NOTICE 'Creating notification tables...';
END $$;

CREATE TABLE public.notification_templates (
  id_template SERIAL PRIMARY KEY,
  type VARCHAR(64) NOT NULL,
  name VARCHAR(64) NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications_logs (
  id_notification SERIAL PRIMARY KEY,
  type VARCHAR(64) NOT NULL,
  sent BOOLEAN NOT NULL DEFAULT FALSE,
  error TEXT,
  fk_template INTEGER REFERENCES public.notification_templates(id_template),
  fk_user UUID REFERENCES public.users_profiles(id_user) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  RAISE NOTICE 'Creating users_invitations table...';
END $$;

CREATE TABLE public.users_invitations (
  id_invitation UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(128) NOT NULL,
  status public.invitation_status NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  initial_role public.user_role NOT NULL DEFAULT 'athlete',
  fk_invited_by UUID REFERENCES public.users_profiles(id_user) ON DELETE SET NULL
);

-- =========================
-- HELPER FUNCTION FOR RLS
-- =========================

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS helper function is_admin...';
END $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users_profiles
    WHERE id_user = auth.uid()
      AND role = 'admin'
      AND is_active = TRUE
  );
$$;

-- =========================
-- ENABLE RLS
-- =========================

DO $$
BEGIN
  RAISE NOTICE 'Enabling RLS on application tables...';
END $$;

ALTER TABLE public.dni_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cantons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_invitations ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS POLICIES
-- =========================

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies for dni_types...';
END $$;

CREATE POLICY "Authenticated users can read dni types"
ON public.dni_types
FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Admins can manage dni types"
ON public.dni_types
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies for users_profiles...';
END $$;

CREATE POLICY "Users can read their own profile"
ON public.users_profiles
FOR SELECT
TO authenticated
USING (id_user = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.users_profiles
FOR UPDATE
TO authenticated
USING (id_user = auth.uid())
WITH CHECK (id_user = auth.uid());

CREATE POLICY "Admins can read all profiles"
ON public.users_profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
ON public.users_profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users can insert their own profile"
ON public.users_profiles
FOR INSERT
TO authenticated
WITH CHECK (id_user = auth.uid());

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies for catalog tables...';
END $$;

CREATE POLICY "Authenticated users can read cantons"
ON public.cantons
FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Admins can manage cantons"
ON public.cantons
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can read districts"
ON public.districts
FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Admins can manage districts"
ON public.districts
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can read disciplines"
ON public.disciplines
FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Admins can manage disciplines"
ON public.disciplines
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies for addresses...';
END $$;

CREATE POLICY "Users can read their own address"
ON public.addresses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.athletes a
    WHERE a.fk_address = addresses.id_address
      AND a.id_user = auth.uid()
  )
);

CREATE POLICY "Admins can read all addresses"
ON public.addresses
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Authenticated users can create addresses"
ON public.addresses
FOR INSERT
TO authenticated
WITH CHECK (TRUE);

CREATE POLICY "Users can update their own address"
ON public.addresses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.athletes a
    WHERE a.fk_address = addresses.id_address
      AND a.id_user = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.athletes a
    WHERE a.fk_address = addresses.id_address
      AND a.id_user = auth.uid()
  )
);

CREATE POLICY "Admins can manage all addresses"
ON public.addresses
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies for athletes...';
END $$;

CREATE POLICY "Athletes can read their own athlete record"
ON public.athletes
FOR SELECT
TO authenticated
USING (id_user = auth.uid());

CREATE POLICY "Athletes can insert their own athlete record"
ON public.athletes
FOR INSERT
TO authenticated
WITH CHECK (id_user = auth.uid());

CREATE POLICY "Athletes can update their own athlete record"
ON public.athletes
FOR UPDATE
TO authenticated
USING (id_user = auth.uid())
WITH CHECK (id_user = auth.uid());

CREATE POLICY "Admins can manage all athlete records"
ON public.athletes
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies for users_disciplines...';
END $$;

CREATE POLICY "Users can read their own disciplines"
ON public.users_disciplines
FOR SELECT
TO authenticated
USING (fk_user = auth.uid());

CREATE POLICY "Users can insert their own disciplines"
ON public.users_disciplines
FOR INSERT
TO authenticated
WITH CHECK (fk_user = auth.uid());

CREATE POLICY "Users can update their own disciplines"
ON public.users_disciplines
FOR UPDATE
TO authenticated
USING (fk_user = auth.uid())
WITH CHECK (fk_user = auth.uid());

CREATE POLICY "Users can delete their own disciplines"
ON public.users_disciplines
FOR DELETE
TO authenticated
USING (fk_user = auth.uid());

CREATE POLICY "Admins can manage all user disciplines"
ON public.users_disciplines
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies for notification templates...';
END $$;

CREATE POLICY "Admins can manage notification templates"
ON public.notification_templates
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies for notification logs...';
END $$;

CREATE POLICY "Admins can manage notification logs"
ON public.notifications_logs
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies for users_invitations...';
END $$;

CREATE POLICY "Admins can read invitations"
ON public.users_invitations
FOR SELECT
TO authenticated
USING (public.is_admin());

-- =========================
-- INDEXES
-- =========================

DO $$
BEGIN
  RAISE NOTICE 'Creating indexes...';
END $$;

CREATE INDEX idx_users_profiles_role ON public.users_profiles(role);
CREATE INDEX idx_athletes_address ON public.athletes(fk_address);
CREATE INDEX idx_users_disciplines_user ON public.users_disciplines(fk_user);
CREATE INDEX idx_users_disciplines_discipline ON public.users_disciplines(fk_discipline);
CREATE INDEX idx_notifications_logs_user ON public.notifications_logs(fk_user);
CREATE INDEX idx_users_invitations_email ON public.users_invitations(email);
CREATE INDEX idx_users_invitations_status ON public.users_invitations(status);

DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully.';
END $$;
