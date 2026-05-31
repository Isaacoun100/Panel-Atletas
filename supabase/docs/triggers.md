# Database Triggers

## on_user_email_confirmed

**Table:** `auth.users`
**Event:** `AFTER UPDATE`
**Function:** `handle_invitation_accepted()`

When a user clicks the invitation link and Supabase verifies their email, `email_confirmed_at` changes from `NULL` to a timestamp. This trigger marks the corresponding invitation as `accepted`.

**Logic:**
- Fires only when `email_confirmed_at` goes from `NULL` → non-null
- Updates `users_invitations.status = 'accepted'` where `email` matches and `status IN ('sent', 'expired')`

**Note:** Runs on the `auth` schema — not visible in Supabase dashboard triggers UI.

---

## delete_invitation_on_user_delete

**Table:** `auth.users`
**Event:** `AFTER DELETE`
**Function:** `handle_delete_invitation_on_user_delete()`

When a user is deleted from `auth.users`, their invitation record is deleted from `users_invitations`.

**Logic:** Deletes all rows in `users_invitations` where `email = OLD.email`.

**Note:** Runs on the `auth` schema — not visible in Supabase dashboard triggers UI.

---

## set_profile_id_from_auth

**Table:** `public.users_profiles`
**Event:** `BEFORE INSERT`
**Function:** `handle_profile_id_from_auth()`

Injects `id_user` from the authenticated session. Client does not send `id_user` in the request body.

**Logic:** Sets `NEW.id_user = auth.uid()` before the row is written.

**Why:** Prevents clients from inserting profiles for other users. Combined with the RLS INSERT policy, ownership is enforced at both levels.

---

## set_profile_role_from_invitation

**Table:** `public.users_profiles`
**Event:** `BEFORE INSERT`
**Function:** `handle_profile_role_from_invitation()`

Overrides the `role` field with the value from `auth.users.raw_app_meta_data`. Prevents clients from self-assigning roles.

**Logic:**
1. Reads `raw_app_meta_data->>'role'` from `auth.users` for `NEW.id_user`
2. Sets `NEW.role` to that value cast to `user_role`
3. Defaults to `athlete` if `raw_app_meta_data` has no `role` key

**Note:** Fires after `set_profile_id_from_auth`, so `NEW.id_user` is already set. Role originates from the `invite-user` edge function which sets `app_metadata.role` at invitation time via `updateUserById`.

**Role change after insert:** Admins can update `role` via the `"Admins can update all profiles"` RLS policy. Regular users cannot change their own role — the UPDATE policy enforces it.

---

## set_athlete_id_from_auth

**Table:** `public.athletes`
**Event:** `BEFORE INSERT`
**Function:** `handle_athlete_id_from_auth()`

Injects `id_user` from the authenticated session. Client does not send `id_user` in the request body.

**Logic:** Sets `NEW.id_user = auth.uid()` before the row is written.

---

## set_discipline_user_from_auth

**Table:** `public.users_disciplines`
**Event:** `BEFORE INSERT`
**Function:** `handle_discipline_user_from_auth()`

Injects `fk_user` from the authenticated session. Client does not send `fk_user` in the request body.

**Logic:** Sets `NEW.fk_user = auth.uid()` before the row is written.

---

## protect_last_admin

**Table:** `public.users_profiles`
**Event:** `BEFORE DELETE OR UPDATE`
**Function:** `handle_last_admin_protection()`

Prevents removing the last active admin — by deleting their profile, downgrading their role, or deactivating their account.

**Logic:**
- Only fires when affected row has `role = 'admin'` AND `is_active = TRUE`
- On DELETE: always checks remaining admin count
- On UPDATE: only checks if `role` changes away from `admin` OR `is_active` becomes `FALSE`
- If no other active admin exists, raises: `Cannot remove the last active admin.`

---

## check_guardian_minor

**Table:** `public.athletes`
**Event:** `BEFORE INSERT OR UPDATE`
**Function:** `handle_guardian_minor_check()`

Enforces that guardian fields are only present for athletes under 18, and are required when the athlete is a minor.

