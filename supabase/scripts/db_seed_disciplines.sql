TRUNCATE public.disciplines RESTART IDENTITY CASCADE;

INSERT INTO public.disciplines (name, discipline_type, is_active) VALUES
  ('Ajedrez',       'sport', TRUE),
  ('Atletismo',     'sport', TRUE),
  ('Judo',          'sport', TRUE),
  ('Karate Do',     'sport', TRUE),
  ('Taekwondo',     'sport', TRUE),
  ('Tenis de Mesa', 'sport', TRUE),
  ('Triatlón',      'sport', TRUE),
  ('Baloncesto',    'sport', TRUE),
  ('Voleibol',      'sport', TRUE),
  ('Boxeo',         'sport', TRUE),
  ('Futbol Sala',   'sport', TRUE),
  ('Fútbol',        'sport', TRUE),
  ('Rugby',         'sport', TRUE),
  ('Tiro con arco', 'sport', TRUE),
  ('Zumba',         'recreational', TRUE),
  ('Yoga',          'recreational', TRUE);
