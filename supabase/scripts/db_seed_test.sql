-- =============================================
-- SEED: Test data — Panel Atletas
-- 32 athletes, disciplines, medals, invitations (32 accepted + 5 test statuses), audit_log
-- Does NOT touch: disciplines table (managed by db_seed_disciplines.sql)
-- Requires: db_schema.sql + db_seed_disciplines.sql already applied
-- Email domain: @panelatletas.test (used by db_clean_test.sql for cleanup)
-- =============================================

BEGIN;

-- Disable triggers that inject auth.uid() — NULL outside request context
ALTER TABLE public.users_profiles    DISABLE TRIGGER set_profile_id_from_auth;
ALTER TABLE public.users_profiles    DISABLE TRIGGER set_profile_role_from_invitation;
ALTER TABLE public.athletes          DISABLE TRIGGER set_athlete_id_from_auth;
ALTER TABLE public.users_disciplines DISABLE TRIGGER set_discipline_user_from_auth;
ALTER TABLE public.users_profiles    DISABLE TRIGGER audit_user_registered;
ALTER TABLE public.users_profiles    DISABLE TRIGGER audit_profile_updated;
ALTER TABLE public.users_invitations DISABLE TRIGGER audit_invitation;
ALTER TABLE public.disciplines       DISABLE TRIGGER audit_discipline_created;

-- =============================================
-- ACCEPTED INVITATIONS (one per athlete — mirrors real registration flow)
-- handle_invitation_accepted trigger fires only on UPDATE, not INSERT,
-- so accepted status must be set explicitly here.
-- fk_invited_by = Brian Ramirez (real admin)
-- =============================================

INSERT INTO public.users_invitations (
  email, status, initial_role, expires_at, attempts, fk_invited_by
) VALUES
  ('test.sofia.castro@panelatletas.test',      'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.mateo.jimenez@panelatletas.test',     'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.valeria.urena@panelatletas.test',     'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.diego.herrera@panelatletas.test',     'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.carlos.mora@panelatletas.test',       'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.luis.perez@panelatletas.test',        'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.martina.rojas@panelatletas.test',     'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.roberto.salas@panelatletas.test',     'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.patricia.vega@panelatletas.test',     'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.fernando.alvarado@panelatletas.test', 'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.ana.quesada@panelatletas.test',       'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.eduardo.madrigal@panelatletas.test',  'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.gabriela.chaves@panelatletas.test',   'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.andres.montoya@panelatletas.test',    'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.laura.obando@panelatletas.test',      'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.miguel.vargas@panelatletas.test',     'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.daniela.blanco@panelatletas.test',    'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.jose.mendez@panelatletas.test',       'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.melissa.campos@panelatletas.test',    'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.ricardo.soto@panelatletas.test',      'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.carolina.badilla@panelatletas.test',  'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.alejandro.castro@panelatletas.test',  'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.natalia.elizondo@panelatletas.test',  'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.pablo.acuna@panelatletas.test',       'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.stephanie.quiros@panelatletas.test',  'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.cristian.arce@panelatletas.test',     'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.pamela.fonseca@panelatletas.test',    'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.esteban.gutierrez@panelatletas.test', 'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.diana.mora@panelatletas.test',        'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.hector.picado@panelatletas.test',     'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.marcela.trejos@panelatletas.test',    'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36'),
  ('test.javier.ocampo@panelatletas.test',     'accepted','athlete',now() - INTERVAL '1 day',1,'6eba7758-ce75-4695-8ea8-d728ff4e5d36');

-- =============================================
-- AUTH USERS
-- UUIDs: 10000000-0000-0000-0000-0000000000NN (002-033, 32 athletes)
-- Admin omitted — Brian Ramirez (6eba7758-ce75-4695-8ea8-d728ff4e5d36) already exists
-- =============================================

INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.sofia.castro@panelatletas.test',       '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.mateo.jimenez@panelatletas.test',      '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.valeria.urena@panelatletas.test',      '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.diego.herrera@panelatletas.test',      '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.carlos.mora@panelatletas.test',        '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.luis.perez@panelatletas.test',         '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.martina.rojas@panelatletas.test',      '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.roberto.salas@panelatletas.test',      '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.patricia.vega@panelatletas.test',      '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.fernando.alvarado@panelatletas.test',  '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.ana.quesada@panelatletas.test',        '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.eduardo.madrigal@panelatletas.test',   '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.gabriela.chaves@panelatletas.test',    '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.andres.montoya@panelatletas.test',     '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000016','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.laura.obando@panelatletas.test',       '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000017','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.miguel.vargas@panelatletas.test',      '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000018','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.daniela.blanco@panelatletas.test',     '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000019','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.jose.mendez@panelatletas.test',        '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.melissa.campos@panelatletas.test',     '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.ricardo.soto@panelatletas.test',       '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.carolina.badilla@panelatletas.test',   '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.alejandro.castro@panelatletas.test',   '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000024','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.natalia.elizondo@panelatletas.test',   '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000025','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.pablo.acuna@panelatletas.test',        '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000026','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.stephanie.quiros@panelatletas.test',   '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000027','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.cristian.arce@panelatletas.test',      '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000028','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.pamela.fonseca@panelatletas.test',     '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000029','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.esteban.gutierrez@panelatletas.test',  '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.diana.mora@panelatletas.test',         '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.hector.picado@panelatletas.test',      '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.marcela.trejos@panelatletas.test',     '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}'),
  ('10000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test.javier.ocampo@panelatletas.test',      '',now(),now(),now(),'{"provider":"email","providers":["email"]}','{}');

