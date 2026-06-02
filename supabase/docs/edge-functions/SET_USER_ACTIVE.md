# set-user-active

**Endpoint:** `POST /functions/v1/set-user-active`  
**Auth:** Admin JWT required (`role = admin`, `is_active = true`)

Activates or deactivates a user. Syncs `users_profiles.is_active` and Auth ban state atomically.

---

## Flow

1. Validate caller is active admin
2. Block changing own active status
3. UPDATE `users_profiles.is_active` for target user
4. `updateUserById` — sync Auth ban:
   - `is_active: false` → `ban_duration: '876600h'` (permanent — login blocked)
   - `is_active: true` → `ban_duration: 'none'` (ban lifted)

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
| `user_id` | string (UUID) | Target user's UUID |
| `is_active` | boolean | `true` to activate, `false` to deactivate |

---

## Response

### Success — 200

```json
{ "success": true, "user_id": "uuid-here", "is_active": false }
```

### Error codes

| Code | Reason |
|------|--------|
| `400` | Missing fields or admin changing own status |
| `401` | Missing or invalid JWT |
| `403` | Caller is not an active admin |
| `500` | DB or Auth update failed |

---

## Notes

- `protect_last_admin` trigger blocks deactivating the last active admin
- `is_active` cannot be changed via direct PATCH to `users_profiles` — only through this function
