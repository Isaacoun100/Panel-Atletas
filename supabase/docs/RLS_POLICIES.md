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
| UPDATE | `profiles_update` | `id_user = auth.uid() OR is_admin()`. Role column locked for non-admins via WITH CHECK. |

Merged user + admin into single policy per operation. `role` cannot be changed by regular users — only admins pass the WITH CHECK for role updates.

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

## Helper Function

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users_profiles
    WHERE id_user = auth.uid()
      AND role = 'admin'
      AND is_active = TRUE
  );
$$;
```

The function runs with `SECURITY DEFINER` to bypass RLS on `users_profiles` during the admin check, preventing infinite recursion.
