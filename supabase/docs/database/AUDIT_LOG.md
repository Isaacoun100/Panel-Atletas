# Audit Log

## Purpose

`audit_log` records important system events automatically via Postgres triggers. Powers the **Actividad Reciente** feed on the dashboard without requiring a dedicated activity API.

## Table Schema

```sql
CREATE TABLE public.audit_log (
  id_audit_log  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  action      TEXT NOT NULL,
  actor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name  TEXT,
  record_id   TEXT,
  metadata    JSONB
);
```

| Column | Description |
|---|---|
| `action` | Event type (see Actions below) |
| `actor_id` | UUID of the authenticated user who triggered the event. `NULL` when no session exists (e.g. email confirmation). |
| `table_name` | Source table of the event |
| `record_id` | Primary key of the affected row (as text) |
| `metadata` | Snapshot of relevant fields at the time of the event. Does not change if the source row is later modified or deleted. |

## Actions

| Action | Trigger source | Color (UI) |
|---|---|---|
| `user_registered` | INSERT on `users_profiles` | green |
| `invite_sent` | INSERT on `users_invitations` | blue |
| `invite_accepted` | UPDATE on `users_invitations` (`status → accepted`) | green |
| `profile_updated` | UPDATE on `users_profiles` (name fields changed) | blue |
| `user_deactivated` | UPDATE on `users_profiles` (`is_active TRUE → FALSE`) | red |
| `user_activated` | UPDATE on `users_profiles` (`is_active FALSE → TRUE`) | green |
| `discipline_created` | INSERT on `disciplines` | green |

## Metadata per Action

| Action | Metadata fields |
|---|---|
| `user_registered` | `name`, `first_last_name`, `role` |
| `invite_sent` | `email`, `role` |
| `invite_accepted` | `email`, `role` |
| `profile_updated` | `name`, `first_last_name`, `role` |
| `user_deactivated` | `name`, `first_last_name`, `role` |
| `user_activated` | `name`, `first_last_name`, `role` |
| `discipline_created` | `name`, `discipline_type` |

## Access

- **RLS:** `SELECT` restricted to users where `is_admin() = TRUE`
- **INSERT/UPDATE/DELETE:** not permitted from client — writes only via `SECURITY DEFINER` trigger functions
- All trigger functions have `REVOKE EXECUTE FROM PUBLIC`

## Dashboard Query

The `dashboard-stats` edge function reads the 5 most recent entries:

```sql
SELECT action, actor_id, metadata, created_at
FROM public.audit_log
ORDER BY created_at DESC
LIMIT 5;
```

## Adding New Events

1. Create a `SECURITY DEFINER` trigger function that inserts into `audit_log`
2. Attach it as `AFTER INSERT/UPDATE/DELETE` on the relevant table
3. `REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC`
4. Document the new action in this file and in `triggers.md`
