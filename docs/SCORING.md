# Grow AI Card — page completeness scoring

Source of truth for the post-create **completeness percent** on the account dashboard and the edit page.

This is not the marketing **ミエテル度** from `POST /api/score` (`ai_score` / `web_score`, shown on `/mieteru` and `/mieteru/me`). That diagnosis score stays as it is. Completeness measures how much of the published business-card profile is filled.

If `docs/GROW_AI_CARD_CANVAS.md` exists, link here instead of copying this table.

## Formula

```
completeness_percent = sum of weights of fields that count as filled
```

Weights are integers and sum to **100**. Display the integer as-is (`60%`, not `60.0%`). There is no rounding step.

A page with every core field filled and every grow field empty scores **60**. That is the normal score right after create → publish, before the owner grows the card.

## Field → weight

Keys are the persisted profile keys. Create-form aliases are listed so the helper can score either shape.

### Core fields — 60 points

Collected on create (`/mieteru/demo`) and editable on `/mieteru/edit`. They are part of the percent. They are not the grow prompts.

| Score key | Weight | Create alias | Edit control | Counts as filled when |
|-----------|--------|--------------|--------------|------------------------|
| `name` | 10 | `business_name` | ビジネス名 | Trimmed value is non-empty. |
| `summary` | 12 | `description` | サービス・商品の概要 | Trimmed value is non-empty. |
| `industry` | 8 | `industry` | 業種 | Trimmed value is non-empty and is not `選択してください…` or `__other__`. |
| `location` | 8 | `location` | 所在地 | Trimmed value is non-empty. |
| `phone` | 6 | `phone` | 電話番号 | Digits only (strip spaces, hyphens, parentheses, `+`) has length ≥ 10. |
| `hours` | 6 | `hours` | 営業時間 | Trimmed value is non-empty and is not `— 未設定 —`. |
| `keywords` | 5 | `keywords` | キーワード | At least one comma-separated token is non-empty after trim. |
| `domain` | 5 | none (see below) | 公式サイトURL | `domain` passes the URL rule, otherwise `source_url` does. |

**URL rule** for `domain` / `source_url`: trimmed value contains no spaces, and either starts with `http://` or `https://`, or contains a `.`.

`source_url` is the URL entered on create step 1. It fills the `domain` weight only when `domain` itself is empty. The two keys never add more than 5.

Core total: 10 + 12 + 8 + 8 + 6 + 6 + 5 + 5 = **60**.

### Grow fields — 40 points

Shown on **edit only**, inside `#grow-fields`. Do not add these inputs to `/mieteru/demo` or to the landing page.

| Score key | Weight | Profile keys | Counts as filled when |
|-----------|--------|--------------|------------------------|
| `google_maps` | 12 | `google_maps_url`, `gbp_place_id` | `google_maps_url` passes the URL rule, **or** `gbp_place_id` is non-empty after trim. Either one awards the full 12. Both still award 12, not 24. |
| `same_as` | 10 | `same_as` (array of URL strings) or `sns` (string) | At least one `same_as` entry passes the URL rule, **or** `sns` passes the URL rule. One link awards the full 10. |
| `logo` | 8 | `logo_url` | `logo_url` passes the URL rule (uploaded asset URL or remote image URL). |
| `faqs` | 10 | `faqs` (array of `{ question, answer }`) | At least one item has both `question` and `answer` non-empty after trim. Extra FAQs do not add points. An item with only a question, or only an answer, does not count. |

Grow total: 12 + 10 + 8 + 10 = **40**.

Account fields (`email`, `password`) are never scored.

## Worked examples

| Profile | Percent |
|---------|---------|
| All 8 core fields filled, grow fields absent | **60** |
| Only `name` + `summary` | **22** |
| Core filled, plus a Google Maps URL only | **72** |
| Core filled, plus Maps URL and a GBP place id | **72** (no double count) |
| Core filled, one FAQ with question and answer | **70** |
| Core filled, FAQ with a question and a blank answer | **60** |
| `keywords` is `" , , "` | keywords weight **not** awarded |
| `phone` is `"03-0000-0000"` (10 digits) | phone weight awarded |
| `phone` is `"123"` | phone weight **not** awarded |
| `domain` empty, `source_url` is `https://shop.example` | domain weight awarded |
| Every row in both tables filled | **100** |

## Empty-field highlight rules

1. Highlight only scored fields that are empty under the rules above. Never highlight email, password, or the diagnosis ミエテル度.
2. `null`, missing keys, `""`, whitespace-only strings, empty arrays, and placeholder sentinels (`— 未設定 —`, `選択してください…`, `__other__`) are empty.
3. A placeholder **attribute** on an input does not count as a value.
4. Highlight style is a soft grow cue, not an error. Use class `grow-empty`: border `rgba(20,180,230,0.7)`, background `rgba(20,180,230,0.08)`. Do not use the danger red (`#ff6b8b` / `#ef4444`).
5. Helper copy on an empty field: 「ここを足すと、AIに見つけてもらいやすくなります」. Do not use 未入力, 不足, 情報が足りません, or “missing”.
6. `name` and `summary` stay required to save, matching today’s edit form. Every other scored field is optional. Save and publish must succeed while grow fields are empty.
7. The completeness widget on `/mieteru/account` and `/mieteru/edit` shows the percent plus up to **3** soft prompts. Order empty **grow** keys first (`google_maps`, `same_as`, `logo`, `faqs`), then empty core keys by weight descending (`summary`, `name`, `industry`, `location`, `phone`, `hours`, `keywords`, `domain`).
8. At 60% with grow fields empty, the widget prompt is: 「マップ・SNS・ロゴ・よくある質問を足すと、もっと見つけてもらえます。」
9. At 100%, hide empty highlights and show a short confirmation: 「このページは育ちきっています。」 Do not send the grow nudge email (see `GROW_EMAIL_COPY_JA_EN.md`).
10. Recompute on load and after a successful save. A field that just became filled loses `grow-empty` without a reload of the whole app.
11. Create (`/mieteru/demo`) does not render grow fields and does not highlight grow empties. The landing page is out of scope.
12. Deep link `focus=grow` scrolls to `#grow-fields` and highlights empty grow fields. `field=` accepts only `google_maps`, `same_as`, `logo`, `faqs`. A known `field` scrolls that control into view and adds class `grow-focus` once. Any other `field` value is ignored. `t` and `c` stay required; without them the edit page still redirects to `/mieteru/login`, as it does today.

## Widget placement

| Surface | Shows percent | Shows grow prompts | Renders grow inputs |
|---------|---------------|--------------------|---------------------|
| `/mieteru` (LP) | No | No | No |
| `/mieteru/demo` (create) | No | No | No |
| `/mieteru/me` (publish) | Diagnosis ミエテル度 only, unchanged | No | No |
| `/mieteru/account` | Yes | Yes, up to 3 | No (link into edit) |
| `/mieteru/edit` | Yes | Yes, up to 3 | Yes, `#grow-fields` below the existing core fields |
