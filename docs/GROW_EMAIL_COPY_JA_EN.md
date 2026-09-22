# Grow AI Card — email copy (Japanese + English)

User-facing copy for the production mailer `saas/missing_fields_mailer.py` on droplet `167.172.90.109`. Japanese is what users receive. English is the parallel copy for the same template keys.

The module name stays `missing_fields_mailer.py`. The message tone is grow. These templates replace the old missing-info wording.

Live links use `https://mieteru.seoai.space`.

If `docs/GROW_AI_CARD_CANVAS.md` exists, link here instead of pasting a second copy of the bodies.

## Tone rules

Write as if the reader is busy and not technical. Short sentences. No shame.

| Use | Do not use |
|-----|------------|
| 足す / 育てる / 広げる | 未入力 / 不足 / 情報が足りません / 不備 |
| 見つけてもらう / 紹介しやすくなる | 必須項目 / エラー / 未完成のプロフィール |
| ページを更新する | 不足情報を入力 / 今すぐ修正 |
| grow / add / introduce | missing info / incomplete / fill in the blanks / required fields |

One button only. Label it exactly:

- Japanese: **ページを更新する**
- English: **Update page**

## When mail goes out

| Job | Rule |
|-----|------|
| Module | `saas/missing_fields_mailer.py` |
| Host | droplet `167.172.90.109` |
| Cron | **11:20 JST** daily |
| Grow nudge (template A) | `missing_critical_fields()` is non-empty, so completeness is under 100% (`docs/SCORING.md`) |
| Cooldown | **7 days** between grow nudges for the same page |
| Trial nudge (template B) | `days_left <= 7` and the trial has not ended |

Do not send template A at 100% (no missing critical slots). Do not send template B when `days_left` is greater than 7. The 7-day cooldown stops a second grow nudge inside the week. The trial nudge is due for the whole window `days_left <= 7`, not only on the day that equals 7.

## Variables

| Variable | Meaning |
|----------|---------|
| `{owner_name}` | Account display name. If empty, drop the name and さん (JA) or use "Hi," (EN). |
| `{business_name}` | Profile `name`. If empty, use 「あなたのページ」 / "your page". |
| `{completeness}` | `(8 - missing) / 8 * 100` from `missing_critical_fields()`. |
| `{next_prompts}` | One line per missing critical slot, in `CRITICAL_FIELDS` order. Omit when nothing is missing. |
| `{edit_url}` | Edit deep link below. |
| `{days_left}` | Whole days until trial end in `Asia/Tokyo`. Template B sends while this is **≤ 7**. |
| `{trial_end_date}` | `YYYY年M月D日` (JA) or `D MMM YYYY` (EN), `Asia/Tokyo`. |

Prompt lines, only for slots `missing_critical_fields()` returns:

| Slot | Japanese line | English line |
|------|---------------|--------------|
| `domain` | 公式サイトのURLを足す | Add your website URL |
| `google_maps_url` / `gbp_place_id` | Googleマップ（またはビジネスプロフィール）を足す | Add a Google Maps link or Business Profile |
| `street_address` | 番地までの住所を足す | Add the street address |
| `phone` | 電話番号を足す | Add a phone number |
| `opening_hours` | 営業時間を足す | Add opening hours |
| `social_links` | SNSのリンクを足す | Add a social link |
| `logo_url` | ロゴを足す | Add a logo |
| `faq_json` | よくある質問を足す | Add an FAQ |

## Deep link

The button opens the Mieteru edit grow section:

```
https://mieteru.seoai.space/edit?t={token}&c={client_id}&grow=1
```

`t` is the session token. `c` is `client_id`. `grow=1` scrolls to the grow section and highlights empty critical slots.

Account accepts the same flag when the mailer has no `client_id`:

```
https://mieteru.seoai.space/account?t={token}&grow=1
```

Prefer the edit URL. Do not use `focus=grow` or `field=`. Do not link to `seoai.space/mieteru` or the landing page.

## Template A — grow nudge

Replaces the missing-info mail. Sent by the 11:20 JST cron, then not again for 7 days.

### Japanese

**Subject:** `{business_name}のページ、もう少し育てられます`

**Preheader:** 地図・住所・SNS・ロゴを足すと、AIに紹介されやすくなります。

**Body:**

