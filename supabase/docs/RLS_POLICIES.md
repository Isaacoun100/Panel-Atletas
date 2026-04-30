# Row Level Security Policies

## Overview

All application tables have Row Level Security (RLS) enabled. Access is governed by two principals:

- **Authenticated user** — any signed-in user, identified via `auth.uid()`
- **Admin** — a user whose `role = 'admin'` and `is_active = TRUE` in `users_profiles`, verified by the `is_admin()` security-definer function

---

## Table Policies

### `dni_types`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Authenticated | Always |
| ALL | Admin | `is_admin()` |

---

### `users_profiles`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Authenticated | `id_user = auth.uid()` |
| SELECT | Admin | `is_admin()` |
| INSERT | Authenticated | `id_user = auth.uid()` |
| UPDATE | Authenticated | `id_user = auth.uid()` |
| UPDATE | Admin | `is_admin()` |

Users may only read and modify their own profile record. Admins have unrestricted read and write access across all profiles.

---

### `cantons`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Authenticated | Always |
| ALL | Admin | `is_admin()` |

---

### `districts`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Authenticated | Always |
| ALL | Admin | `is_admin()` |

---

### `disciplines`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Authenticated | Always |
| ALL | Admin | `is_admin()` |

Catalog tables (`cantons`, `districts`, `disciplines`) are publicly readable by any authenticated user. Mutations are restricted to admins.

---

### `addresses`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Authenticated | Address is linked to the requesting user via `athletes.fk_address` |
| SELECT | Admin | `is_admin()` |
| INSERT | Authenticated | Always |
| UPDATE | Authenticated | Address is linked to the requesting user via `athletes.fk_address` |
| ALL | Admin | `is_admin()` |

Users can only read or update addresses that belong to their own athlete record. Any authenticated user may insert a new address row (required during registration before the athlete record is linked).

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

### `users_disciplines`

| Operation | Who | Condition |
|-----------|-----|-----------|
| SELECT | Authenticated | `fk_user = auth.uid()` |
| INSERT | Authenticated | `fk_user = auth.uid()` |
| UPDATE | Authenticated | `fk_user = auth.uid()` |
| DELETE | Authenticated | `fk_user = auth.uid()` |
| ALL | Admin | `is_admin()` |

Users have full self-service control over their own discipline registrations. Admins manage all records.

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
