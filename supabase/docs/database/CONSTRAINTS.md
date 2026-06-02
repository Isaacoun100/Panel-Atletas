# Database Constraints

## disciplines

### delete_blocked_by_history
A discipline cannot be hard-deleted if any user has ever been enrolled in it (`users_disciplines` FK `NO ACTION`). Enrollment history is preserved. Use `is_active = false` to retire a discipline instead.

### deactivation_always_allowed
Setting `is_active = false` is always permitted regardless of current enrollments. Existing enrollment rows are kept as historical records.

---

## users_disciplines

### representative_sport_only *(trigger)*
`is_representative` can only be `TRUE` for sport-type disciplines. Enforced by the `set_representative_from_discipline` trigger — raises an exception if `is_representative = TRUE` is set on a recreational discipline.

### enrollment_active_discipline_only *(trigger)*
New enrollments are blocked if the target discipline has `is_active = FALSE`. Enforced by the `discipline_active_check` trigger on INSERT.

---

## athletes

### check_guardian_minor *(trigger)*
`legal_guardian_name` and `legal_guardian_phone` are required when the athlete is under 18, and must be NULL when the athlete is 18 or older. Enforced via trigger instead of CHECK because `birth_date` lives in `users_profiles`.

### weekly_exercise range
`weekly_exercise` must be between 1 and 7 (days per week). NULL is allowed when the field is not filled.

### previous_committee_consistency
`previous_committee_name` must be NULL when `has_previous_committee = FALSE`, and must be set when `has_previous_committee = TRUE`.

### club_consistency
`club_name` must be NULL when `is_club_member = FALSE`, and must be set when `is_club_member = TRUE`.

### disability_consistency
When `has_disability = TRUE`, both `disability_type` and `disability_description` are required. When `has_disability = FALSE`, both must be NULL.

### functional_classification_consistency
When `has_functional_classification = TRUE`, both `classification_category` and `classification_document_url` are required. When `has_functional_classification = FALSE`, both must be NULL.

### consent_required
`accepts_data_usage` and `accepts_info_accuracy` must both be `TRUE`. The athlete record cannot be inserted or updated to a state where either is `FALSE`. This enforces that consent is explicitly granted before the record is persisted.
