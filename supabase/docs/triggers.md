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

Overrides the `role` field with the value from the user's accepted invitation. Prevents clients from self-assigning roles.

**Logic:**
1. Looks up the user's email from `auth.users` using `NEW.id_user`
2. Finds the most recent `accepted` invitation for that email
3. Sets `NEW.role` to `initial_role` from the invitation
4. Defaults to `athlete` if no accepted invitation is found

**Note:** Fires after `set_profile_id_from_auth`, so `NEW.id_user` is already set when the role lookup runs.

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
