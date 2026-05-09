# delete-user

Edge Function that permanently deletes a non-admin user from Supabase Auth and all related data. Restricted to authenticated admins.

## Behavior

1. Validates the caller has an active admin role.
2. Blocks deleting own account.
3. Blocks deleting other admin users.
4. Calls `auth.admin.deleteUser(user_id)` — cascades to all related tables.

## Cascades on Deletion

| Table | Behavior |
|-------|----------|
| `users_profiles` | FK CASCADE — deleted automatically |
| `athletes` | FK CASCADE — deleted automatically |
| `users_disciplines` | FK CASCADE — deleted automatically |
| `medals` | FK CASCADE — deleted automatically |
| `users_invitations` | Trigger `delete_invitation_on_user_delete` — deleted by email match |

## Endpoint

```
POST /functions/v1/delete-user
```

## Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <admin_jwt>` |
| `Content-Type` | `application/json` |

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | string (UUID) | Yes | UUID of the user to delete |

## Responses

| Status | Meaning |
|--------|---------|
| `200` | User deleted successfully |
| `400` | Missing `user_id` or admin attempting to delete own account |
| `401` | Missing or invalid JWT |
| `403` | Caller is not an active admin, or target user is an admin |
| `500` | Auth deletion failed |

## Example Call

```ts
const { data, error } = await supabase.functions.invoke('delete-user', {
  body: { user_id: 'uuid-here' },
})
```

## Example Response

```json
{ "success": true, "user_id": "uuid-here" }
```

## Notes

- ⚠️ Irreversible. All user data is permanently removed.
- Discipline enrollment history (`users_disciplines`) is also removed — consider deactivating the user instead if history preservation matters.
