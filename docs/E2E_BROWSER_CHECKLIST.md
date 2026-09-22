# Grow AI Card — browser QA checklist

Step-by-step check of the post-create flow. Record the origin you actually opened at the top of the run. Do not treat a green landing page as proof that grow fields shipped.

Scoring rules: `docs/SCORING.md`. Email wording and query params: `docs/GROW_EMAIL_COPY_JA_EN.md`.

## Host

This repo documents the app at **`https://seoai.space/mieteru`**. Public cards are **`https://seoai.space/p/<slug>/`**.

| Step | URL |
|------|-----|
| Landing (do not regress) | `https://seoai.space/mieteru` |
| Create | `https://seoai.space/mieteru/demo` |
| Login | `https://seoai.space/mieteru/login` |
| Publish handoff | `https://seoai.space/mieteru/me?t={token}` |
| Dashboard | `https://seoai.space/mieteru/account?t={token}` |
| Edit | `https://seoai.space/mieteru/edit?t={token}&c={client_id}` |

If QA is assigned to `https://mieteru.seoai.space`, use the same paths on that origin (`/`, `/demo`, `/login`, `/me`, `/account`, `/edit`) and write the origin in the run log. Paths and query params do not change.

`/api/mieteru/*` and `/api/score` are the live SEOAI backend. This repository is static HTML. A local `npx serve` preview will fail those calls; run this checklist on the deployed host.

Use a new email address per run. Trial text on `/mieteru/me` is: first month free, ¥2,980 from month two.

## 0. Landing stays put

The 24 Sep landing freeze still applies. This pass is post-create only.

- [ ] Open `https://seoai.space/mieteru`.
- [ ] The page is the existing marketing page (hero, ミエテル度 demo, pricing). It does not show grow inputs (マップ, SNS, ロゴ, FAQ) or a completeness widget.

## 1. Create

- [ ] Open `https://seoai.space/mieteru/demo`.
- [ ] Step 1: enter a real business URL (example `https://example.com` only if you accept an empty autofill). Click **AIに情報を読み取ってもらう**.
- [ ] Wait for step 2. Diagnosis line may show ミエテル度 `n/100`. That number is **not** the completeness percent.
- [ ] Fill core fields and leave nothing blank:
  - ビジネス名
  - 業種
  - 所在地
  - サービス・商品の概要
  - 電話番号 (10+ digits, e.g. `03-1234-5678`)
  - 営業時間
  - キーワード (at least one token)
- [ ] Confirm the create form has **no** Google Maps, SNS / sameAs, logo, or FAQ fields.
- [ ] Continue to account creation. Email plus password (8+ characters). Submit **ミエテルページを作成する**.
- [ ] You land on a logged-in next step (`data.next_url`, usually `/mieteru/me` or account). If signup returns 404, the static page falls back to `https://mini.seoai.space/?signup=1&source=mieteru&email=…`. That fallback is the pre-MVP path; do not score grow behavior there. Note it and retry when `/api/mieteru/signup` is deployed.

## 2. Publish

- [ ] On `/mieteru/me?t=…`, the card still shows diagnosis ミエテル度 (`AI` / `Web`), not the grow completeness widget.
- [ ] Start card registration (**クレジットカードを登録して公開する**) or, after `?paid=1`, click **ページを公開する**.
- [ ] Success shows a public URL on `seoai.space/p/<slug>/`. Open it. The page loads.
- [ ] Copy `t` (token) from the page URL. You need `c` (`client_id`) from the dashboard edit link in the next step.

Publish, trial checkout, and unpublish must still work. Completeness work must not block them.

## 3. Completeness widget

- [ ] Open `https://seoai.space/mieteru/account?t={token}`.
- [ ] The new page row (or a card on that page) shows completeness **60%** when every core field from step 1 is saved and grow fields are empty. `domain` may be filled from the step-1 URL (`source_url`) even though create has no domain input.
- [ ] If the percent is not 60, compare saved fields with `docs/SCORING.md` before filing a bug. A short phone number or blank hours drops the score by that field’s weight.
- [ ] The widget copy is soft. At 60% it includes the idea of adding マップ・SNS・ロゴ・よくある質問. It does not say 未入力, 不足, or missing.
- [ ] Up to three prompts, grow fields first.
- [ ] Open **編集**. The edit URL contains `t` and `c`.

