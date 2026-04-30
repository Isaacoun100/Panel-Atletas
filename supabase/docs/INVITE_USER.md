# invite-user

Edge Function that creates and sends an invitation to a new user. Restricted to authenticated admins.

## Behavior

1. Validates the caller has an active admin role.
2. Rejects if an active invitation already exists for the given email.
3. Sends an invite email via Supabase Auth (`inviteUserByEmail`), which delivers a magic link.
4. Inserts a record in `users_invitations` with status `sent`, expiring in 7 days.

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
| `email` | string | Yes | Email address to invite |
| `initial_role` | string | Yes | Role assigned on registration. One of: `athlete`, `coach`, `admin` |

## Responses

| Status | Meaning |
|--------|---------|
| `200` | Invitation sent successfully |
| `400` | Missing or invalid fields |
| `401` | Missing or invalid JWT |
| `403` | Caller is not an active admin |
| `409` | Active invitation already exists for this email |
| `500` | Auth or database error |

## Example Call

```ts
const { data, error } = await supabase.functions.invoke('invite-user', {
  body: {
    email: 'athlete@example.com',
    initial_role: 'athlete',
  },
})
```

## Example Response

```json
{ "success": true, "email": "athlete@example.com" }
```
