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

  CREATE TYPE public.sex AS ENUM (
    'male',
    'female'
  );

  CREATE TYPE public.user_role AS ENUM (
    'athlete',
    'admin'
  );

  CREATE TYPE public.dni_type AS ENUM (
    'cedula',
    'dimex',
    'pasaporte'
  );

  CREATE TYPE public.district AS ENUM (
    'san_pedro',
    'sabanilla',
    'mercedes',
    'san_rafael',
    'other'
  );

  CREATE TYPE public.participation_type AS ENUM (
    'sport',
    'recreational'
  );

  CREATE TYPE public.medal_type AS ENUM (
    'gold',
    'silver',
    'bronze'
  );

  CREATE TYPE public.satisfaction_level AS ENUM (
    'very_satisfied',
    'satisfied',
    'neutral',
    'dissatisfied'
  );

  CREATE TYPE public.facility_condition AS ENUM (
    'yes',
    'no',
    'partial'
  );

  CREATE TYPE public.disability_type AS ENUM (
    'physical',
    'cognitive'
  );

  CREATE TYPE public.classification_category AS ENUM (
    'a1',
    'a2',
    'b1',
    'b2',
    'c1',
    'c2'
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
  RAISE NOTICE 'Creating users_profiles table...';
END $$;

CREATE TABLE public.users_profiles (
  id_user           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name              VARCHAR(64) NOT NULL,
  first_last_name   VARCHAR(64) NOT NULL,
  second_last_name  VARCHAR(64) NOT NULL,
  dni_type          public.dni_type NOT NULL,
  dni               VARCHAR(32) NOT NULL UNIQUE,
  birth_date        DATE NOT NULL,
  sex               public.sex NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  profile_image_url TEXT,
  role              public.user_role NOT NULL DEFAULT 'athlete',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  RAISE NOTICE 'Creating disciplines table...';
END $$;

CREATE TABLE public.disciplines (
  id_discipline    SERIAL PRIMARY KEY,
  name             VARCHAR(64) NOT NULL,
  discipline_type  public.participation_type NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE
);

DO $$
BEGIN
  RAISE NOTICE 'Creating users_disciplines table...';
END $$;

CREATE TABLE public.users_disciplines (
  id_user_discipline SERIAL PRIMARY KEY,
  fk_user            UUID NOT NULL REFERENCES public.users_profiles(id_user) ON DELETE CASCADE,
  fk_discipline      INTEGER NOT NULL REFERENCES public.disciplines(id_discipline) ON DELETE NO ACTION,
  is_representative  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (fk_user, fk_discipline),

  CONSTRAINT representative_sport_only CHECK (
    is_representative = FALSE
    OR participation_type = 'sport'
  )
);

DO $$
BEGIN
  RAISE NOTICE 'Creating athletes table...';
END $$;

CREATE TABLE public.athletes (
  id_user                    UUID PRIMARY KEY REFERENCES public.users_profiles(id_user) ON DELETE CASCADE,

  phone                      VARCHAR(64) NOT NULL,
  district_of_residence      public.district NOT NULL,

  legal_guardian_name        VARCHAR(64),
  legal_guardian_phone       VARCHAR(64),

  nacional_games_participation      BOOLEAN NOT NULL DEFAULT FALSE,
  international_games_participation BOOLEAN NOT NULL DEFAULT FALSE,

  weekly_exercise            SMALLINT NOT NULL CHECK (weekly_exercise >= 1 AND weekly_exercise <= 7),

  has_family_support         BOOLEAN NOT NULL DEFAULT FALSE,
  satisfaction_level         public.satisfaction_level NOT NULL,

  has_family_in_committee    BOOLEAN NOT NULL DEFAULT FALSE,

  has_previous_committee     BOOLEAN NOT NULL DEFAULT FALSE,
  previous_committee_name    VARCHAR(64),

  is_club_member             BOOLEAN NOT NULL DEFAULT FALSE,
  club_name                  VARCHAR(64),

  facility_satisfaction_level public.facility_condition NOT NULL,

  has_disability             BOOLEAN NOT NULL DEFAULT FALSE,
  disability_type            public.disability_type,
  disability_description     VARCHAR(64),

  has_functional_classification BOOLEAN NOT NULL DEFAULT FALSE,
  classification_category    public.classification_category,
  classification_document_url TEXT,

  accepts_data_usage         BOOLEAN NOT NULL DEFAULT FALSE,
  accepts_info_accuracy      BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT previous_committee_consistency CHECK (
    (has_previous_committee = FALSE AND previous_committee_name IS NULL)
    OR
    (has_previous_committee = TRUE AND previous_committee_name IS NOT NULL)
  ),

  CONSTRAINT club_consistency CHECK (
    (is_club_member = FALSE AND club_name IS NULL)
    OR
    (is_club_member = TRUE AND club_name IS NOT NULL)
  ),

  CONSTRAINT disability_consistency CHECK (
    (has_disability = FALSE AND disability_type IS NULL AND disability_description IS NULL)
    OR
    (has_disability = TRUE AND disability_type IS NOT NULL AND disability_description IS NOT NULL)
  ),

  CONSTRAINT functional_classification_consistency CHECK (
    (has_functional_classification = FALSE AND classification_category IS NULL AND classification_document_url IS NULL)
    OR
    (has_functional_classification = TRUE AND classification_category IS NOT NULL AND classification_document_url IS NOT NULL)
  ),

  CONSTRAINT consent_required CHECK (
    accepts_data_usage = TRUE AND accepts_info_accuracy = TRUE
  )
);

DO $$
BEGIN
  RAISE NOTICE 'Creating medals table...';
END $$;

CREATE TABLE public.medals (
  id_medal         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_name VARCHAR(64) NOT NULL,
  year             SMALLINT NOT NULL,
  medal_type       public.medal_type NOT NULL,
  id_user          UUID NOT NULL REFERENCES public.users_profiles(id_user) ON DELETE CASCADE
);

DO $$
BEGIN
  RAISE NOTICE 'Creating users_invitations table...';
END $$;

CREATE TABLE public.users_invitations (
  id_invitation UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(128) NOT NULL,
  status        public.invitation_status NOT NULL DEFAULT 'sent',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sent_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,
  attempts      INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  initial_role  public.user_role NOT NULL DEFAULT 'athlete',
  fk_invited_by UUID REFERENCES public.users_profiles(id_user) ON DELETE SET NULL,
  message       TEXT
);

-- =========================
-- TRIGGERS & FUNCTIONS
-- =========================

DO $$
BEGIN
  RAISE NOTICE 'Creating audit_log table...';
END $$;

CREATE TABLE public.audit_log (
  id_audit_log  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  action      TEXT NOT NULL,
  actor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name  TEXT,
  record_id   TEXT,
  metadata    JSONB
);

-- =========================
-- TRIGGERS & FUNCTIONS
-- =========================

DO $$
BEGIN
  RAISE NOTICE 'Creating triggers...';
END $$;

-- Marks invitation as accepted when user confirms email via magic link.
-- Runs on auth.users — not visible in Supabase dashboard triggers UI.
CREATE OR REPLACE FUNCTION public.handle_invitation_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users_invitations
    SET status = 'accepted', updated_at = now()
    WHERE email = NEW.email
      AND status IN ('sent', 'expired');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_user_email_confirmed
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_invitation_accepted();

-- Deletes invitation record when auth user is deleted.
-- Runs on auth.users — not visible in Supabase dashboard triggers UI.
CREATE OR REPLACE FUNCTION public.handle_delete_invitation_on_user_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.users_invitations WHERE email = OLD.email;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE TRIGGER delete_invitation_on_user_delete
AFTER DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_delete_invitation_on_user_delete();

-- Injects id_user from JWT — client does not send id_user in body.
CREATE OR REPLACE FUNCTION public.handle_profile_id_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.id_user := auth.uid();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_profile_id_from_auth
BEFORE INSERT ON public.users_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_id_from_auth();

-- Sets role from accepted invitation. Defaults to athlete if no invitation found.
CREATE OR REPLACE FUNCTION public.handle_profile_role_from_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_role  public.user_role;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id_user;

  SELECT initial_role INTO v_role
  FROM public.users_invitations
  WHERE email = v_email
    AND status = 'accepted'
  ORDER BY created_at DESC
  LIMIT 1;

  NEW.role := COALESCE(v_role, 'athlete');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_profile_role_from_invitation
BEFORE INSERT ON public.users_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_role_from_invitation();

-- Injects id_user from JWT — client does not send id_user in body.
CREATE OR REPLACE FUNCTION public.handle_athlete_id_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.id_user := auth.uid();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_athlete_id_from_auth
BEFORE INSERT ON public.athletes
FOR EACH ROW
EXECUTE FUNCTION public.handle_athlete_id_from_auth();

-- Injects fk_user from JWT — client does not send fk_user in body.
CREATE OR REPLACE FUNCTION public.handle_discipline_user_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.fk_user := auth.uid();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_discipline_user_from_auth
BEFORE INSERT ON public.users_disciplines
FOR EACH ROW
EXECUTE FUNCTION public.handle_discipline_user_from_auth();

CREATE OR REPLACE FUNCTION public.handle_discipline_representative_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type public.participation_type;
BEGIN
  SELECT discipline_type INTO v_type
  FROM public.disciplines
  WHERE id_discipline = NEW.fk_discipline;

  IF v_type = 'recreational' AND NEW.is_representative = TRUE THEN
    RAISE EXCEPTION 'is_representative can only be true for sport disciplines.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_discipline_representative_check() FROM PUBLIC;

CREATE OR REPLACE TRIGGER set_representative_from_discipline
BEFORE INSERT OR UPDATE ON public.users_disciplines
FOR EACH ROW EXECUTE FUNCTION public.handle_discipline_representative_check();

-- Blocks enrollment in inactive disciplines.
CREATE OR REPLACE FUNCTION public.handle_discipline_active_check()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active BOOLEAN;
BEGIN
  SELECT is_active INTO v_active
  FROM public.disciplines
  WHERE id_discipline = NEW.fk_discipline;

  IF v_active IS FALSE THEN
    RAISE EXCEPTION 'Cannot enroll in an inactive discipline.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_discipline_active_check() FROM PUBLIC;

CREATE OR REPLACE TRIGGER discipline_active_check
BEFORE INSERT ON public.users_disciplines
FOR EACH ROW EXECUTE FUNCTION public.handle_discipline_active_check();

-- Enforces guardian fields only for athletes under 18.
-- Cross-table check (birth_date in users_profiles, guardian fields in athletes).
CREATE OR REPLACE FUNCTION public.handle_guardian_minor_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_birth_date DATE;
  v_is_minor   BOOLEAN;
BEGIN
  SELECT birth_date INTO v_birth_date
  FROM public.users_profiles
  WHERE id_user = NEW.id_user;

  v_is_minor := v_birth_date > (CURRENT_DATE - INTERVAL '18 years');

  IF v_is_minor = FALSE AND (NEW.legal_guardian_name IS NOT NULL OR NEW.legal_guardian_phone IS NOT NULL) THEN
    RAISE EXCEPTION 'Guardian information is only allowed for athletes under 18.';
  END IF;

  IF v_is_minor = TRUE AND (NEW.legal_guardian_name IS NULL OR NEW.legal_guardian_phone IS NULL) THEN
    RAISE EXCEPTION 'Guardian name and phone are required for athletes under 18.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER check_guardian_minor
BEFORE INSERT OR UPDATE ON public.athletes
FOR EACH ROW
EXECUTE FUNCTION public.handle_guardian_minor_check();

-- Logs new user registrations to audit_log.
CREATE OR REPLACE FUNCTION public.handle_audit_user_registered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (action, actor_id, table_name, record_id, metadata)
  VALUES (
    'user_registered',
    NEW.id_user,
    'users_profiles',
    NEW.id_user::TEXT,
    jsonb_build_object('name', NEW.name, 'first_last_name', NEW.first_last_name, 'role', NEW.role)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER audit_user_registered
AFTER INSERT ON public.users_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_user_registered();

-- Logs invitation sent and accepted events to audit_log.
CREATE OR REPLACE FUNCTION public.handle_audit_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (action, actor_id, table_name, record_id, metadata)
    VALUES (
      'invite_sent',
      NEW.fk_invited_by,
      'users_invitations',
      NEW.id_invitation::TEXT,
      jsonb_build_object('email', NEW.email, 'role', NEW.initial_role)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    INSERT INTO public.audit_log (action, actor_id, table_name, record_id, metadata)
    VALUES (
      'invite_accepted',
      NULL,
      'users_invitations',
      NEW.id_invitation::TEXT,
      jsonb_build_object('email', NEW.email, 'role', NEW.initial_role)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER audit_invitation
AFTER INSERT OR UPDATE ON public.users_invitations
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_invitation();

-- Logs profile updates, activations, and deactivations to audit_log.
CREATE OR REPLACE FUNCTION public.handle_audit_profile_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
    INSERT INTO public.audit_log (action, actor_id, table_name, record_id, metadata)
    VALUES (
      'user_deactivated',
      auth.uid(),
      'users_profiles',
      NEW.id_user::TEXT,
      jsonb_build_object('name', NEW.name, 'first_last_name', NEW.first_last_name, 'role', NEW.role)
    );
  ELSIF OLD.is_active = FALSE AND NEW.is_active = TRUE THEN
    INSERT INTO public.audit_log (action, actor_id, table_name, record_id, metadata)
    VALUES (
      'user_activated',
      auth.uid(),
      'users_profiles',
      NEW.id_user::TEXT,
      jsonb_build_object('name', NEW.name, 'first_last_name', NEW.first_last_name, 'role', NEW.role)
    );
  ELSIF (OLD.name != NEW.name OR OLD.first_last_name != NEW.first_last_name OR OLD.second_last_name != NEW.second_last_name) THEN
    INSERT INTO public.audit_log (action, actor_id, table_name, record_id, metadata)
    VALUES (
      'profile_updated',
      auth.uid(),
      'users_profiles',
      NEW.id_user::TEXT,
      jsonb_build_object('name', NEW.name, 'first_last_name', NEW.first_last_name, 'role', NEW.role)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER audit_profile_updated
AFTER UPDATE ON public.users_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_profile_updated();

-- Logs new discipline creation to audit_log.
CREATE OR REPLACE FUNCTION public.handle_audit_discipline_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (action, actor_id, table_name, record_id, metadata)
  VALUES (
    'discipline_created',
    auth.uid(),
    'disciplines',
    NEW.id_discipline::TEXT,
    jsonb_build_object('name', NEW.name, 'discipline_type', NEW.discipline_type)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER audit_discipline_created
AFTER INSERT ON public.disciplines
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_discipline_created();

-- Prevents deleting or demoting the last active admin.
CREATE OR REPLACE FUNCTION public.handle_last_admin_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_count INTEGER;
BEGIN
  IF OLD.role = 'admin' AND OLD.is_active = TRUE THEN
    IF TG_OP = 'DELETE' OR NEW.role != 'admin' OR NEW.is_active = FALSE THEN
      SELECT COUNT(*) INTO v_admin_count
      FROM public.users_profiles
      WHERE role = 'admin'
        AND is_active = TRUE
        AND id_user != OLD.id_user;

      IF v_admin_count = 0 THEN
        RAISE EXCEPTION 'Cannot remove the last active admin.';
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER protect_last_admin
BEFORE DELETE OR UPDATE ON public.users_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_last_admin_protection();

-- =========================
-- HELPER FUNCTION FOR RLS
-- =========================

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS helper function is_admin...';
END $$;

CREATE OR REPLACE FUNCTION public.get_my_is_active()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_active FROM public.users_profiles WHERE id_user = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users_profiles WHERE id_user = auth.uid();
$$;

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
-- PRIVATE SCHEMA (not exposed via PostgREST)
-- =========================
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.get_any_is_active(p_id_user UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_active FROM public.users_profiles WHERE id_user = p_id_user;
$$;

GRANT EXECUTE ON FUNCTION private.get_any_is_active(UUID) TO authenticated;

-- =========================
-- ENABLE RLS
-- =========================

DO $$
BEGIN
  RAISE NOTICE 'Enabling RLS on application tables...';
END $$;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_invitations ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS POLICIES
-- =========================

CREATE POLICY "audit_log_select"
ON public.audit_log FOR SELECT TO authenticated
USING (is_admin());

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies for users_profiles...';
END $$;

CREATE POLICY "profiles_select"
ON public.users_profiles FOR SELECT TO authenticated
USING (id_user = (SELECT auth.uid()) OR is_admin());

CREATE POLICY "profiles_insert"
ON public.users_profiles FOR INSERT TO authenticated
WITH CHECK (id_user = (SELECT auth.uid()));

CREATE POLICY "profiles_update"
ON public.users_profiles FOR UPDATE TO authenticated
USING (id_user = (SELECT auth.uid()) OR is_admin())
WITH CHECK (
  -- Admin updating another user: role only, is_active locked via private function
  (is_admin() AND id_user != (SELECT auth.uid()) AND is_active = private.get_any_is_active(id_user))
  OR
  -- Self update: role and is_active locked
  (
    id_user = (SELECT auth.uid())
    AND role = public.get_my_role()
    AND is_active = public.get_my_is_active()
  )
);

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies for disciplines...';
END $$;

CREATE POLICY "disciplines_select"
ON public.disciplines FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "disciplines_insert"
ON public.disciplines FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "disciplines_update"
ON public.disciplines FOR UPDATE TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "disciplines_delete"
ON public.disciplines FOR DELETE TO authenticated
USING (is_admin());

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies for users_disciplines...';
END $$;

CREATE POLICY "user_disciplines_select"
ON public.users_disciplines FOR SELECT TO authenticated
USING (fk_user = (SELECT auth.uid()) OR is_admin());

CREATE POLICY "user_disciplines_insert"
ON public.users_disciplines FOR INSERT TO authenticated
WITH CHECK (fk_user = (SELECT auth.uid()) OR is_admin());

CREATE POLICY "user_disciplines_update"
ON public.users_disciplines FOR UPDATE TO authenticated
USING (fk_user = (SELECT auth.uid()) OR is_admin())
WITH CHECK (fk_user = (SELECT auth.uid()) OR is_admin());

CREATE POLICY "user_disciplines_delete"
ON public.users_disciplines FOR DELETE TO authenticated
USING (fk_user = (SELECT auth.uid()) OR is_admin());

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies for athletes...';
END $$;

CREATE POLICY "athletes_select"
ON public.athletes FOR SELECT TO authenticated
USING (id_user = (SELECT auth.uid()) OR is_admin());

CREATE POLICY "athletes_insert"
ON public.athletes FOR INSERT TO authenticated
WITH CHECK (id_user = (SELECT auth.uid()) OR is_admin());

CREATE POLICY "athletes_update"
ON public.athletes FOR UPDATE TO authenticated
USING (id_user = (SELECT auth.uid()) OR is_admin())
WITH CHECK (id_user = (SELECT auth.uid()) OR is_admin());

CREATE POLICY "athletes_delete"
ON public.athletes FOR DELETE TO authenticated
USING (is_admin());

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies for medals...';
END $$;

CREATE POLICY "medals_select"
ON public.medals FOR SELECT TO authenticated
USING (id_user = (SELECT auth.uid()) OR is_admin());

CREATE POLICY "medals_insert"
ON public.medals FOR INSERT TO authenticated
WITH CHECK (id_user = (SELECT auth.uid()) OR is_admin());

CREATE POLICY "medals_update"
ON public.medals FOR UPDATE TO authenticated
USING (id_user = (SELECT auth.uid()) OR is_admin())
WITH CHECK (id_user = (SELECT auth.uid()) OR is_admin());

CREATE POLICY "medals_delete"
ON public.medals FOR DELETE TO authenticated
USING (id_user = (SELECT auth.uid()) OR is_admin());

DO $$
BEGIN
  RAISE NOTICE 'Creating RLS policies for users_invitations...';
END $$;

CREATE POLICY "invitations_select"
ON public.users_invitations FOR SELECT TO authenticated
USING (is_admin());

-- =========================
-- INDEXES
-- =========================

DO $$
BEGIN
  RAISE NOTICE 'Creating indexes...';
END $$;

CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_users_profiles_role ON public.users_profiles(role);
CREATE INDEX idx_users_disciplines_user ON public.users_disciplines(fk_user);
CREATE INDEX idx_users_disciplines_discipline ON public.users_disciplines(fk_discipline);
CREATE INDEX idx_medals_user ON public.medals(id_user);
CREATE INDEX idx_users_invitations_email ON public.users_invitations(email);
CREATE INDEX idx_users_invitations_status ON public.users_invitations(status);
CREATE INDEX idx_users_invitations_invited_by ON public.users_invitations(fk_invited_by);

-- =========================
-- SECURITY: Revoke direct RPC access to internal trigger functions
-- =========================
GRANT SELECT ON public.audit_log TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_audit_user_registered() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_audit_invitation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_audit_profile_updated() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_audit_discipline_created() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_athlete_id_from_auth() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_delete_invitation_on_user_delete() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_discipline_user_from_auth() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_guardian_minor_check() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_invitation_accepted() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_last_admin_protection() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_profile_id_from_auth() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_profile_role_from_invitation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_is_active() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;

-- =========================
-- CRON JOBS
-- =========================
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'expire-invitations',
  '0 * * * *',
  $$
    UPDATE public.users_invitations
    SET status = 'expired'
    WHERE status = 'sent'
      AND expires_at < now();
  $$
);

DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully.';
END $$;
