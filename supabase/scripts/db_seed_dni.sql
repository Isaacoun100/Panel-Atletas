DO $$
BEGIN
  RAISE NOTICE 'Starting seed...';
END $$;

-- =========================
-- DNI TYPES
-- =========================

DO $$
BEGIN
  RAISE NOTICE 'Seeding dni_types...';
END $$;

INSERT INTO public.dni_types (name) VALUES
  ('Cédula'),
  ('Pasaporte'),
  ('DIMEX')
ON CONFLICT (name) DO NOTHING;
