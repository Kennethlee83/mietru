# Grow AI Card — browser QA checklist

Step-by-step check of the post-create flow on production.

Scoring: `docs/SCORING.md`. Email copy and `?grow=1`: `docs/GROW_EMAIL_COPY_JA_EN.md`.

## Host

| | |
|--|--|
| Live origin | **`https://mieteru.seoai.space`** |
| Droplet | `167.172.90.109` |
| Mailer | `saas/missing_fields_mailer.py` |
| Cron | **11:20 JST** |
| Grow-nudge cooldown | **7 days** |

Browser steps use the hostname. Do not point the checklist at the raw droplet IP.

`/demo` redirects to `/signup`. `/mieteru` and `/mieteru/edit` redirect to `/` and `/edit`.

| Step | URL |
|------|-----|
| Landing (do not regress) | `https://mieteru.seoai.space/` |
| Create | `https://mieteru.seoai.space/signup` |
| Login | `https://mieteru.seoai.space/login` |
| Publish handoff | `https://mieteru.seoai.space/me?t={token}` |
| Dashboard | `https://mieteru.seoai.space/account?t={token}` |
| Edit | `https://mieteru.seoai.space/edit?t={token}&c={client_id}` |

`/api/mieteru/*` and `/api/score` are the live backend on this host. A local static preview will fail those calls.

Use a new email address per run. Trial copy on `/me`: first month free, ¥2,980 from month two.

## 0. Landing stays put

The 24 Sep landing freeze still applies. This pass is post-create only.

- [ ] Open `https://mieteru.seoai.space/`.
- [ ] The page is the existing marketing page. It does not show the grow editor or a completeness widget.

## 1. Create

- [ ] Open `https://mieteru.seoai.space/signup` (or `/demo`, which redirects there).
- [ ] Step 1: enter a business URL. Start the autofill.
- [ ] Step 2 may show ミエテル度 `n/100`. That number is **not** completeness. Completeness is `(8 - missing) / 8`.
- [ ] Fill the create fields you can: business name, industry, location, description, phone, hours, keywords. Create stays short. Do not expect Google Maps, street address, social links, logo, or FAQ on this step.
- [ ] Confirm those five critical slots are absent from the create form: `google_maps_url` / `gbp_place_id`, `street_address`, `social_links`, `logo_url`, `faq_json`.
- [ ] Step 3: email and password (8+ characters). Submit **ミエテルページを作成する**.
- [ ] You land on a logged-in next step. If signup returns 404, the page falls back to `https://mini.seoai.space/?signup=1&source=mieteru&email=…`. That fallback is out of scope for grow QA.

## 2. Publish

- [ ] On `/me?t=…`, the card still shows diagnosis ミエテル度 (`AI` / `Web`), not the 8-slot completeness percent.
- [ ] Register a card or, after `?paid=1`, click **ページを公開する**.
- [ ] Success shows a public URL. Open it and confirm it loads.
- [ ] Keep `t` from the page URL. Take `c` (`client_id`) from the dashboard edit link.

Publish, trial checkout, and unpublish must still work.

## 3. Completeness widget

- [ ] Open `https://mieteru.seoai.space/account?t={token}`.
- [ ] Read the percent. It must equal `(8 - missing) / 8 * 100`, where `missing` is how many of these slots are empty:

  1. `domain`
  2. `google_maps_url` / `gbp_place_id` (one slot)
  3. `street_address`
  4. `phone`
  5. `opening_hours`
  6. `social_links`
  7. `logo_url`
  8. `faq_json`

- [ ] A city-only 所在地 does not by itself fill `street_address`. Create-form `hours` fills `opening_hours` only when that slot drops out of `missing_critical_fields()`.
- [ ] Worked check: domain + phone + opening hours present, other five missing → **37.5%**. All eight missing → **0%**. All eight present → **100%**.
- [ ] The widget lists missing slots in that order. Copy is grow tone (足す / 育てる). It does not say 未入力, 不足, or missing.
- [ ] Open **編集**. The link is `/edit?t={token}&c={client_id}`.

