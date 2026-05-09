# Row Level Security Policies

## Overview

All application tables have Row Level Security (RLS) enabled. Access is governed by two principals:

- **Authenticated user** — any signed-in user, identified via `auth.uid()`
- **Admin** — a user whose `role = 'admin'` and `is_active = TRUE` in `users_profiles`, verified by the `is_admin()` security-definer function

---

## Table Policies

### `users_profiles`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | `profiles_select` | `id_user = auth.uid() OR is_admin()` |
| INSERT | `profiles_insert` | `id_user = auth.uid()` |
| UPDATE | `profiles_update` | See details below |

**`profiles_update` WITH CHECK:**
- **Admin updating another user:** allowed, but `is_active` is locked to its current value via `private.get_any_is_active()`. To change `is_active`, use the `set-user-active` edge function.
- **Self update:** allowed, but `role` and `is_active` are both locked to current values.

`is_active` cannot be changed via direct PATCH by anyone — admin or user. Use the `set-user-active` edge function which also syncs Auth ban state.

---

### `disciplines`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | `disciplines_select` | Always (any authenticated user) |
| INSERT | `disciplines_insert` | `is_admin()` |
| UPDATE | `disciplines_update` | `is_admin()` |
| DELETE | `disciplines_delete` | `is_admin()` |

Readable by any authenticated user. Mutations restricted to admins. Admin split into explicit per-operation policies to avoid duplicate SELECT evaluation.

---

### `users_disciplines`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | `user_disciplines_select` | `fk_user = auth.uid() OR is_admin()` |
| INSERT | `user_disciplines_insert` | `fk_user = auth.uid() OR is_admin()` |
| UPDATE | `user_disciplines_update` | `fk_user = auth.uid() OR is_admin()` |
| DELETE | `user_disciplines_delete` | `fk_user = auth.uid() OR is_admin()` |

Users have full self-service control over their own discipline enrollments.

---

### `athletes`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | `athletes_select` | `id_user = auth.uid() OR is_admin()` |
| INSERT | `athletes_insert` | `id_user = auth.uid() OR is_admin()` |
| UPDATE | `athletes_update` | `id_user = auth.uid() OR is_admin()` |
| DELETE | `athletes_delete` | `is_admin()` |

Each athlete may only access and modify their own record. Only admins can delete athlete records.

---

### `medals`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | `medals_select` | `id_user = auth.uid() OR is_admin()` |
| INSERT | `medals_insert` | `id_user = auth.uid() OR is_admin()` |
| UPDATE | `medals_update` | `id_user = auth.uid() OR is_admin()` |
| DELETE | `medals_delete` | `id_user = auth.uid() OR is_admin()` |

Users have full control over their own medal records.

---

### `users_invitations`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | `invitations_select` | `is_admin()` |

Admins can read invitation records via the Data API. All mutations (INSERT, UPDATE, DELETE) are handled exclusively by Edge Functions using the service role key, which bypasses RLS.

---

## Helper Functions

| Function | Schema | Purpose |
|----------|--------|---------|
| `is_admin()` | `public` | Returns TRUE if caller has `role='admin'` and `is_active=TRUE` |
| `get_my_role()` | `public` | Returns the caller's current `role` |
| `get_my_is_active()` | `public` | Returns the caller's current `is_active` |
| `get_any_is_active(uuid)` | `private` | Returns `is_active` for any user by ID — used internally by `profiles_update` to lock is_active for admin updates |

All are `SECURITY DEFINER` to bypass RLS during execution, preventing infinite recursion. `get_any_is_active` is in the `private` schema — not exposed via PostgREST `/rpc/`.
