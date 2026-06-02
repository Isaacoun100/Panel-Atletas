# admin-register-athlete

**Endpoint:** `POST /functions/v1/admin-register-athlete`
**Auth:** Admin JWT required (`role = admin`, `is_active = true`)

Creates a fully registered athlete in one atomic operation. Replaces the manual invitation → profile → athlete flow for admins registering athletes directly.

---

## Flow

1. Validate caller is active admin
2. Validate all body fields
3. Query disciplines to validate IDs exist and `is_representative` rules
4. `auth.admin.createUser` — creates auth user with email confirmed
5. `auth.admin.updateUserById` — sets `app_metadata: { role: athlete, is_active: true }`
6. `rpc(admin_register_athlete_transaction)` — atomic DB transaction:
   - INSERT `users_invitations` (status: accepted)
   - INSERT `users_profiles` (triggers inject `id_user` and `role`)
   - INSERT `athletes`
   - INSERT `users_disciplines` per discipline
   - INSERT `medals` if provided
7. On any failure after step 4: `deleteUser` compensates to avoid orphan auth user

---

## Body

### Required

| Field | Type | Notes |
|---|---|---|
| `email` | string | Must be unique |
| `password` | string | Min 6 chars |
| `name` | string | VARCHAR(64) |
| `first_last_name` | string | VARCHAR(64) |
| `dni_type` | string | `cedula` \| `dimex` \| `pasaporte` |
| `dni` | string | VARCHAR(32), must be unique |
| `birth_date` | string | DATE (YYYY-MM-DD) |
| `sex` | string | `male` \| `female` |
| `phone` | string | VARCHAR(64) |
| `district_of_residence` | string | `san_pedro` \| `sabanilla` \| `mercedes` \| `san_rafael` \| `other` |
| `weekly_exercise` | integer | 1–7 |
| `satisfaction_level` | string | `very_satisfied` \| `satisfied` \| `neutral` \| `dissatisfied` |
| `facility_satisfaction_level` | string | `yes` \| `no` \| `partial` |
| `disciplines` | array | `[{ id: integer, is_representative: boolean }]` — non-empty |
| `accepts_data_usage` | boolean | Must be `true` |
| `accepts_info_accuracy` | boolean | Must be `true` |

### Optional

| Field | Type | Notes |
|---|---|---|
| `second_last_name` | string \| null | VARCHAR(64) |
| `legal_guardian_name` | string \| null | Required if athlete is under 18 (trigger enforces) |
| `legal_guardian_phone` | string \| null | Required if athlete is under 18 |
| `nacional_games_participation` | boolean | Default `false` |
| `international_games_participation` | boolean | Default `false` |
| `has_family_support` | boolean | Default `false` |
| `has_family_in_committee` | boolean | Default `false` |
| `has_previous_committee` | boolean | Default `false` |
| `previous_committee_name` | string \| null | Required when `has_previous_committee = true`, must be null when `false` |
| `is_club_member` | boolean | Default `false` |
| `club_name` | string \| null | Required when `is_club_member = true`, must be null when `false` |
| `has_disability` | boolean | Default `false` |
| `disability_type` | string \| null | `physical` \| `cognitive` — required when `has_disability = true`, must be null when `false` |
| `disability_description` | string \| null | Required when `has_disability = true`, must be null when `false` |
| `has_functional_classification` | boolean | Default `false` |
| `classification_category` | string \| null | `a1` \| `a2` \| `b1` \| `b2` \| `c1` \| `c2` — required when `has_functional_classification = true` |
| `classification_document_url` | string \| null | Required when `has_functional_classification = true` |
| `medals` | array | `[{ competition_name, year, medal_type }]` — `medal_type`: `gold` \| `silver` \| `bronze` |

### Discipline rules
- `disciplines` array must reference existing `id_discipline` values
- `is_representative: true` only valid for `discipline_type = 'sport'` — edge returns 400 if sent for recreational

---

## Response

**201 Created**
```json
{ "success": true, "user_id": "uuid", "email": "..." }
```

**Error codes:** 400 (validation), 401 (no token), 403 (not admin), 500 (auth/DB failure)

---

## DB function

`public.admin_register_athlete_transaction` — SECURITY DEFINER, service_role only.

Uses `set_config('request.jwt.claim.sub', p_user_id, true)` so ID-injection triggers (`set_profile_id_from_auth`, `set_athlete_id_from_auth`, `set_discipline_user_from_auth`) resolve `auth.uid()` to the new athlete, not the calling admin.
