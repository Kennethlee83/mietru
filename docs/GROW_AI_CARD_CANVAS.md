# Grow AI business card — canvas (aligned to the droplet)

Akira → Kenneth, 2026-09-22. Post-create only. Do not change the Sept 24 landing page.

Audit detail and the droplet deploy list: `docs/DROPLET_AUDIT_2026-09-22.md`.

This GitHub repo is the static design tree. Live pages are already on `https://mieteru.seoai.space` (`seoai.space/mieteru/*` redirects there). The SaaS Python is only on the droplet. Shipping this repo’s HTML over `/opt/seoai/public_site/mieteru/` would roll back banner upload, the public contact email, and the grow card that is already live.

## Journey

1. Create stays short (URL, name, industry, location, summary, phone, hours, keywords). No maps, SNS, logo, or FAQ on that step.
2. Publish stays on the existing checkout / `POST /api/mieteru/publish` path.
3. After publish, edit section `#grow-ai-card` collects the citation fields. The dashboard shows the percent and, when `plan.days_left` is 1–7, a soft nudge.
4. The missing-fields mailer (droplet cron `20 11 * * *`, 7-day cooldown) should use the grow copy below. Its button opens the edit grow section.

## Percent

Use `missing_critical_fields()`, not the thin `profile_completeness()`.

Eight checks, equal weight. `percent = round(100 * filled / 8)`.

| Check | Counts when |
|---|---|
| domain | non-empty website |
| maps | `google_maps_url` **or** `gbp_place_id` |
| street_address | non-empty street, or location containing `丁目` / `番地` / `号` / `〒` / a digit |
| phone | non-empty |
| opening_hours | non-empty `hours` |
| social_links | JSON/object/list with at least one URL |
| logo_url | non-empty image URL |
| faq_json | at least one pair with both question and answer |

`横浜市中区` is not a street. Domain + phone + hours and that city is **38%** (3/8), not 60%.

Live edit HTML matches this, except it ignores `gbp_place_id` and it labels gaps **まだない項目**. Preferred prompt copy is the benefit line (“Googleマップのリンクを足すと…”), which is what `mieteru/js/grow-card.js` renders in this repo.

## Edit payload

Live `saveEdits` already sends `google_maps_url`, `social_links`, `logo_url`, `faq_json` next to `name`, `industry`, `location`, `summary`, `phone`, `hours`, `keywords`, `domain`, `image`, `lead_notification_email`.

It always sends blanks. The droplet upsert **overwrites** those columns, and `_MIETERU_PROFILE_FIELDS` does not allow them yet. Opening the allowlist before `COALESCE`/omit-keep will wipe stored maps, social, logo, and FAQ on a normal save.

This repo’s scaffold omits empty grow keys and adds `street_address` only when location looks like a street. That is the safe client shape. It is not what production HTML does today.

Deep link (mail CTA and the dashboard nudge):

```text
https://mieteru.seoai.space/edit?t={token}&c={client_id}&grow=1#grow-ai-card
```

Live account already links `/edit?t=&c=&grow=1` and scrolls when `grow=1`.

## Email (JA primary)

Replace the scolding subject in `missing_fields_mailer.py`. Bodies: `mieteru/email/grow-card.ja.txt` and `grow-card.en.txt`. `{{edit_url}}` is the deep link above.

### JA

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

### EN

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

The trial-ending files (`mieteru/email/trial-ending.*.txt`) are optional copy for the `days_left <= 7` nudge. The live dashboard already shows that nudge from `plan.days_left`. Do not confuse it with the 03:15 JST trial-unpublish timer.

## Acceptance

1. Landing HTML for Sept 24 is unchanged.
2. Create has no grow fields.
3. Edit can show and post `google_maps_url`, `social_links`, `logo_url`, `faq_json` without dropping `image` or `lead_notification_email` on the live page.
4. A save that does not mention those columns does not clear them (`COALESCE` or omit).
5. `page/get` returns the same columns so the form round-trips.
6. Percent is the 8-check critical score, including `gbp_place_id` as a maps alternate.
7. Mail CTA and the 1–7 day nudge open `/edit?…&grow=1#grow-ai-card`.
8. JA mail no longer scolds “missing” citation fields.
