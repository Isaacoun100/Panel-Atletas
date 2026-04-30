# resend-invitation

Edge Function that resends an existing invitation to a user who has not yet accepted it. Restricted to authenticated admins.

## Behavior

1. Validates the caller has an active admin role.
2. Looks up the most recent non-accepted invitation for the given email.
3. Resends the invite email via Supabase Auth (`inviteUserByEmail`).
4. Updates the invitation record: increments `attempts`, refreshes `last_sent_at`, resets `expires_at` to 7 days from now, and sets `status` back to `sent`.

## Endpoint

```
POST /functions/v1/resend-invitation
```

## Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <admin_jwt>` |
| `Content-Type` | `application/json` |

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email address of the existing invitation to resend |

## Responses

| Status | Meaning |
|--------|---------|
| `200` | Invitation resent successfully |
| `400` | Missing email field |
| `401` | Missing or invalid JWT |
| `403` | Caller is not an active admin |
| `404` | No resendable invitation found for this email |
| `500` | Auth or database error |

## Example Call

```ts
const { data, error } = await supabase.functions.invoke('resend-invitation', {
  body: {
    email: 'athlete@example.com',
  },
})
```

## Example Response

```json
{ "success": true, "email": "athlete@example.com", "attempts": 2 }
```
