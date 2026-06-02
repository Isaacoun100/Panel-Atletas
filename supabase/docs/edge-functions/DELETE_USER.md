# delete-user

**Endpoint:** `POST /functions/v1/delete-user`  
**Auth:** Admin JWT required (`role = admin`, `is_active = true`)

Permanently deletes a non-admin user from Supabase Auth and all related data.

---

## Flow

1. Validate caller is active admin
2. Block deleting own account
3. Block deleting other admin users
4. `deleteUser` — removes auth user, cascades to all related tables

---

## Cascades on Deletion

| Table | Behavior |
|-------|----------|
| `users_profiles` | FK CASCADE |
| `athletes` | FK CASCADE |
| `users_disciplines` | FK CASCADE |
| `medals` | FK CASCADE |
| `users_invitations` | Trigger `delete_invitation_on_user_delete` (email match) |

---

## Request

### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <admin_jwt>` |
| `Content-Type` | `application/json` |

### Body

#### Required

| Field | Type | Notes |
|-------|------|-------|
| `user_id` | string (UUID) | UUID of user to delete |

---

## Response

### Success — 200

```json
{ "success": true, "user_id": "uuid-here" }
```

### Error codes

| Code | Reason |
|------|--------|
| `400` | Missing `user_id` or admin deleting own account |
| `401` | Missing or invalid JWT |
| `403` | Caller is not active admin, or target is an admin |
| `500` | Auth deletion failed |

---

## Notes

- **Irreversible.** All user data permanently removed.
- Deactivate the user instead if history preservation matters — `users_disciplines` enrollment history is also deleted.
