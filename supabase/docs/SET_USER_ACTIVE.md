# set-user-active

Edge Function that activates or deactivates a user. Simultaneously updates `users_profiles.is_active` and bans/unbans the user in Supabase Auth. Restricted to authenticated admins.

## Behavior

1. Validates the caller has an active admin role.
2. Blocks changing own active status.
3. Updates `users_profiles.is_active` for the target user.
4. Syncs Auth ban state:
   - `is_active: false` → `ban_duration: '876600h'` (permanent ban — user cannot log in)
   - `is_active: true` → `ban_duration: 'none'` (ban lifted — login restored)

## Endpoint

```
POST /functions/v1/set-user-active
```

## Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <admin_jwt>` |
| `Content-Type` | `application/json` |

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | string (UUID) | Yes | Target user's UUID |
| `is_active` | boolean | Yes | `true` to activate, `false` to deactivate |

## Responses

| Status | Meaning |
|--------|---------|
| `200` | Status updated successfully |
| `400` | Missing fields or admin attempting to change own status |
| `401` | Missing or invalid JWT |
| `403` | Caller is not an active admin |
| `500` | DB or Auth update failed |

## Example Call

```ts
const { data, error } = await supabase.functions.invoke('set-user-active', {
  body: { user_id: 'uuid-here', is_active: false },
})
```

## Example Response

```json
{ "success": true, "user_id": "uuid-here", "is_active": false }
```

## Notes

- The `protect_last_admin` trigger blocks deactivating the last active admin.
- `is_active` cannot be changed via direct PATCH to `users_profiles` — only through this function.
