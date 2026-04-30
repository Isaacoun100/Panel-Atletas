DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'Dropping all tables...';

  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    RAISE NOTICE 'Dropped table: %', r.tablename;
  END LOOP;

  RAISE NOTICE 'All tables dropped.';
END $$;


DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'Dropping all types...';

  FOR r IN (
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typtype = 'e' -- solo ENUMS
  ) LOOP
    EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    RAISE NOTICE 'Dropped type: %', r.typname;
  END LOOP;

  RAISE NOTICE 'All types dropped.';
END $$;