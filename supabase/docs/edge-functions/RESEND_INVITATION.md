# resend-invitation

**Endpoint:** `POST /functions/v1/resend-invitation`  
**Auth:** Admin JWT required (`role = admin`, `is_active = true`)

Resends an existing invitation to a user who has not yet accepted it.

---

## Flow

1. Validate caller is active admin
2. Look up most recent non-accepted invitation for given email
3. `inviteUserByEmail` — resends magic link
4. `updateUserById` — re-sets `app_metadata: { role, is_active: true }`
5. UPDATE `users_invitations` — increments `attempts`, refreshes `last_sent_at` and `expires_at` (+7 days), sets `status = sent`

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
| `email` | string | Email of existing invitation to resend |

---

## Response

### Success — 200

```json
{ "success": true, "email": "athlete@example.com", "attempts": 2 }
```

### Error codes

| Code | Reason |
|------|--------|
| `400` | Missing email |
| `401` | Missing or invalid JWT |
| `403` | Caller is not an active admin |
| `404` | No resendable invitation found |
| `500` | Auth or DB error |
