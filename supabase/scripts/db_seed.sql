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

-- =========================
-- NOTIFICATION TEMPLATES
-- =========================

DO $$
BEGIN
  RAISE NOTICE 'Seeding notification_templates...';
END $$;

INSERT INTO public.notification_templates (type, name, subject, body, variables) VALUES
  (
    'invitation',
    'Magic Link Invitation',
    'Acceso a Panel Atletas',
    'Hola,

Has sido invitado a registrarte en Panel Atletas. Haz clic en el siguiente enlace para completar tu registro:

{{magic_link}}

Este enlace expira en 7 días.

Si no esperabas este correo, puedes ignorarlo.',
    'magic_link'
  ),
  (
    'welcome',
    'Welcome',
    'Bienvenido a Panel Atletas',
    'Hola {{name}},

Tu registro en Panel Atletas ha sido completado exitosamente.

Ya puedes acceder a tu perfil y gestionar tu información.

Bienvenido.',
    'name'
  )
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE 'Seed completed successfully.';
END $$;