-- =============================================
-- USERS PROFILES
-- Trigger set_profile_id_from_auth is disabled — id_user provided explicitly
-- Trigger set_profile_role_from_invitation is disabled — role provided explicitly
-- =============================================

INSERT INTO public.users_profiles (
  id_user, name, first_last_name, second_last_name,
  dni_type, dni, birth_date, sex, role, is_active
) VALUES
  -- 002-005 minors (born after 2008-05-25)
  ('10000000-0000-0000-0000-000000000002','Sofía',     'Castro',   'Vargas',   'cedula','TEST-002','2009-03-15','female','athlete',true),
  ('10000000-0000-0000-0000-000000000003','Mateo',     'Jiménez',  'Mora',     'cedula','TEST-003','2010-07-22','male',  'athlete',true),
  ('10000000-0000-0000-0000-000000000004','Valeria',   'Ureña',    'López',    'cedula','TEST-004','2011-01-08','female','athlete',true),
  ('10000000-0000-0000-0000-000000000005','Diego',     'Herrera',  'Chaves',   'cedula','TEST-005','2008-06-15','male',  'athlete',true),
  -- 006-033 adults
  ('10000000-0000-0000-0000-000000000006','Carlos',    'Mora',     'Jiménez',  'cedula','TEST-006','1990-06-15','male',  'athlete',true),
  ('10000000-0000-0000-0000-000000000007','Luis',      'Pérez',    'Solano',   'cedula','TEST-007','1995-11-08','male',  'athlete',true),
  ('10000000-0000-0000-0000-000000000008','Martina',   'Rojas',    'Ureña',    'cedula','TEST-008','2000-01-10','female','athlete',true),
  ('10000000-0000-0000-0000-000000000009','Roberto',   'Salas',    'Núñez',    'cedula','TEST-009','1988-04-22','male',  'athlete',true),
  ('10000000-0000-0000-0000-000000000010','Patricia',  'Vega',     'Brenes',   'cedula','TEST-010','1993-08-30','female','athlete',true),
  ('10000000-0000-0000-0000-000000000011','Fernando',  'Alvarado', 'Cruz',     'cedula','TEST-011','1997-12-05','male',  'athlete',true),
  ('10000000-0000-0000-0000-000000000012','Ana',       'Quesada',  'Solís',    'cedula','TEST-012','1985-05-17','female','athlete',true),
  ('10000000-0000-0000-0000-000000000013','Eduardo',   'Madrigal', 'Ramírez',  'cedula','TEST-013','2002-09-28','male',  'athlete',true),
  ('10000000-0000-0000-0000-000000000014','Gabriela',  'Chaves',   'Porras',   'cedula','TEST-014','1991-03-14','female','athlete',true),
  ('10000000-0000-0000-0000-000000000015','Andrés',    'Montoya',  'Fallas',   'cedula','TEST-015','1999-11-22','male',  'athlete',true),
  ('10000000-0000-0000-0000-000000000016','Laura',     'Obando',   'Zúñiga',   'cedula','TEST-016','2003-06-08','female','athlete',true),
  ('10000000-0000-0000-0000-000000000017','Miguel',    'Vargas',   'Sequeira', 'cedula','TEST-017','1986-01-30','male',  'athlete',true),
  ('10000000-0000-0000-0000-000000000018','Daniela',   'Blanco',   'Alfaro',   'cedula','TEST-018','2004-12-11','female','athlete',true),
  ('10000000-0000-0000-0000-000000000019','José',      'Méndez',   'Cerdas',   'cedula','TEST-019','1994-07-19','male',  'athlete',true),
  ('10000000-0000-0000-0000-000000000020','Melissa',   'Campos',   'Araya',    'cedula','TEST-020','1989-09-03','female','athlete',true),
  ('10000000-0000-0000-0000-000000000021','Ricardo',   'Soto',     'Leiva',    'cedula','TEST-021','2001-04-25','male',  'athlete',true),
  ('10000000-0000-0000-0000-000000000022','Carolina',  'Badilla',  'Jiménez',  'cedula','TEST-022','1996-02-14','female','athlete',true),
  ('10000000-0000-0000-0000-000000000023','Alejandro', 'Castro',   'Ugalde',   'cedula','TEST-023','1992-10-08','male',  'athlete',true),
  ('10000000-0000-0000-0000-000000000024','Natalia',   'Elizondo', 'Mora',     'cedula','TEST-024','1998-08-27','female','athlete',true),
  ('10000000-0000-0000-0000-000000000025','Pablo',     'Acuña',    'Herrera',  'cedula','TEST-025','2005-03-16','male',  'athlete',true),
  ('10000000-0000-0000-0000-000000000026','Stephanie', 'Quirós',   'Vega',     'cedula','TEST-026','1987-11-29','female','athlete',true),
  ('10000000-0000-0000-0000-000000000027','Cristian',  'Arce',     'Bolaños',  'cedula','TEST-027','2003-07-04','male',  'athlete',true),
  ('10000000-0000-0000-0000-000000000028','Pamela',    'Fonseca',  'Rodríguez','cedula','TEST-028','1995-05-20','female','athlete',true),
  ('10000000-0000-0000-0000-000000000029','Esteban',   'Gutiérrez','Mata',     'cedula','TEST-029','2000-09-12','male',  'athlete',true),
  ('10000000-0000-0000-0000-000000000030','Diana',     'Mora',     'Solano',   'cedula','TEST-030','1993-04-07','female','athlete',true),
  ('10000000-0000-0000-0000-000000000031','Héctor',    'Picado',   'Calvo',    'cedula','TEST-031','1984-12-15','male',  'athlete',true),
  ('10000000-0000-0000-0000-000000000032','Marcela',   'Trejos',   'Elizondo', 'cedula','TEST-032','2002-06-22','female','athlete',true),
  ('10000000-0000-0000-0000-000000000033','Javier',    'Ocampo',   'Alfaro',   'cedula','TEST-033','1997-03-18','male',  'athlete',true);

