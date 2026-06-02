# Storage RLS — panel_files

**Bucket:** `panel_files` (private)  
**Migration:** `storage_rls_panel_files`

---

## Folder structure

```
panel_files/
├── avatars/{user_id}/filename   — profile photos
└── files/{user_id}/filename     — medical/classification documents
```

Path segment positions (1-indexed via `split_part`):
- `[1]` = folder (`avatars` | `files`)
- `[2]` = `user_id` (owner)

---

## Owner rule

A user is considered **owner** of an object when:
1. `split_part(name, '/', 2) = auth.uid()::text`
2. `users_profiles.is_active = true` for that user

An inactive user cannot read or write their own files.

---

## Admin rule

A caller is **admin** when `users_profiles` has `role = 'admin' AND is_active = true` for `auth.uid()`.

---

## Policies

### `avatars/`

| Operation | Who |
|-----------|-----|
| SELECT | owner (active) or admin |
| INSERT | owner (active) only |
| UPDATE | owner (active) or admin |
| DELETE | owner (active) or admin |

### `files/` (documentos médicos — incapacidad/clasificación funcional)

| Operation | Who |
|-----------|-----|
| SELECT | owner (active) or admin |
| INSERT | owner (active) or admin* |
| UPDATE | owner (active) or admin |
| DELETE | admin only |

\* Admin INSERT allowed because `admin-register-athlete` uploads the document on behalf of the new athlete during registration.

---

## Notes

- No public read — all access requires authenticated session
- Signed URLs required for serving files to clients (`createSignedUrl`)
- `classification_document_url` stored in `athletes` table references a path in `files/{user_id}/`
- DELETE on `files/` restricted to admin: medical documents must not be self-deleted
