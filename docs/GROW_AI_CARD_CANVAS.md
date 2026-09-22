# Grow AI Business Card — product canvas

Akira → Kenneth, 2026-09-22. Post-create only. Do not change the Sept 24 landing page (`index.html`, `mieteru.html`).

## Where this lives

`Kennethlee83/mietru` is the **static frontend** for AIミエテル (production UI at `https://seoai.space/mieteru`).

It does **not** contain the SEOAI backend, database, Stripe, SMTP, or a cron process. This canvas plus the files under `mieteru/js/` and `mieteru/email/` are the MVP the backend should wire up. Publish, checkout, and unpublish requests are unchanged.

| Surface | Role in this MVP |
|---|---|
| `mieteru/demo.html` | Create. Stays short. No grow fields. |
| `mieteru/me.html` | Card registration and first publish. Unchanged. |
| `mieteru/account.html` | Dashboard after create. Completeness widget + trial reminder. |
| `mieteru/edit.html` | Only place grow fields are edited. Email CTA lands here. |
| `mieteru/js/grow-card.js` | Score, widget HTML, edit deep link, trial-reminder hook. |
| `mieteru/email/*.txt` | JA primary copy, EN sibling. No sender in this repo. |

## Journey

1. **Create (keep simple).** URL → confirm name, industry, location, summary, phone, hours, keywords → account. No Google Maps, SNS, logo, or FAQ on this step.
2. **Publish.** Existing checkout (`me.html`) and `POST /api/mieteru/publish`. No new required fields.
3. **Grow.** Dashboard and edit show a completeness percent and soft prompts. The owner adds any of: Google Maps or Business Profile link, SNS (`sameAs`), logo URL, FAQs.
4. **Remind, lightly.** If the pages API includes a trial end timestamp, the dashboard shows a soft note when about one week remains. A daily job (not in this repo) sends `trial-ending` once.

Tone for low-literacy users: short Japanese, one action at a time, “足せます” rather than “不足しています”.

## Scoring

`MieteruGrow.score(profile)` returns `percent` from 0 to 100.

A published card with the eight create fields filled, and nothing else, is **60%**. That is the number to show in the example state.

| Group | Field | Points |
|---|---|---|
| Base | name (`name` or `business_name`) | 12 |
| Base | summary (`summary` or `description`) | 12 |
| Base | industry | 8 |
| Base | location | 8 |
| Base | phone | 8 |
| Base | hours | 6 |
| Base | keywords | 3 |
| Base | domain (`domain`, `website`, or `source_url`) | 3 |
| Grow | Google Maps **or** Business Profile URL | 12 |
| Grow | logo URL | 8 |
| Grow | SNS / sameAs: 1 link = 6, 2 or more = 10 | 10 max |
| Grow | FAQ pairs with both question and answer: 1 = 6, 2 or more = 10 | 10 max |

Empty and whitespace-only values do not count. One SNS link or one FAQ is enough to retire that prompt (partial credit, no nagging).

Grow payload accepted on the profile, including a nested `grow` object:

```json
{
  "name": "横浜みなと歯科",
  "grow": {
    "maps_url": "https://maps.google.com/?q=example",
    "gbp_url": "",
    "logo_url": "https://example.com/logo.png",
    "same_as": {
      "instagram": "https://instagram.com/example",
      "facebook": "",
      "x": "",
      "line": "",
      "youtube": ""
    },
    "faqs": [{ "q": "駐車場はありますか？", "a": "裏に3台分あります。" }]
  }
}
```

`same_as` may also be an array of URLs. FAQ items may use `question` / `answer`.

### Widget copy (JA)

Label: **AI名刺の育ち具合** and the percent (example: **60%**).

