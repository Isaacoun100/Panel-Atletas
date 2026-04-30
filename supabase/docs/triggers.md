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
