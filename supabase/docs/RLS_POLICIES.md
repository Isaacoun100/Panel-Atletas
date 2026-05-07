# Row Level Security Policies

## Overview

All application tables have Row Level Security (RLS) enabled. Access is governed by two principals:

- **Authenticated user** — any signed-in user, identified via `auth.uid()`
- **Admin** — a user whose `role = 'admin'` and `is_active = TRUE` in `users_profiles`, verified by the `is_admin()` security-definer function

---

## Table Policies

### `users_profiles`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Authenticated | `id_user = auth.uid()` |
| SELECT | Admin | `is_admin()` |
| INSERT | Authenticated | `id_user = auth.uid()` |
| UPDATE | Authenticated | `id_user = auth.uid()`, role column cannot change |
| UPDATE | Admin | `is_admin()` |

Users may only read and modify their own profile. Admins have unrestricted read and write access. The user UPDATE policy enforces that `role` cannot be changed by the user — only admins can change roles.

---

### `disciplines`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Authenticated | Always |
| ALL | Admin | `is_admin()` |

Readable by any authenticated user. Mutations restricted to admins.

---

### `users_disciplines`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Authenticated | `fk_user = auth.uid()` |
| INSERT | Authenticated | `fk_user = auth.uid()` |
| UPDATE | Authenticated | `fk_user = auth.uid()` |
| DELETE | Authenticated | `fk_user = auth.uid()` |
| ALL | Admin | `is_admin()` |

Users have full self-service control over their own discipline enrollments.

---

### `athletes`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Authenticated | `id_user = auth.uid()` |
| INSERT | Authenticated | `id_user = auth.uid()` |
| UPDATE | Authenticated | `id_user = auth.uid()` |
| ALL | Admin | `is_admin()` |

Each athlete may only access and modify their own record.

---

### `medals`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Authenticated | `id_user = auth.uid()` |
| INSERT | Authenticated | `id_user = auth.uid()` |
| UPDATE | Authenticated | `id_user = auth.uid()` |
| DELETE | Authenticated | `id_user = auth.uid()` |
| ALL | Admin | `is_admin()` |

Users have full control over their own medal records.

---

### `users_invitations`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Admin | `is_admin()` |

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