| Percent | Lead |
|---|---|
| 0–39 | まずはビジネス名と概要から。公開したあとに、少しずつ育てられます。 |
| 40–79 | 公開できる土台はできています。地図やSNSを足すと、AIがもっと案内しやすくなります。 |
| 80–99 | かなり育っています。残りは、空いたときに1つだけで十分です。 |
| 100 | よく育ちました。このままAIに紹介してもらいやすくなっています。 |

Prompts (only for areas still empty):

- Googleマップを足すと、AIがお店の場所を案内しやすくなります。
- ロゴを足すと、名刺らしい見た目になります。
- SNSのリンクを1つ足すと、ほかの公式情報とつながります。
- よくある質問を1つ書くと、AIが答えやすくなります。
- If a base field is still empty, one line only: 名前や営業時間など、基本の情報も空いているときに整えておくと安心です。

Do not list “missing fields”, and do not use 不足 / 欠け / 未入力 in this UI.

Dashboard (`/api/mieteru/pages`): if the page object includes grow or base detail keys, show the percent. If the list payload is only name / industry / location (today’s response), show an invitation and the edit link **without** a fake low percent. If the API sends `completeness_pct` and no detail fields, show that number.

## Edit UI (grow fields live here only)

Section `#grow` on `/mieteru/edit`, under the existing create fields.

| Label | Stored as |
|---|---|
| Googleマップのリンク | `grow.maps_url` |
| Googleの店舗ページ（ビジネスプロフィール） | `grow.gbp_url` |
| ロゴ（画像のURL） | `grow.logo_url` |
| Instagram / Facebook / X / LINE / YouTube | `grow.same_as.*` |
| よくある質問（up to 5, start with 2） | `grow.faqs[]` |

Helper tone: 全部いりません。1つだけで大丈夫です。 Logo is a URL in this MVP (no upload endpoint in this repo).

Save still `POST /api/mieteru/page/update` with the same core profile keys as before, plus optional `profile.grow`. If the live API rejects unknown keys, the edit page retries once without `grow` and keeps the draft in `sessionStorage` (`mieteru_grow_draft_<client_id>`). Unpublish stays `POST /api/mieteru/page/unpublish`.

### Email deep link

CTA must open the edit screen with those fields on screen. Hash is the target; `focus=grow` remains if a mail client strips the hash.

```text
https://seoai.space/mieteru/edit?t={token}&c={client_id}&focus=grow#grow
```

Built by `MieteruGrow.buildEditGrowUrl({ origin, token, clientId })`.

On load, `#grow` or `focus=grow` scrolls to the section and focuses the Maps field. Login is still required (`t` and `c`). The flag does not skip auth.

`?grow_preview=1` without a token is a **design preview** for this static repo (sample 60% card, no save, no unpublish, no checkout). It is not a user-facing mode.

## Emails

Japanese is primary. English is the sibling file. Placeholders: `{{name}}` `{{pct}}` `{{edit_url}}` `{{trial_end_date}}`. `{{edit_url}}` must be the deep link above, not the dashboard and not the create flow.

There is no SMTP in this repo. Copy these files into the SEOAI mailer and stop using a “missing information” template.

### Grow — JA (`mieteru/email/grow-card.ja.txt`)

件名: AI名刺を、もう少し育ててみませんか

{{name}} さん

AIミエテルのページは、公開できています。
このままでも、AIに見つけてもらえます。

よかったら、次のどれかを足してみてください。
むずかしい作業はありません。リンクを貼るか、質問を1つ書くだけです。

・ Googleマップ（お店の場所を案内しやすくなります）
・ SNS（Instagram や LINE など、使っているもので大丈夫です）
・ ロゴ
・ よくある質問（1つでも十分です）

いまの育ち具合の目安: {{pct}}%

AI名刺を育てる:
{{edit_url}}

急がなくて大丈夫です。
空いている時間に、1つだけ足すのでも役に立ちます。

### Grow — EN (`mieteru/email/grow-card.en.txt`)

Subject: Grow your AI business card a little further

Hi {{name}},

Your Mieteru page is already published.
AI can find it as it is.

