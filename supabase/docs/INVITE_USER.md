# invite-user

Edge Function that creates and sends invitations to one or more users. Restricted to authenticated admins.

## Behavior

1. Validates the caller has an active admin role.
2. For each email: rejects if an active invitation already exists.
3. Sends an invite email via Supabase Auth (`inviteUserByEmail`), delivering a magic link.
4. Sets `app_metadata.role = initial_role` and `app_metadata.is_active = true` on the auth user — role is available in the JWT from the very first login.
5. Inserts a record in `users_invitations` with status `sent`, expiring in 7 days.
6. Returns per-email results — partial success is possible.

## Endpoint

```
POST /functions/v1/invite-user
```

## Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <admin_jwt>` |
| `Content-Type` | `application/json` |

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `emails` | string[] | Yes | Array of email addresses to invite |
| `initial_role` | string | Yes | Role assigned on registration. One of: `athlete`, `coach`, `admin` |

## Responses

| Status | Meaning |
|--------|---------|
| `200` | All or some invitations sent (check per-email results) |
| `400` | Missing or invalid fields |
| `401` | Missing or invalid JWT |
| `403` | Caller is not an active admin |
| `500` | All invitations failed |

## Example Call

```ts
const { data, error } = await supabase.functions.invoke('invite-user', {
  body: {
    emails: ['athlete@example.com', 'another@example.com'],
    initial_role: 'athlete',
  },
})
```

## Example Response

```json
{
  "results": [
    { "email": "athlete@example.com", "status": "sent" },
    { "email": "another@example.com", "status": "error", "reason": "Invitation already exists" }
  ]
}
```