## 4. Edit grow fields

- [ ] `/mieteru/edit?t={token}&c={client_id}` still loads the existing core fields (name, industry, location, summary, phone, hours, keywords, domain).
- [ ] Below them, `#grow-fields` shows:
  - Googleマップ URL and/or GBP place id (`google_maps`)
  - SNS / sameAs (`same_as`)
  - ロゴ URL (`logo`)
  - よくある質問 (`faqs`)
- [ ] Empty grow fields use the soft cyan highlight (`grow-empty`), not red error styling.
- [ ] Helper text is 「ここを足すと、AIに見つけてもらいやすくなります」 or the same meaning. No 不足 label.
- [ ] Save with grow fields still empty (**保存して公開を更新**). Save succeeds. Completeness stays 60% if core is complete.
- [ ] Add only a Google Maps URL. Save. Completeness becomes **72%**. GBP place id alone, or both together, is also 72%, not 84%.
- [ ] Add one social URL. Save. **+10** (82% if you only added Maps before).
- [ ] Add a logo URL. Save. **+8**.
- [ ] Add one FAQ with both question and answer. Save. **+10**. A question with an empty answer does not add points.
- [ ] With all four grow fields filled and core still complete, the widget reads **100%** and the empty highlights are gone.
- [ ] **公開を停止する** still confirms and unpublishes. **保存して公開を更新** publishes again. Core save payload is unchanged for the original fields.

## 5. Email deep-link params

You can paste the URL without waiting for mail.

- [ ] Open  
  `https://seoai.space/mieteru/edit?t={token}&c={client_id}&focus=grow`  
  The page scrolls to `#grow-fields`. Empty grow fields are highlighted. Core fields are still editable.
- [ ] Open the same URL with `&field=google_maps`. The Maps control is in view and receives the one-shot `grow-focus` cue.
- [ ] Repeat for `field=same_as`, `field=logo`, `field=faqs`.
- [ ] `&field=not_a_field` does not error. The edit form still loads. Unknown `field` is ignored.
- [ ] Dropping `t` or `c` still redirects to `/mieteru/login` (existing guard).
- [ ] When a real grow-nudge message arrives, the button text is **ページを更新する** and the href matches the deep link (English button: **Update page**). Body matches template A in `GROW_EMAIL_COPY_JA_EN.md`. It does not say 不足 or missing info.
- [ ] A published page at 100% does not receive template A. An unpublished page does not receive template A.

## 6. Trial reminder trigger notes

There is no “send trial email” button in this UI. The reminder is a backend job. Check the template and the schedule rules; do not expect the browser to fire mail by itself.

Product facts already on the page:

- Trial length is one month (free now, billing from month two).
- Price after the trial is ¥2,980 / month.
- Cancelling during the trial does not charge.

Trigger (Asia/Tokyo):

- [ ] Confirm the job selects subscriptions whose trial end date is 7 days after today.
- [ ] Each subscription receives template B **once**.
- [ ] A late job may send when 6 or 7 days remain. It must not send a second copy.
- [ ] No send when days left are 8 or more, when the trial has ended, or when the subscription is cancelled.
- [ ] Subject is `{business_name}の無料期間は、あと7日です` (EN: `About 7 days left on {business_name}'s free trial`).
- [ ] The only button is **ページを更新する** / **Update page**, pointing at  
  `/mieteru/edit?t={token}&c={client_id}&focus=grow`.
- [ ] If grow fields are still empty, the body includes the soft prompt lines and the current percent (60% in the fixture). It does not use missing-info wording.
- [ ] If completeness is already 100%, the mail still reminds about the trial date and price, and it omits the grow prompt list.

To verify without waiting a month, use a test subscription whose `trial_end` is set to today+7 in Asia/Tokyo, run the job once, and check the mailbox. Run it again and confirm there is no duplicate.

## Run log

| Field | Value |
|-------|--------|
| Date | |
| Origin | `https://seoai.space` or `https://mieteru.seoai.space` |
| Account email | |
| `client_id` | |
| Public URL | |
| Completeness after publish | expected 60 |
| Completeness after all grow fields | expected 100 |
| Deep link opened | |
| Trial job fixture end date | |
| Notes | |
