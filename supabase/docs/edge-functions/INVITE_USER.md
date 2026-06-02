# invite-user

**Endpoint:** `POST /functions/v1/invite-user`  
**Auth:** Admin JWT required (`role = admin`, `is_active = true`)

Sends email invitations to one or more users. Partial success is possible — returns per-email results.

---

## Flow

1. Validate caller is active admin
2. For each email: reject if active invitation already exists
3. `inviteUserByEmail` — sends magic link via Supabase Auth
4. `updateUserById` — sets `app_metadata: { role, is_active: true }`
5. INSERT `users_invitations` (status: sent, expires in 7 days)
6. Return per-email results

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
| `emails` | string[] | Array of email addresses |
| `initial_role` | string | `athlete` \| `coach` \| `admin` |

---

## Response

### Success — 200

```json
{
  "results": [
    { "email": "athlete@example.com", "status": "sent" },
    { "email": "other@example.com", "status": "error", "reason": "Invitation already exists" }
  ]
}
```

### Error codes

| Code | Reason |
|------|--------|
| `400` | Missing or invalid fields |
| `401` | Missing or invalid JWT |
| `403` | Caller is not an active admin |
| `500` | All invitations failed |
