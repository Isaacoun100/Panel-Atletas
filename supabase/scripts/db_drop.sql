DO $$
BEGIN
  RAISE NOTICE 'Dropping triggers on auth.users...';
END $$;

DROP TRIGGER IF EXISTS on_user_email_confirmed ON auth.users;
DROP TRIGGER IF EXISTS delete_invitation_on_user_delete ON auth.users;

DO $$
BEGIN
  RAISE NOTICE 'Dropping functions...';
END $$;

DROP FUNCTION IF EXISTS public.handle_invitation_accepted() CASCADE;
DROP FUNCTION IF EXISTS public.handle_delete_invitation_on_user_delete() CASCADE;
DROP FUNCTION IF EXISTS public.handle_profile_role_from_invitation() CASCADE;
DROP FUNCTION IF EXISTS public.handle_profile_id_from_auth() CASCADE;
DROP FUNCTION IF EXISTS public.handle_athlete_id_from_auth() CASCADE;
DROP FUNCTION IF EXISTS public.handle_discipline_user_from_auth() CASCADE;
DROP FUNCTION IF EXISTS public.handle_guardian_minor_check() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

DO $$
BEGIN
  RAISE NOTICE 'Dropping tables...';
END $$;

DROP TABLE IF EXISTS public.medals CASCADE;
DROP TABLE IF EXISTS public.users_disciplines CASCADE;
DROP TABLE IF EXISTS public.athletes CASCADE;
DROP TABLE IF EXISTS public.users_invitations CASCADE;
DROP TABLE IF EXISTS public.users_profiles CASCADE;
DROP TABLE IF EXISTS public.disciplines CASCADE;

DO $$
BEGIN
  RAISE NOTICE 'Dropping enum types...';
END $$;

DROP TYPE IF EXISTS public.sex CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.dni_type CASCADE;
DROP TYPE IF EXISTS public.district CASCADE;
DROP TYPE IF EXISTS public.participation_type CASCADE;
DROP TYPE IF EXISTS public.medal_type CASCADE;
DROP TYPE IF EXISTS public.satisfaction_level CASCADE;
DROP TYPE IF EXISTS public.facility_condition CASCADE;
DROP TYPE IF EXISTS public.disability_type CASCADE;
DROP TYPE IF EXISTS public.classification_category CASCADE;
DROP TYPE IF EXISTS public.invitation_status CASCADE;
DROP TYPE IF EXISTS public.discipline_type CASCADE;

DO $$
BEGIN
  RAISE NOTICE 'Drop completed.';
END $$;