```
{owner_name}さん

{business_name}のAIミエテルページは、もう公開されています。
今の完成度は {completeness}% です。

足すと、ChatGPT や Gemini がお店を紹介しやすくなります。
直す作業ではありません。見える範囲を広げるステップです。

まずは1つだけで大丈夫です。
{next_prompts}

ページを更新する
{edit_url}

AIミエテル / SEOAI
```

**Button label:** ページを更新する

### English

**Subject:** `You can grow {business_name}'s page a little more`

**Preheader:** A map, address, social link, or logo helps AI introduce you.

**Body:**

```
Hi {owner_name},

{business_name}'s AI Mieteru page is already live.
Completeness is {completeness}%.

Adding the items below helps ChatGPT and Gemini introduce the business.
This is a way to grow what people can see. It is not a list of mistakes.

One addition is enough to start.
{next_prompts}

Update page
{edit_url}

AI Mieteru / SEOAI
```

**Button label:** Update page

### Example at 62.5% (3 missing)

Present: `domain`, `google_maps_url`, `phone`, `opening_hours`, `social_links`. Missing: `street_address`, `logo_url`, `faq_json`. `(8 - 3) / 8 = 62.5%`.

**Subject:** `青山カフェのページ、もう少し育てられます`

```
佐藤さん

青山カフェのAIミエテルページは、もう公開されています。
今の完成度は 62.5% です。

足すと、ChatGPT や Gemini がお店を紹介しやすくなります。
直す作業ではありません。見える範囲を広げるステップです。

まずは1つだけで大丈夫です。
・番地までの住所を足す
・ロゴを足す
・よくある質問を足す

ページを更新する
https://mieteru.seoai.space/edit?t=TOKEN&c=CLIENT&grow=1
```

## Template B — trial ending soon (`days_left <= 7`)

Same button and the same edit deep link. Billing facts on `/me`: the first month is free, month two is ¥2,980, and cancelling during the trial does not charge.

Send while `days_left` is 7, 6, 5, 4, 3, 2, or 1. Do not send after the trial has ended, when the subscription is cancelled, or when `days_left` is 8 or more. The 7-day cooldown means this reminder is not repeated every morning of that week.

If critical slots are still missing, keep `{next_prompts}`. If completeness is 100%, omit `{next_prompts}` and the sentence that asks the reader to add them.

### Japanese

**Subject:** `{business_name}の無料期間は、あと{days_left}日です`

**Preheader:** ページはそのまま公開されています。終了日は {trial_end_date} です。

**Body:**

```
{owner_name}さん

{business_name}の無料期間は、あと{days_left}日です（{trial_end_date}まで）。
ページはいまも公開されています。

終わる前に、地図や住所、SNS、ロゴ、よくある質問を足しておくと、AIからの紹介が続きやすくなります。
今の完成度は {completeness}% です。

{next_prompts}

続ける場合は、2ヶ月目から月額 ¥2,980 です。
トライアル中に解約すれば、料金はかかりません。

ページを更新する
{edit_url}

AIミエテル / SEOAI
```

**Button label:** ページを更新する

### English

**Subject:** `{days_left} days left on {business_name}'s free trial`

**Preheader:** The page stays published. The trial ends on {trial_end_date}.

**Body:**

```
Hi {owner_name},

{business_name}'s free trial has {days_left} days left (through {trial_end_date}).
The page is still published.

Adding a map, a street address, a social link, a logo, or an FAQ before it ends helps AI assistants keep introducing the business.
Completeness is {completeness}%.

{next_prompts}

If you continue, month two is ¥2,980 per month.
Cancelling during the trial does not charge you.

Update page
{edit_url}

AI Mieteru / SEOAI
```

**Button label:** Update page

### Example (`days_left` = 7, completeness 62.5%)

**Subject:** `青山カフェの無料期間は、あと7日です`

```
佐藤さん

青山カフェの無料期間は、あと7日です（2026年10月22日まで）。
ページはいまも公開されています。

終わる前に、地図や住所、SNS、ロゴ、よくある質問を足しておくと、AIからの紹介が続きやすくなります。
今の完成度は 62.5% です。

・番地までの住所を足す
・ロゴを足す
・よくある質問を足す

続ける場合は、2ヶ月目から月額 ¥2,980 です。
トライアル中に解約すれば、料金はかかりません。

ページを更新する
https://mieteru.seoai.space/edit?t=TOKEN&c=CLIENT&grow=1
```

## Plain-text and HTML

Send both. The HTML button text is the label above. The plain-text version keeps the same sentences and puts the label on its own line directly above `{edit_url}`.

Do not add a second button for billing or for “fix missing information”.
