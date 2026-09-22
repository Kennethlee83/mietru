# Droplet audit — 2026-09-22 (read-only)

Ground truth for the Grow AI card work. `Kennethlee83/mietru` is **not** the droplet tree. Python changes below have to be applied on the server. Do not rsync this repo’s `mieteru/edit.html` over production: the live page is ahead of this repo.

## Access

| Check | Result |
|---|---|
| `ssh root@167.172.90.109` | **Permission denied (publickey).** This environment has no droplet key. `missing_fields_mailer.py`, `upsert_public_profile`, `_MIETERU_PROFILE_FIELDS`, and crontab were **not** opened. |
| `https://seoai.space/mieteru/edit` | 301 to `https://mieteru.seoai.space/edit` |
| Live HTML | Fetched 2026-09-22 from `https://mieteru.seoai.space/edit` (1025 lines) and `/account` (487 lines). |

Paths the operator named, unread: HTML `/opt/seoai/public_site/mieteru/` → `/mnt/volume_sgp1_01/seoai_public_site/mieteru/`. SaaS `/opt/seoai/ai_visibility_pilot` → `/mnt/volume_sgp1_01/seoai/ai_visibility_pilot/`.

## Live HTML (verified)

`edit` and `account` already carry `PATCH-2026-09-22-GROW-AI-CARD`.

Edit `saveEdits` posts `/api/mieteru/page/update` with the older fields **and** the grow fields:

`name`, `industry`, `location`, `summary`, `phone`, `hours`, `keywords`, `domain`, `image`, `lead_notification_email`, `google_maps_url`, `social_links` (JSON string), `logo_url`, `faq_json` (JSON string of `{question, answer}`).

It does **not** post `gbp_place_id` or `street_address`. A saved `street_address` is copied into the location box only when location is empty. The maps check is `google_maps_url` only.

Completeness on the live edit page is `round(100 * filled / 8)` for: domain, maps URL, street-like location (`丁目` / `番地` / `号` / `〒` / a digit), phone, hours, any SNS URL, logo URL, one FAQ pair. City-only `横浜市中区` does not count. The checklist still says **まだない項目** (sharper than the grow-tone mail copy).

`?grow=1` scrolls to `#grow-ai-card`. Create (`/signup`, formerly demo) has no grow fields. `me` publish does not add grow fields.

Account reads `plan.days_left` from `/api/mieteru/pages`. When the plan is unpaid, `days_left` is 1–7, and some page has `completeness_pct < 100`, it shows a soft nudge whose link is `/edit?t=…&c=…&grow=1`. `?grow=1` on the dashboard also forces that nudge.

Empty grow inputs are still posted as `""` / `"[]"` is not used for FAQ (empty FAQ is `"[]"` via `JSON.stringify([])`). `social_links` is `""` when there are no URLs. Combined with an overwrite upsert, a save from this form **clears** stored grow columns once those keys are on the allowlist, unless the GET round-trips them into the form first.

## Backend (operator brief — not file-verified)

Treat this as the deploy spec until someone with a key reads the files.

- Mailer: `saas/missing_fields_mailer.py` + `missing_fields_mailer_runner.py`. Cron `20 11 * * *`. Cooldown 7 days. JA subject currently scolds missing citation fields.
- `CRITICAL_FIELDS`: `domain`, `google_maps_url` / `gbp_place_id`, `street_address`, `phone`, `opening_hours`, `social_links`, `logo_url`, `faq_json`.
- `_MIETERU_PROFILE_FIELDS` does not include maps / social / logo / faq, so the live HTML payload is likely dropped.
- `upsert_public_profile` assigns `social_links`, `google_maps_url`, `logo_url`, `faq_json` directly (not `COALESCE`). A Mieteru save that omits them, or sends blanks, **clears** them.
- `profile_completeness()` is thinner than `missing_critical_fields()`. Percent for the widget and for `completeness_pct` should come from the critical-field helper.
- Trial unpublish timer is 03:15 JST. That job is separate from the grow nudge and from the 11:20 mailer. Do not tie unpublish to the soft reminder.
- `days_left` is already on `/api/mieteru/pages` (the live dashboard reads `plan.days_left`).

## Droplet deploy (do not do it from this repo)

1. Add to `_MIETERU_PROFILE_FIELDS` and to the `publish_core` pass-through: `google_maps_url`, `gbp_place_id`, `street_address`, `social_links`, `logo_url`, `faq_json`. Keep returning them from `page/get` so the edit form round-trips.
2. Change the upsert so a **missing** key keeps the stored value (`COALESCE` / omit). Apply the same to `google_maps_url`, `gbp_place_id`, `street_address`, `social_links`, `logo_url`, `faq_json`. An explicit empty value may clear; a key that was never on the profile must not.
3. Until step 2 is in, do not deploy a client that posts `""` for those columns on every save. This repo’s scaffold omits empty grow keys for that reason. Live `edit.html` does not omit them.
4. Point `completeness_pct` at `missing_critical_fields()` (8 checks, `gbp_place_id` satisfies maps). Stop using the thin `profile_completeness()` for this percent.
5. Replace the mailer JA subject and body with `mieteru/email/grow-card.ja.txt`. CTA must be `https://mieteru.seoai.space/edit?t={token}&c={client_id}&grow=1#grow-ai-card`. Keep the 7-day cooldown. EN file is optional.
6. Leave the 03:15 JST unpublish timer alone. The `days_left <= 7` nudge is already on the live account page.
