# admin-register-admin

**Endpoint:** `POST /functions/v1/admin-register-admin`
**Auth:** Admin JWT required (`role = admin`, `is_active = true`)

Creates a fully registered admin user in one atomic operation. Alternative to the invitation flow for cases where the admin should be pre-registered with a known password.

---

## Flow

1. Validate caller is active admin
2. Validate body fields
3. `auth.admin.createUser` — creates auth user with email confirmed
4. `auth.admin.updateUserById` — sets `app_metadata: { role: admin, is_active: true }`
5. `rpc(admin_register_admin_transaction)` — atomic DB transaction:
   - INSERT `users_invitations` (status: accepted, initial_role: admin)
   - INSERT `users_profiles` (triggers inject `id_user` and `role = admin` from app_metadata)
6. On any failure after step 3: `deleteUser` compensates to avoid orphan auth user

---

## Body

### Required

| Field | Type | Notes |
|---|---|---|
| `email` | string | Must be unique |
| `password` | string | Min 6 chars |
| `name` | string | VARCHAR(64) |
| `first_last_name` | string | VARCHAR(64) |
| `dni_type` | string | `cedula` \| `dimex` \| `pasaporte` |
| `dni` | string | VARCHAR(32), must be unique |
| `birth_date` | string | DATE (YYYY-MM-DD) |
| `sex` | string | `male` \| `female` |

### Optional

| Field | Type | Notes |
|---|---|---|
| `second_last_name` | string \| null | VARCHAR(64) |

---

## Response

**201 Created**
```json
{ "success": true, "user_id": "uuid", "email": "..." }
```

**Error codes:** 400 (validation), 401 (no token), 403 (not admin), 500 (auth/DB failure)

---

## DB function

`public.admin_register_admin_transaction` — SECURITY DEFINER, service_role only.

Uses `set_config('request.jwt.claim.sub', p_user_id, true)` so the `set_profile_id_from_auth` trigger resolves `auth.uid()` to the new admin. Role is injected by `set_profile_role_from_invitation` which reads `app_metadata.role = admin`.