-- =============================================
-- ATHLETES
-- Trigger set_athlete_id_from_auth is disabled — id_user provided explicitly
-- Trigger check_guardian_minor is ACTIVE — guardian fields validated against birth_date
-- Columns: id_user, phone, district_of_residence,
--   legal_guardian_name, legal_guardian_phone,
--   nacional_games_participation, international_games_participation,
--   weekly_exercise, has_family_support, satisfaction_level,
--   has_family_in_committee, has_previous_committee, previous_committee_name,
--   is_club_member, club_name,
--   facility_satisfaction_level,
--   has_disability, disability_type, disability_description,
--   has_functional_classification, classification_category, classification_document_url,
--   accepts_data_usage, accepts_info_accuracy
-- =============================================

INSERT INTO public.athletes (
  id_user, phone, district_of_residence,
  legal_guardian_name, legal_guardian_phone,
  nacional_games_participation, international_games_participation,
  weekly_exercise, has_family_support, satisfaction_level,
  has_family_in_committee, has_previous_committee, previous_committee_name,
  is_club_member, club_name,
  facility_satisfaction_level,
  has_disability, disability_type, disability_description,
  has_functional_classification, classification_category, classification_document_url,
  accepts_data_usage, accepts_info_accuracy
) VALUES
  -- 002 Sofía [MINOR — guardian required]
  ('10000000-0000-0000-0000-000000000002','8800-0002','san_pedro',
   'María Castro Pérez','8800-9002',
   false,false,3,true,'very_satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 003 Mateo [MINOR — guardian required]
  ('10000000-0000-0000-0000-000000000003','8800-0003','sabanilla',
   'Jorge Jiménez Soto','8800-9003',
   false,false,2,true,'satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 004 Valeria [MINOR — guardian required]
  ('10000000-0000-0000-0000-000000000004','8800-0004','mercedes',
   'Ana López Vargas','8800-9004',
   false,false,4,false,'satisfied',
   false,false,NULL,
   false,NULL,
   'partial',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 005 Diego [MINOR — guardian required, barely under 18: born 2008-06-15]
  ('10000000-0000-0000-0000-000000000005','8800-0005','san_rafael',
   'Carlos Herrera Mora','8800-9005',
   true,false,5,true,'very_satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 006 Carlos [national games, no club, no disability]
  ('10000000-0000-0000-0000-000000000006','8800-0006','san_pedro',
   NULL,NULL,
   true,false,4,true,'satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 007 Luis [DISABILITY physical + functional classification, international games]
  ('10000000-0000-0000-0000-000000000007','8800-0007','mercedes',
   NULL,NULL,
   true,true,5,true,'neutral',
   false,true,'Comité Deportivo Curridabat',
   false,NULL,
   'partial',
   true,'physical','Parálisis cerebral leve — extremidades inferiores',
   true,'b1','https://example.com/test/clasificacion-007.pdf',
   true,true),

  -- 008 Martina [club, national + international games]
  ('10000000-0000-0000-0000-000000000008','8800-0008','san_rafael',
   NULL,NULL,
   true,true,6,true,'very_satisfied',
   false,false,NULL,
   true,'Club Deportivo Montes de Oca',
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 009 Roberto [family in committee]
  ('10000000-0000-0000-0000-000000000009','8800-0009','san_pedro',
   NULL,NULL,
   true,false,3,true,'satisfied',
   true,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 010 Patricia [family support, recreational focus]
  ('10000000-0000-0000-0000-000000000010','8800-0010','sabanilla',
   NULL,NULL,
   false,false,2,true,'satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 011 Fernando [previous committee]
  ('10000000-0000-0000-0000-000000000011','8800-0011','mercedes',
   NULL,NULL,
   true,false,4,false,'neutral',
   false,true,'Comité Deportivo Desamparados',
   false,NULL,
   'partial',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 012 Ana [club, sport + recreational ajedrez]
  ('10000000-0000-0000-0000-000000000012','8800-0012','san_rafael',
   NULL,NULL,
   true,false,3,true,'satisfied',
   false,false,NULL,
   true,'Club Ajedrez UCR',
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 013 Eduardo [sport + recreational fútbol sala]
  ('10000000-0000-0000-0000-000000000013','8800-0013','san_pedro',
   NULL,NULL,
   false,false,3,true,'satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 014 Gabriela [national games, family in committee]
  ('10000000-0000-0000-0000-000000000014','8800-0014','sabanilla',
   NULL,NULL,
   true,false,4,true,'very_satisfied',
   true,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 015 Andrés [boxeo]
  ('10000000-0000-0000-0000-000000000015','8800-0015','mercedes',
   NULL,NULL,
   false,false,5,true,'satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 016 Laura [DISABILITY cognitive, recreational only]
  ('10000000-0000-0000-0000-000000000016','8800-0016','other',
   NULL,NULL,
   false,false,2,true,'satisfied',
   false,false,NULL,
   false,NULL,
   'partial',
   true,'cognitive','Síndrome de Down — participación adaptada',
   false,NULL,NULL,
   true,true),

  -- 017 Miguel [fútbol, has club in another committee]
  ('10000000-0000-0000-0000-000000000017','8800-0017','san_pedro',
   NULL,NULL,
   true,false,4,false,'neutral',
   false,true,'Comité Deportivo Santa Ana',
   false,NULL,
   'no',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 018 Daniela [baloncesto + voleibol]
  ('10000000-0000-0000-0000-000000000018','8800-0018','sabanilla',
   NULL,NULL,
   false,false,3,true,'satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 019 José [triatlón + atletismo]
  ('10000000-0000-0000-0000-000000000019','8800-0019','mercedes',
   NULL,NULL,
   true,false,6,true,'very_satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 020 Melissa [club, national + international games]
  ('10000000-0000-0000-0000-000000000020','8800-0020','san_rafael',
   NULL,NULL,
   true,true,5,true,'very_satisfied',
   false,false,NULL,
   true,'Club Tenis de Mesa San Pedro',
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 021 Ricardo [fútbol sala + baloncesto recreacional]
  ('10000000-0000-0000-0000-000000000021','8800-0021','other',
   NULL,NULL,
   false,false,3,true,'satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 022 Carolina [karate do]
  ('10000000-0000-0000-0000-000000000022','8800-0022','san_pedro',
   NULL,NULL,
   false,false,4,true,'satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 023 Alejandro [international games, atletismo + triatlón]
  ('10000000-0000-0000-0000-000000000023','8800-0023','sabanilla',
   NULL,NULL,
   true,true,6,true,'very_satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 024 Natalia [voleibol sport + recreational]
  ('10000000-0000-0000-0000-000000000024','8800-0024','mercedes',
   NULL,NULL,
   true,false,4,true,'satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 025 Pablo [taekwondo sport + recreational]
  ('10000000-0000-0000-0000-000000000025','8800-0025','san_rafael',
   NULL,NULL,
   false,false,3,false,'neutral',
   false,false,NULL,
   false,NULL,
   'partial',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 026 Stephanie [recreational only — funcionales, zumba, yoga]
  ('10000000-0000-0000-0000-000000000026','8800-0026','other',
   NULL,NULL,
   false,false,2,true,'satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 027 Cristian [club, fútbol + baloncesto]
  ('10000000-0000-0000-0000-000000000027','8800-0027','san_pedro',
   NULL,NULL,
   false,false,4,true,'satisfied',
   false,false,NULL,
   true,'Club Fútbol Juvenil Saprissa',
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 028 Pamela [judo sport + recreational]
  ('10000000-0000-0000-0000-000000000028','8800-0028','sabanilla',
   NULL,NULL,
   true,false,4,true,'very_satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 029 Esteban [boxeo + fútbol]
  ('10000000-0000-0000-0000-000000000029','8800-0029','mercedes',
   NULL,NULL,
   false,false,5,false,'neutral',
   false,false,NULL,
   false,NULL,
   'no',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 030 Diana [tenis de mesa + ajedrez]
  ('10000000-0000-0000-0000-000000000030','8800-0030','san_rafael',
   NULL,NULL,
   true,false,3,true,'satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 031 Héctor [club, ajedrez + adulto mayor recreacional]
  ('10000000-0000-0000-0000-000000000031','8800-0031','other',
   NULL,NULL,
   false,false,2,true,'satisfied',
   false,false,NULL,
   true,'Club Ajedrez UCR',
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 032 Marcela [triatlón + atletismo]
  ('10000000-0000-0000-0000-000000000032','8800-0032','san_pedro',
   NULL,NULL,
   true,false,5,true,'very_satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true),

  -- 033 Javier [karate do + judo]
  ('10000000-0000-0000-0000-000000000033','8800-0033','sabanilla',
   NULL,NULL,
   false,false,4,true,'satisfied',
   false,false,NULL,
   false,NULL,
   'yes',
   false,NULL,NULL,false,NULL,NULL,
   true,true);

-- =============================================
-- USERS DISCIPLINES
-- Trigger set_discipline_user_from_auth is disabled — fk_user provided explicitly
-- Triggers handle_discipline_representative_check + discipline_active_check are ACTIVE
-- Discipline IDs (sport): 1=Ajedrez 3=Atletismo 5=Judo 7=KarateDo 9=Taekwondo
--   11=TenisMesa 13=Triatlón 19=Baloncesto 21=Voleibol 23=Boxeo 25=FutbolSala 27=Fútbol
-- Discipline IDs (recreational): 2=Ajedrez 4=Atletismo 6=Judo 8=KarateDo 10=Taekwondo
--   12=TenisMesa 14=Triatlón 15=Zumba 16=Funcionales 17=Yoga 18=AdultoMayor
--   20=Baloncesto 22=Voleibol 24=Boxeo 26=FutbolSala 28=Fútbol
-- is_representative=TRUE only on sport disciplines
-- =============================================

INSERT INTO public.users_disciplines (fk_user, fk_discipline, is_representative) VALUES
  -- 002 Sofía: Taekwondo sport, Yoga rec
  ('10000000-0000-0000-0000-000000000002', 9,  false),
  ('10000000-0000-0000-0000-000000000002', 17, false),
  -- 003 Mateo: Judo sport
  ('10000000-0000-0000-0000-000000000003', 5,  false),
  -- 004 Valeria: Voleibol sport, Zumba rec
  ('10000000-0000-0000-0000-000000000004', 21, false),
  ('10000000-0000-0000-0000-000000000004', 15, false),
  -- 005 Diego: Atletismo sport (representative), Atletismo rec
  ('10000000-0000-0000-0000-000000000005', 3,  true),
  ('10000000-0000-0000-0000-000000000005', 4,  false),
  -- 006 Carlos: Atletismo sport (representative), Ajedrez sport
  ('10000000-0000-0000-0000-000000000006', 3,  true),
  ('10000000-0000-0000-0000-000000000006', 1,  false),
  -- 007 Luis: Judo sport (representative), Triatlón rec
  ('10000000-0000-0000-0000-000000000007', 5,  true),
  ('10000000-0000-0000-0000-000000000007', 14, false),
  -- 008 Martina: Triatlón sport (representative), Tenis de Mesa sport
  ('10000000-0000-0000-0000-000000000008', 13, true),
  ('10000000-0000-0000-0000-000000000008', 11, false),
  -- 009 Roberto: Fútbol sport, Baloncesto sport
  ('10000000-0000-0000-0000-000000000009', 27, false),
  ('10000000-0000-0000-0000-000000000009', 19, false),
  -- 010 Patricia: Voleibol sport, Funcionales rec
  ('10000000-0000-0000-0000-000000000010', 21, false),
  ('10000000-0000-0000-0000-000000000010', 16, false),
  -- 011 Fernando: Karate Do sport (representative), Karate Do rec
  ('10000000-0000-0000-0000-000000000011', 7,  true),
  ('10000000-0000-0000-0000-000000000011', 8,  false),
  -- 012 Ana: Ajedrez sport (representative), Ajedrez rec
  ('10000000-0000-0000-0000-000000000012', 1,  true),
  ('10000000-0000-0000-0000-000000000012', 2,  false),
  -- 013 Eduardo: Fútbol Sala sport, Fútbol Sala rec
  ('10000000-0000-0000-0000-000000000013', 25, false),
  ('10000000-0000-0000-0000-000000000013', 26, false),
  -- 014 Gabriela: Taekwondo sport, Taekwondo rec
  ('10000000-0000-0000-0000-000000000014', 9,  false),
  ('10000000-0000-0000-0000-000000000014', 10, false),
  -- 015 Andrés: Boxeo sport, Boxeo rec
  ('10000000-0000-0000-0000-000000000015', 23, false),
  ('10000000-0000-0000-0000-000000000015', 24, false),
  -- 016 Laura: Atletismo rec, Yoga rec (recreational only — disability cognitive)
  ('10000000-0000-0000-0000-000000000016', 4,  false),
  ('10000000-0000-0000-0000-000000000016', 17, false),
  -- 017 Miguel: Fútbol sport (representative), Fútbol rec
  ('10000000-0000-0000-0000-000000000017', 27, true),
  ('10000000-0000-0000-0000-000000000017', 28, false),
  -- 018 Daniela: Baloncesto sport, Voleibol sport
  ('10000000-0000-0000-0000-000000000018', 19, false),
  ('10000000-0000-0000-0000-000000000018', 21, false),
  -- 019 José: Triatlón sport, Atletismo sport
  ('10000000-0000-0000-0000-000000000019', 13, false),
  ('10000000-0000-0000-0000-000000000019', 3,  false),
  -- 020 Melissa: Tenis de Mesa sport (representative), Tenis de Mesa rec
  ('10000000-0000-0000-0000-000000000020', 11, true),
  ('10000000-0000-0000-0000-000000000020', 12, false),
  -- 021 Ricardo: Fútbol Sala sport, Baloncesto rec
  ('10000000-0000-0000-0000-000000000021', 25, false),
  ('10000000-0000-0000-0000-000000000021', 20, false),
  -- 022 Carolina: Karate Do sport
  ('10000000-0000-0000-0000-000000000022', 7,  false),
  -- 023 Alejandro: Atletismo sport (representative), Triatlón sport
  ('10000000-0000-0000-0000-000000000023', 3,  true),
  ('10000000-0000-0000-0000-000000000023', 13, false),
  -- 024 Natalia: Voleibol sport, Voleibol rec
  ('10000000-0000-0000-0000-000000000024', 21, false),
  ('10000000-0000-0000-0000-000000000024', 22, false),
  -- 025 Pablo: Taekwondo sport, Taekwondo rec
  ('10000000-0000-0000-0000-000000000025', 9,  false),
  ('10000000-0000-0000-0000-000000000025', 10, false),
  -- 026 Stephanie: Funcionales rec, Zumba rec, Yoga rec (recreational only)
  ('10000000-0000-0000-0000-000000000026', 16, false),
  ('10000000-0000-0000-0000-000000000026', 15, false),
  ('10000000-0000-0000-0000-000000000026', 17, false),
  -- 027 Cristian: Fútbol sport, Baloncesto sport
  ('10000000-0000-0000-0000-000000000027', 27, false),
  ('10000000-0000-0000-0000-000000000027', 19, false),
  -- 028 Pamela: Judo sport, Judo rec
  ('10000000-0000-0000-0000-000000000028', 5,  false),
  ('10000000-0000-0000-0000-000000000028', 6,  false),
  -- 029 Esteban: Boxeo sport, Fútbol sport
  ('10000000-0000-0000-0000-000000000029', 23, false),
  ('10000000-0000-0000-0000-000000000029', 27, false),
  -- 030 Diana: Tenis de Mesa sport, Ajedrez sport
  ('10000000-0000-0000-0000-000000000030', 11, false),
  ('10000000-0000-0000-0000-000000000030', 1,  false),
  -- 031 Héctor: Ajedrez sport (representative), Adulto Mayor rec
  ('10000000-0000-0000-0000-000000000031', 1,  true),
  ('10000000-0000-0000-0000-000000000031', 18, false),
  -- 032 Marcela: Triatlón sport, Atletismo sport
  ('10000000-0000-0000-0000-000000000032', 13, false),
  ('10000000-0000-0000-0000-000000000032', 3,  false),
  -- 033 Javier: Karate Do sport, Judo sport
  ('10000000-0000-0000-0000-000000000033', 7,  false),
  ('10000000-0000-0000-0000-000000000033', 5,  false);

-- =============================================
-- MEDALS
-- =============================================

INSERT INTO public.medals (competition_name, year, medal_type, id_user) VALUES
  -- 006 Carlos
  ('Juegos Nacionales 2024',           2024, 'silver', '10000000-0000-0000-0000-000000000006'),
  -- 007 Luis (disabled athlete)
  ('Juegos Nacionales 2023',           2023, 'gold',   '10000000-0000-0000-0000-000000000007'),
  -- 008 Martina (club athlete, 3 medals)
  ('Juegos Nacionales 2024',           2024, 'gold',   '10000000-0000-0000-0000-000000000008'),
  ('Juegos Centroamericanos 2023',     2023, 'silver', '10000000-0000-0000-0000-000000000008'),
  ('Copa Triatlón Nacional 2025',      2025, 'bronze', '10000000-0000-0000-0000-000000000008'),
  -- 020 Melissa (club athlete)
  ('Copa Tenis de Mesa 2025',          2025, 'gold',   '10000000-0000-0000-0000-000000000020'),
  ('Juegos Nacionales 2024',           2024, 'silver', '10000000-0000-0000-0000-000000000020'),
  -- 023 Alejandro (international games)
  ('Juegos Centroamericanos 2023',     2023, 'gold',   '10000000-0000-0000-0000-000000000023'),
  ('Juegos Centroamericanos 2025',     2025, 'silver', '10000000-0000-0000-0000-000000000023'),
  -- 030 Diana
  ('Juegos Nacionales 2023',           2023, 'bronze', '10000000-0000-0000-0000-000000000030'),
  -- 031 Héctor
  ('Torneo de Ajedrez UCR 2024',       2024, 'silver', '10000000-0000-0000-0000-000000000031');

-- =============================================
-- INVITATIONS
-- fk_invited_by = Brian Ramirez (real admin, UUID unchanged by clean script)
-- =============================================

INSERT INTO public.users_invitations (
  email, status, initial_role, expires_at, attempts, fk_invited_by, message
) VALUES
  ('test.pending.athlete@panelatletas.test', 'sent',      'athlete', now() + INTERVAL '7 days',  0, '6eba7758-ce75-4695-8ea8-d728ff4e5d36', NULL),
  ('test.pending.admin@panelatletas.test',   'sent',      'admin',   now() + INTERVAL '7 days',  1, '6eba7758-ce75-4695-8ea8-d728ff4e5d36', 'Invitación para nuevo administrador'),
  ('test.expired1@panelatletas.test',        'expired',   'athlete', now() - INTERVAL '3 days',  2, '6eba7758-ce75-4695-8ea8-d728ff4e5d36', NULL),
  ('test.expired2@panelatletas.test',        'expired',   'athlete', now() - INTERVAL '10 days', 1, '6eba7758-ce75-4695-8ea8-d728ff4e5d36', NULL),
  ('test.cancelled1@panelatletas.test',      'cancelled', 'athlete', now() + INTERVAL '5 days',  1, '6eba7758-ce75-4695-8ea8-d728ff4e5d36', NULL);

-- =============================================
-- AUDIT LOG
-- Manual seed — audit triggers disabled above (auth.uid() = NULL in seed context)
-- actor_id = Brian Ramirez (6eba7758-ce75-4695-8ea8-d728ff4e5d36) for admin actions
-- Timestamps spread across last 30 days for realistic dashboard feed
-- =============================================

INSERT INTO public.audit_log (action, actor_id, table_name, record_id, metadata, created_at) VALUES

  -- user_registered (actor = the new user themselves)
  ('user_registered', '10000000-0000-0000-0000-000000000033', 'users_profiles', '10000000-0000-0000-0000-000000000033', '{"name":"Javier","first_last_name":"Ocampo","role":"athlete"}',     now() - INTERVAL '1 hour'),
  ('user_registered', '10000000-0000-0000-0000-000000000032', 'users_profiles', '10000000-0000-0000-0000-000000000032', '{"name":"Marcela","first_last_name":"Trejos","role":"athlete"}',   now() - INTERVAL '6 hours'),
  ('user_registered', '10000000-0000-0000-0000-000000000031', 'users_profiles', '10000000-0000-0000-0000-000000000031', '{"name":"Héctor","first_last_name":"Picado","role":"athlete"}',    now() - INTERVAL '1 day'),
  ('user_registered', '10000000-0000-0000-0000-000000000030', 'users_profiles', '10000000-0000-0000-0000-000000000030', '{"name":"Diana","first_last_name":"Mora","role":"athlete"}',       now() - INTERVAL '2 days'),
  ('user_registered', '10000000-0000-0000-0000-000000000029', 'users_profiles', '10000000-0000-0000-0000-000000000029', '{"name":"Esteban","first_last_name":"Gutiérrez","role":"athlete"}',now() - INTERVAL '3 days'),
  ('user_registered', '10000000-0000-0000-0000-000000000028', 'users_profiles', '10000000-0000-0000-0000-000000000028', '{"name":"Pamela","first_last_name":"Fonseca","role":"athlete"}',   now() - INTERVAL '4 days'),
  ('user_registered', '10000000-0000-0000-0000-000000000027', 'users_profiles', '10000000-0000-0000-0000-000000000027', '{"name":"Cristian","first_last_name":"Arce","role":"athlete"}',   now() - INTERVAL '5 days'),
  ('user_registered', '10000000-0000-0000-0000-000000000026', 'users_profiles', '10000000-0000-0000-0000-000000000026', '{"name":"Stephanie","first_last_name":"Quirós","role":"athlete"}',now() - INTERVAL '6 days'),

  -- invite_sent (actor = Brian admin)
  ('invite_sent', '6eba7758-ce75-4695-8ea8-d728ff4e5d36', 'users_invitations', NULL, '{"email":"test.pending.athlete@panelatletas.test","role":"athlete"}', now() - INTERVAL '2 hours'),
  ('invite_sent', '6eba7758-ce75-4695-8ea8-d728ff4e5d36', 'users_invitations', NULL, '{"email":"test.pending.admin@panelatletas.test","role":"admin"}',     now() - INTERVAL '3 hours'),
  ('invite_sent', '6eba7758-ce75-4695-8ea8-d728ff4e5d36', 'users_invitations', NULL, '{"email":"test.expired1@panelatletas.test","role":"athlete"}',        now() - INTERVAL '10 days'),
  ('invite_sent', '6eba7758-ce75-4695-8ea8-d728ff4e5d36', 'users_invitations', NULL, '{"email":"test.expired2@panelatletas.test","role":"athlete"}',        now() - INTERVAL '17 days'),

  -- invite_accepted (actor = NULL — triggered by email confirmation, no session)
  ('invite_accepted', NULL, 'users_invitations', NULL, '{"email":"test.javier.ocampo@panelatletas.test","role":"athlete"}',      now() - INTERVAL '1 hour'),
  ('invite_accepted', NULL, 'users_invitations', NULL, '{"email":"test.marcela.trejos@panelatletas.test","role":"athlete"}',     now() - INTERVAL '6 hours'),
  ('invite_accepted', NULL, 'users_invitations', NULL, '{"email":"test.hector.picado@panelatletas.test","role":"athlete"}',      now() - INTERVAL '1 day'),
  ('invite_accepted', NULL, 'users_invitations', NULL, '{"email":"test.diana.mora@panelatletas.test","role":"athlete"}',         now() - INTERVAL '2 days'),
  ('invite_accepted', NULL, 'users_invitations', NULL, '{"email":"test.esteban.gutierrez@panelatletas.test","role":"athlete"}',  now() - INTERVAL '3 days'),

  -- profile_updated (actor = Brian admin)
  ('profile_updated', '6eba7758-ce75-4695-8ea8-d728ff4e5d36', 'users_profiles', '10000000-0000-0000-0000-000000000006', '{"name":"Carlos","first_last_name":"Mora","role":"athlete"}',     now() - INTERVAL '4 hours'),
  ('profile_updated', '6eba7758-ce75-4695-8ea8-d728ff4e5d36', 'users_profiles', '10000000-0000-0000-0000-000000000014', '{"name":"Gabriela","first_last_name":"Chaves","role":"athlete"}', now() - INTERVAL '8 days'),
  ('profile_updated', '6eba7758-ce75-4695-8ea8-d728ff4e5d36', 'users_profiles', '10000000-0000-0000-0000-000000000020', '{"name":"Melissa","first_last_name":"Campos","role":"athlete"}',  now() - INTERVAL '15 days'),

  -- user_deactivated (actor = Brian admin)
  ('user_deactivated', '6eba7758-ce75-4695-8ea8-d728ff4e5d36', 'users_profiles', '10000000-0000-0000-0000-000000000017', '{"name":"Miguel","first_last_name":"Vargas","role":"athlete"}',  now() - INTERVAL '7 days'),
  ('user_deactivated', '6eba7758-ce75-4695-8ea8-d728ff4e5d36', 'users_profiles', '10000000-0000-0000-0000-000000000025', '{"name":"Pablo","first_last_name":"Acuña","role":"athlete"}',    now() - INTERVAL '20 days'),

  -- discipline_created (actor = Brian admin)
  ('discipline_created', '6eba7758-ce75-4695-8ea8-d728ff4e5d36', 'disciplines', NULL, '{"name":"Natación","discipline_type":"sport"}',       now() - INTERVAL '12 days'),
  ('discipline_created', '6eba7758-ce75-4695-8ea8-d728ff4e5d36', 'disciplines', NULL, '{"name":"Ciclismo","discipline_type":"sport"}',       now() - INTERVAL '25 days'),
  ('discipline_created', '6eba7758-ce75-4695-8ea8-d728ff4e5d36', 'disciplines', NULL, '{"name":"Pilates","discipline_type":"recreational"}', now() - INTERVAL '28 days');

-- =============================================
-- Re-enable triggers
-- =============================================

ALTER TABLE public.users_profiles    ENABLE TRIGGER set_profile_id_from_auth;
ALTER TABLE public.users_profiles    ENABLE TRIGGER set_profile_role_from_invitation;
ALTER TABLE public.athletes          ENABLE TRIGGER set_athlete_id_from_auth;
ALTER TABLE public.users_disciplines ENABLE TRIGGER set_discipline_user_from_auth;
ALTER TABLE public.users_profiles    ENABLE TRIGGER audit_user_registered;
ALTER TABLE public.users_profiles    ENABLE TRIGGER audit_profile_updated;
ALTER TABLE public.users_invitations ENABLE TRIGGER audit_invitation;
ALTER TABLE public.disciplines       ENABLE TRIGGER audit_discipline_created;

COMMIT;