## 4. Edit grow fields

- [ ] `/edit?t={token}&c={client_id}` still loads the existing core fields.
- [ ] The grow section can edit every critical slot that create does not finish: map URL and/or GBP place id, street address, social links, logo URL, FAQ JSON, plus domain, phone, and opening hours if they are still empty.
- [ ] Empty critical slots use the soft cyan highlight (`grow-empty`), not red.
- [ ] Helper text means 「ここを足すと、AIに見つけてもらいやすくなります」. No 不足 label.
- [ ] Save with some critical slots still empty. Save succeeds. The percent stays on a 12.5-point step.
- [ ] Add only a Google Maps URL. Save. That slot clears. `gbp_place_id` alone does the same. Setting both does **not** add a second 12.5.
- [ ] Add `street_address`, then `social_links`, then `logo_url`, then `faq_json`, saving after each. Each newly filled slot adds **12.5** points.
- [ ] With all 8 slots present, the widget reads **100%** and the empty highlights are gone.
- [ ] **公開を停止する** still unpublishes. **保存して公開を更新** publishes again.

## 5. Email deep-link params

Paste these without waiting for mail.

- [ ] Open  
  `https://mieteru.seoai.space/edit?t={token}&c={client_id}&grow=1`  
  The grow section is in view. Empty critical slots are highlighted. Existing fields are still editable.
- [ ] Open  
  `https://mieteru.seoai.space/account?t={token}&grow=1`  
  The dashboard grow section (percent and prompts) is in view, and the way forward is the edit grow section.
- [ ] There is no `focus=grow` and no `field=` param. `grow=1` is the flag.
- [ ] Dropping `t` or `c` on `/edit` still redirects to `/login`.
- [ ] When a grow nudge arrives, the button is **ページを更新する** (EN: **Update page**) and the href is the edit URL with `grow=1`.
- [ ] Body matches template A in `GROW_EMAIL_COPY_JA_EN.md`. It does not say 不足 or missing info, even though the sender file is `saas/missing_fields_mailer.py`.
- [ ] `{next_prompts}` lists only missing critical slots, in `CRITICAL_FIELDS` order. The percent matches `(8 - missing) / 8`.
- [ ] A page at 100% does not receive template A. A second template A does not arrive inside the **7-day** cooldown.

## 6. Trial reminder trigger notes

There is no “send trial email” button. The sender is the same production mailer.

- [ ] Crontab on droplet `167.172.90.109` runs `saas/missing_fields_mailer.py` at **11:20 JST**.
- [ ] Template B is eligible when `days_left <= 7` (7 down through 1), `Asia/Tokyo`.
- [ ] No template B when `days_left` is 8 or more, when the trial has ended, or when the subscription is cancelled.
- [ ] Cooldown is 7 days, so the last week does not produce a mail every morning.
- [ ] Subject uses the actual `{days_left}` (JA: `{business_name}の無料期間は、あと{days_left}日です`).
- [ ] The only button is **ページを更新する** / **Update page**, pointing at  
  `https://mieteru.seoai.space/edit?t={token}&c={client_id}&grow=1`.
- [ ] If critical slots are missing, the body includes those prompt lines and the 12.5-step percent. If completeness is 100%, the trial mail omits the prompt list.

To verify without waiting a month, set a test subscription’s trial end so `days_left` is 7 or less, let the 11:20 JST job run (or invoke `saas/missing_fields_mailer.py` once the way production does), and read the mailbox. Run it again the same day and confirm the cooldown holds.

## Run log

| Field | Value |
|-------|--------|
| Date | |
| Origin | `https://mieteru.seoai.space` |
| Droplet | `167.172.90.109` |
| Account email | |
| `client_id` | |
| Public URL | |
| Missing slots after publish | |
| Completeness after publish | `(8 - missing) / 8` |
| Completeness after all 8 slots | 100% |
| Deep link opened | `…/edit?…&grow=1` |
| `days_left` fixture | ≤ 7 |
| Mailer run (11:20 JST or manual) | |
| Notes | |
