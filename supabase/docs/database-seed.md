# Database Seed — Test Data

Scripts ubicados en `supabase/scripts/`.

## Scripts

| Script | Propósito |
|--------|-----------|
| `db_schema.sql` | Crea tablas, triggers, RLS, índices |
| `db_seed_disciplines.sql` | Pobla tabla `disciplines` (28 disciplinas) |
| `db_seed_test.sql` | Inserta datos de prueba (atletas, medallas, etc.) |
| `db_clean_test.sql` | Elimina todo lo generado por `db_seed_test.sql` |

## Orden de ejecución

```
db_schema.sql → db_seed_disciplines.sql → db_seed_test.sql
```

## Datos generados por `db_seed_test.sql`

### Resumen

| Tabla | Filas |
|-------|-------|
| `users_profiles` | +32 (atletas de prueba) |
| `athletes` | 32 |
| `users_disciplines` | ~63 |
| `medals` | 11 |
| `users_invitations` | 37 (32 accepted + 5 estados de prueba) |

> `disciplines` y el perfil de Brian Ramirez (admin real) no son tocados.

### Identificación de datos de prueba

Todos los usuarios de prueba usan el dominio de email `@panelatletas.test`.  
El script de limpieza usa este dominio como filtro.

UUIDs con patrón: `10000000-0000-0000-0000-0000000000NN` (NN = 02–33).

---

### Usuarios (32 atletas)

| # | Nombre | Nacimiento | Sexo | Distrito | Características |
|---|--------|-----------|------|----------|----------------|
| 002 | Sofía Castro Vargas | 2009-03-15 | F | san_pedro | Menor de edad |
| 003 | Mateo Jiménez Mora | 2010-07-22 | M | sabanilla | Menor de edad |
| 004 | Valeria Ureña López | 2011-01-08 | F | mercedes | Menor de edad |
| 005 | Diego Herrera Chaves | 2008-06-15 | M | san_rafael | Menor de edad |
| 006 | Carlos Mora Jiménez | 1990-06-15 | M | san_pedro | Juegos nacionales |
| 007 | Luis Pérez Solano | 1995-11-08 | M | mercedes | Discapacidad física, clasificación funcional b1, juegos internacionales |
| 008 | Martina Rojas Ureña | 2000-01-10 | F | san_rafael | Club, juegos int'l, 3 medallas |
| 009 | Roberto Salas Núñez | 1988-04-22 | M | san_pedro | Familiar en comité |
| 010 | Patricia Vega Brenes | 1993-08-30 | F | sabanilla | — |
| 011 | Fernando Alvarado Cruz | 1997-12-05 | M | mercedes | Comité anterior |
| 012 | Ana Quesada Solís | 1985-05-17 | F | san_rafael | Club |
| 013 | Eduardo Madrigal Ramírez | 2002-09-28 | M | san_pedro | — |
| 014 | Gabriela Chaves Porras | 1991-03-14 | F | sabanilla | Juegos nacionales, familiar en comité |
| 015 | Andrés Montoya Fallas | 1999-11-22 | M | mercedes | — |
| 016 | Laura Obando Zúñiga | 2003-06-08 | F | other | Discapacidad cognitiva, solo disciplinas recreacionales |
| 017 | Miguel Vargas Sequeira | 1986-01-30 | M | san_pedro | Comité anterior |
| 018 | Daniela Blanco Alfaro | 2004-12-11 | F | sabanilla | — |
| 019 | José Méndez Cerdas | 1994-07-19 | M | mercedes | — |
| 020 | Melissa Campos Araya | 1989-09-03 | F | san_rafael | Club, juegos int'l, 2 medallas |
| 021 | Ricardo Soto Leiva | 2001-04-25 | M | other | — |
| 022 | Carolina Badilla Jiménez | 1996-02-14 | F | san_pedro | — |
| 023 | Alejandro Castro Ugalde | 1992-10-08 | M | sabanilla | Juegos int'l, 2 medallas |
| 024 | Natalia Elizondo Mora | 1998-08-27 | F | mercedes | — |
| 025 | Pablo Acuña Herrera | 2005-03-16 | M | san_rafael | — |
| 026 | Stephanie Quirós Vega | 1987-11-29 | F | other | Solo disciplinas recreacionales |
| 027 | Cristian Arce Bolaños | 2003-07-04 | M | san_pedro | Club |
| 028 | Pamela Fonseca Rodríguez | 1995-05-20 | F | sabanilla | — |
| 029 | Esteban Gutiérrez Mata | 2000-09-12 | M | mercedes | — |
| 030 | Diana Mora Solano | 1993-04-07 | F | san_rafael | 1 medalla |
| 031 | Héctor Picado Calvo | 1984-12-15 | M | other | Club, 1 medalla |
| 032 | Marcela Trejos Elizondo | 2002-06-22 | F | san_pedro | — |
| 033 | Javier Ocampo Alfaro | 1997-03-18 | M | sabanilla | — |

### Menores de edad

Los atletas 002–005 tienen `birth_date > (CURRENT_DATE - 18 años)`.  
El trigger `check_guardian_minor` exige `legal_guardian_name` y `legal_guardian_phone` para estos atletas.

### Discapacidades

| Atleta | Tipo | Clasificación funcional |
|--------|------|------------------------|
| 007 Luis | `physical` | `b1` — documento en `https://example.com/test/clasificacion-007.pdf` |
| 016 Laura | `cognitive` | No aplica |

### Invitaciones

**32 `accepted`** — una por atleta, email matching, creadas antes de `auth.users` para reflejar el flujo real de registro.

**5 estados de prueba** para test de UI de gestión:

| Email | Status |
|-------|--------|
| `test.pending.athlete@panelatletas.test` | `sent` |
| `test.pending.admin@panelatletas.test` | `sent` |
| `test.expired1@panelatletas.test` | `expired` |
| `test.expired2@panelatletas.test` | `expired` |
| `test.cancelled1@panelatletas.test` | `cancelled` |

Estas 5 no tienen usuario registrado.

---

## Limpieza

```sql
-- Ejecutar db_clean_test.sql
```

Elimina todo lo que tiene email `%@panelatletas.test`:
1. `users_invitations` (explícito — `fk_invited_by` es SET NULL, no CASCADE)
2. `auth.users` → cascada a `users_profiles` → `athletes`, `users_disciplines`, `medals`

**El admin Brian Ramirez (`brianramirez01arias@gmail.com`) no es afectado.**

## Notas técnicas

- Los triggers `set_profile_id_from_auth`, `set_profile_role_from_invitation`, `set_athlete_id_from_auth`, `set_discipline_user_from_auth` se deshabilitan durante el seed y se rehabilitan al final — dependen de `auth.uid()` que retorna NULL fuera de contexto JWT.
- Los triggers `check_guardian_minor`, `set_representative_from_discipline`, `discipline_active_check` permanecen **activos** durante el seed para validar integridad de los datos.
- `email_confirmed_at = now()` en `auth.users` — el trigger `handle_invitation_accepted` solo dispara en UPDATE, no en INSERT, por eso las invitaciones se insertan como `accepted` manualmente.
