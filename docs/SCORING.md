# Grow AI Card — page completeness scoring

Production ground truth for the completeness percent on `https://mieteru.seoai.space` (droplet `167.172.90.109`).

The percent mirrors `missing_critical_fields()`. It is not the marketing ミエテル度 from `POST /api/score` (`ai_score` / `web_score`).

If `docs/GROW_AI_CARD_CANVAS.md` exists, link here instead of copying this table.

## Formula

```
missing = len(missing_critical_fields())
completeness = (8 - missing) / 8
```

Show `completeness * 100` as the percent. The only values are:

| Missing slots | Percent |
|---------------|---------|
| 8 | 0% |
| 7 | 12.5% |
| 6 | 25% |
| 5 | 37.5% |
| 4 | 50% |
| 3 | 62.5% |
| 2 | 75% |
| 1 | 87.5% |
| 0 | 100% |

Each slot is one eighth. Filling a slot adds 12.5 points. Two keys that share one slot never add 25.

## CRITICAL_FIELDS (8)

Order is the order `missing_critical_fields()` uses. Weight of every slot is **1/8**.

| # | Slot | Keys | Counts as present when |
|---|------|------|------------------------|
| 1 | domain | `domain` | `missing_critical_fields()` does not include this slot. |
| 2 | map / GBP | `google_maps_url`, `gbp_place_id` | Either key is present. Both still count as one slot. |
| 3 | street address | `street_address` | Slot omitted from `missing_critical_fields()`. City-only `location` from create does not fill this slot unless the backend stores it as `street_address` and the function stops reporting it. |
| 4 | phone | `phone` | Slot omitted from `missing_critical_fields()`. |
| 5 | opening hours | `opening_hours` | Slot omitted from `missing_critical_fields()`. Create-form `hours` fills it only when the stored profile satisfies that function. |
| 6 | social links | `social_links` | Slot omitted from `missing_critical_fields()`. |
| 7 | logo | `logo_url` | Slot omitted from `missing_critical_fields()`. |
| 8 | FAQ | `faq_json` | Slot omitted from `missing_critical_fields()`. |

`name`, `industry`, `description` / `summary`, `keywords`, and `location` are not critical slots. They do not change the percent. `email` and `password` are not scored.

## Worked examples

| Present slots | Missing | Percent |
|---------------|---------|---------|
| none | 8 | **0%** |
| `domain` + `phone` + `opening_hours` only | 5 | **37.5%** |
| those three, plus map URL and `social_links` | 3 | **62.5%** |
| map URL set and `gbp_place_id` also set | still one map slot | no extra 12.5 |
| all 8 slots | 0 | **100%** |

## Empty-field highlight rules

1. Highlight only slots that `missing_critical_fields()` returns. Do not highlight diagnosis ミエテル度, email, or password.
2. The map/GBP pair is one control group. Highlight it only when both `google_maps_url` and `gbp_place_id` are missing. Filling either one clears the highlight.
3. Highlight style is a soft grow cue, not an error. Class `grow-empty`: border `rgba(20,180,230,0.7)`, background `rgba(20,180,230,0.08)`. Do not use danger red (`#ff6b8b` / `#ef4444`).
4. Helper copy: 「ここを足すと、AIに見つけてもらいやすくなります」. Do not use 未入力, 不足, 情報が足りません, or “missing”.
5. The widget on `/account` and `/edit` shows the percent and the missing slots in the table order above. At 100%, hide highlights and show 「このページは育ちきっています。」
6. `name` and the summary stay required to save, as on the current edit form. Critical slots are optional. Save must succeed while some of the eight are still missing.
7. Recompute from `missing_critical_fields()` on load and after a successful save.
8. Create (`/signup`) stays short. Do not add the full critical set to the landing page.
9. `?grow=1` on `/edit` and on `/account` scrolls to the grow section and highlights the missing critical slots. `t` is still required. `/edit` still requires `c` (`client_id`). Missing `t` or `c` on edit still redirects to `/login`.

## Widget placement

Paths are on `https://mieteru.seoai.space`.

| Surface | Shows this percent | Grow section via `?grow=1` |
|---------|--------------------|----------------------------|
| `/` (LP) | No | No |
| `/signup` (create) | No | No |
| `/me` (publish) | Diagnosis ミエテル度 only | No |
| `/account` | Yes | Yes, focuses the grow section |
| `/edit` | Yes | Yes, focuses the grow section and the empty critical fields |