If you have a minute, you can add any of these. Nothing complicated — a link, or one question you often hear.

- Google Maps (so AI can point people to your place)
- A social link (Instagram, LINE, or whichever you already use)
- Your logo
- One frequently asked question

A sense of how far the card has grown: {{pct}}%

Grow your AI card:
{{edit_url}}

There is no rush. Adding one thing when you have time already helps.

### Trial ending — JA (`mieteru/email/trial-ending.ja.txt`)

件名: 無料期間があと約1週間です

{{name}} さん

AIミエテルの無料期間は、{{trial_end_date}} ごろまでです。

料金の前に、カードを少し育てておくと、2ヶ月目もAIに案内してもらいやすくなります。
地図のリンクか、SNSを1つ足すだけで大丈夫です。

カードを育てる:
{{edit_url}}

このまま続けることも、マイページから止めることもできます。
無料期間のあいだに止めた場合、料金はかかりません。

### Trial ending — EN (`mieteru/email/trial-ending.en.txt`)

Subject: About a week left in your free trial

Hi {{name}},

Your Mieteru free trial runs until about {{trial_end_date}}.

Before then, growing the card a little helps AI keep introducing you in month two.
A map link, or one social link, is enough.

Grow your card:
{{edit_url}}

You can keep the page, or stop it from your account page.
Stopping during the trial does not create a charge.

## Trial reminder hook

No cron exists in this repo. Do not invent a second scheduler here.

When the SEOAI daily job runs, call:

```js
MieteruGrow.planTrialReminder(user, now)
```

`user.trial_ends_at` (also `trial_end`, `free_trial_ends_at`) is an ISO timestamp. The result is `{ send, daysLeft, template: "trial-ending", locale: "ja", ctaUrl }`.

- `send` is true only when **1 to 7 days** remain and `trial_reminder_sent` is not set.
- 8 or more days out: do not send yet.
- Trial already ended: do not send this template (it is not a dunning mail).
- After a successful send, set `trial_reminder_sent` so the next day does not repeat it.

The dashboard uses the same window. If `/api/mieteru/pages` includes `trial_ends_at`, account shows:

- 6–7 days: 無料の期間があと1週間ほどです。
- 2–5 days: 無料の期間があとN日です。
- 1 day: 無料の期間は明日までです。

Plus: その前に、地図やSNSを1つ足しておくと、2ヶ月目もAIに案内してもらいやすくなります。 The button goes to the edit grow section. Checkout and publish buttons are not changed.

## Acceptance

1. Landing page HTML is unchanged for this release.
2. Create (`demo.html`) has no Maps, SNS, logo, or FAQ fields.
3. `me.html` publish and checkout requests are unchanged.
4. Edit still loads and saves the existing profile, and still unpublishes via `/api/mieteru/page/unpublish`.
5. Edit shows the grow section and a live percent. Base-only sample is 60%. Filling Maps moves the percent up without a reload.
6. Email CTA URL contains `/mieteru/edit`, `focus=grow`, and `#grow`. Opening it scrolls to the grow fields (after login, or in `grow_preview`).
7. Dashboard shows the widget. Sparse page payloads do not display a made-up 0%.
8. Trial banner appears only inside the 7-day window, and `planTrialReminder` sends at most once.
9. JA UI strings for this feature do not use 不足 / 欠け / 未入力.

## Backend follow-up (outside this repo)

- Persist `profile.grow` on `POST /api/mieteru/page/update` and return it from `POST /api/mieteru/page/get`.
- Include those fields (or `completeness_pct`) on `POST /api/mieteru/pages`, plus `trial_ends_at` when a trial is active.
- Send `mieteru/email/grow-card.ja.txt` instead of the old missing-info mail, with `{{edit_url}}` from `buildEditGrowUrl`.
- Run the daily trial hook above. Keep EN templates for a later locale switch; default send is JA.
