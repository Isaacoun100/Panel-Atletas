# Database Triggers

## on_user_email_confirmed

**Table:** `auth.users`
**Event:** `AFTER UPDATE`
**Function:** `handle_invitation_accepted()`

When a user clicks the invitation link and Supabase verifies their email, `email_confirmed_at` changes from `NULL` to a timestamp. This trigger detects that transition and marks the corresponding invitation as `accepted`.

**Logic:**
- Fires only when `email_confirmed_at` goes from `NULL` → non-null
- Updates `users_invitations.status = 'accepted'` where `email` matches and `status IN ('sent', 'expired')`
- Covers expired invitations in case the user confirmed after the expiry window but Supabase still accepted the token

**Note:** This trigger runs on the `auth` schema and is not visible in the Supabase dashboard triggers UI, but it is active in the database.

---

## set_profile_id_from_auth

**Table:** `public.users_profiles`
**Event:** `BEFORE INSERT`
**Function:** `handle_profile_id_from_auth()`

Automatically sets `id_user` from the authenticated session. The client does not send `id_user` in the request body — the trigger injects it server-side.

**Logic:**
- Sets `NEW.id_user = auth.uid()` before the row is written
- Client-supplied `id_user` is ignored even if present

**Why:** Prevents clients from inserting profiles for other users. Combined with the RLS INSERT policy (`id_user = auth.uid()`), ownership is enforced at both the trigger and policy level.

---

## set_profile_role_from_invitation

**Table:** `public.users_profiles`
**Event:** `BEFORE INSERT`
**Function:** `handle_profile_role_from_invitation()`

When a user creates their profile for the first time, this trigger overrides the `role` field with the value stored in their invitation record. This prevents clients from self-assigning roles.

**Logic:**
1. Looks up the user's email from `auth.users` using `NEW.id_user`
2. Finds the most recent `accepted` invitation for that email in `users_invitations`
3. Sets `NEW.role` to `initial_role` from the invitation
4. Defaults to `athlete` if no accepted invitation is found

**Why BEFORE INSERT:** The role must be overwritten before the row is written. The client-supplied value is ignored regardless of what is sent.

**Role change after insert:** Admins can update `role` directly via the `"Admins can update all profiles"` RLS policy. Regular users cannot change their own role — the UPDATE policy enforces that `role` remains unchanged.

**Note:** This trigger fires after `set_profile_id_from_auth`, so `NEW.id_user` is already set when the role lookup runs.

---

## set_athlete_id_from_auth

**Table:** `public.athletes`
**Event:** `BEFORE INSERT`
**Function:** `handle_athlete_id_from_auth()`

Automatically sets `id_user` from the authenticated session. Client does not send `id_user` in the request body.

**Logic:** Sets `NEW.id_user = auth.uid()` before the row is written.

---

## set_discipline_user_from_auth

**Table:** `public.users_disciplines`
**Event:** `BEFORE INSERT`
**Function:** `handle_discipline_user_from_auth()`

Automatically sets `fk_user` from the authenticated session. Client does not send `fk_user` in the request body.

**Logic:** Sets `NEW.fk_user = auth.uid()` before the row is written.

---

## block_duplicate_address

**Table:** `public.addresses`
**Event:** `BEFORE INSERT`
**Function:** `handle_block_duplicate_address()`

Prevents a user from inserting more than one address. After the first address is created and linked via `athletes.fk_address`, all subsequent inserts are blocked.

**Logic:** Checks if the authenticated user already has `fk_address IS NOT NULL` in their athlete record. If so, raises an exception with message `"User already has an address. Use UPDATE instead."`.

---

## delete_invitation_on_user_delete

**Table:** `auth.users`
**Event:** `AFTER DELETE`
**Function:** `handle_delete_invitation_on_user_delete()`

When a user is deleted from `auth.users`, their invitation record is also deleted from `users_invitations`.

**Logic:** Deletes all rows in `users_invitations` where `email = OLD.email`.

**Note:** This trigger runs on the `auth` schema and is not visible in the Supabase dashboard triggers UI.