**Logic:**
- Looks up `birth_date` from `users_profiles` for the athlete being inserted/updated
- If the athlete is **18 or older**: `legal_guardian_name` and `legal_guardian_phone` must be NULL
- If the athlete is **under 18**: both `legal_guardian_name` and `legal_guardian_phone` are required

**Why a trigger instead of a CHECK constraint:** CHECK constraints cannot reference other tables. The birth_date lives in `users_profiles`, so cross-table validation requires a trigger.

---

## set_representative_from_discipline

**Table:** `public.users_disciplines`
**Event:** `BEFORE INSERT OR UPDATE`
**Function:** `handle_discipline_representative_check()`

Enforces that `is_representative = TRUE` is only valid for sport-type disciplines.

**Logic:**
- Looks up `discipline_type` from `disciplines` for the enrollment's `fk_discipline`
- If `discipline_type = 'recreational'` and `is_representative = TRUE` → raises exception

**Error:** `is_representative can only be true for sport disciplines.`

---

## discipline_active_check

**Table:** `public.users_disciplines`
**Event:** `BEFORE INSERT`
**Function:** `handle_discipline_active_check()`

Blocks enrollment in disciplines that are inactive (`is_active = FALSE`).

**Logic:**
- Looks up `is_active` from `disciplines` for the enrollment's `fk_discipline`
- If `is_active = FALSE` → raises exception

**Error:** `Cannot enroll in an inactive discipline.`

**Note:** Does not fire on UPDATE — existing enrollments are preserved as historical records even if the discipline is later deactivated.

---

## audit_user_registered

**Table:** `public.users_profiles`
**Event:** `AFTER INSERT`
**Function:** `handle_audit_user_registered()`

Logs a `user_registered` event to `audit_log` whenever a new profile is created.

**Metadata:** `{ name, first_last_name, role }`

**Note:** Fires after `set_profile_id_from_auth` and `set_profile_role_from_invitation`, so `id_user` and `role` are already resolved.

---

## audit_invitation

**Table:** `public.users_invitations`
**Event:** `AFTER INSERT OR UPDATE`
**Function:** `handle_audit_invitation()`

Logs invitation lifecycle events to `audit_log`.

**Logic:**
- On INSERT → logs `invite_sent` with `actor_id = fk_invited_by`
- On UPDATE, only when `status` changes to `'accepted'` → logs `invite_accepted` with `actor_id = NULL` (triggered by email confirmation, no authenticated session)

**Metadata:** `{ email, role }`

---

## audit_profile_updated

**Table:** `public.users_profiles`
**Event:** `AFTER UPDATE`
**Function:** `handle_audit_profile_updated()`

Logs profile change events to `audit_log`. Fires on three distinct conditions:

**Logic:**
- `is_active` changes `TRUE → FALSE` → logs `user_deactivated`
- `is_active` changes `FALSE → TRUE` → logs `user_activated`
- `name`, `first_last_name`, or `second_last_name` changes → logs `profile_updated`
- Any other UPDATE (e.g. `role`, `profile_image_url`) → no log entry

**Metadata:** `{ name, first_last_name, role }`

---

## audit_discipline_created

**Table:** `public.disciplines`
**Event:** `AFTER INSERT`
**Function:** `handle_audit_discipline_created()`

Logs a `discipline_created` event to `audit_log` whenever a new discipline is added.

**Metadata:** `{ name, discipline_type }`

---

## sync_profile_metadata

**Table:** `public.users_profiles`
**Event:** `AFTER INSERT OR UPDATE OF role, is_active`
**Function:** `sync_profile_to_auth_metadata()`

Syncs `role` and `is_active` into `auth.users.raw_app_meta_data` so the JWT carries business-level claims without a second API call.

**Logic:**
- Merges (`||`) into existing `raw_app_meta_data` — does not overwrite provider/providers keys
- Only fires on INSERT or when `role` or `is_active` changes

**JWT result:** `app_metadata.role` + `app_metadata.is_active` available on next login or token refresh.

**Note:** `is_active` in the JWT is UI-only (routing, hiding buttons). Actual access control is enforced by RLS via `get_user_is_active()` on every query, regardless of token content.
