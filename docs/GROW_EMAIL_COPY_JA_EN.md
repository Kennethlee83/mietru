# Grow AI Card — email copy (Japanese + English)

Canonical templates for the two post-create emails. Japanese is what users receive. English is the parallel copy for the same template keys.

These replace the old **missing-info** email. The new tone is grow: the page is already useful, and the owner can add a few things so AI assistants introduce the business more clearly.

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

The button URL is the edit deep link in the next section. Do not send the reader to the landing page or to a generic dashboard with no grow section.

## Variables

| Variable | Meaning |
|----------|---------|
| `{owner_name}` | Account display name. If empty, drop the name and the following さん (JA) or use "Hi," (EN). |
| `{business_name}` | Profile `name`. If empty, use 「あなたのページ」 / "your page". |
| `{completeness}` | Integer from `docs/SCORING.md`. |
| `{next_prompts}` | Up to three empty-field lines, grow keys first, same order as the widget. Omit the block when there are no empty grow fields. |
| `{edit_url}` | Deep link below. |
| `{days_left}` | Whole days until trial end in `Asia/Tokyo`. The trial-ending template is sent at **7**. |
| `{trial_end_date}` | Trial end date, format `YYYY年M月D日` (JA) or `D MMM YYYY` (EN), `Asia/Tokyo`. |

Prompt lines (use only the empty ones):

| Key | Japanese line | English line |
|-----|---------------|--------------|
| `google_maps` | 地図（Googleマップ）を足す | Add a Google Maps link |
| `same_as` | SNSのリンクを1つ足す | Add one social link |
| `logo` | ロゴを足す | Add a logo |
| `faqs` | よくある質問を1つ足す | Add one FAQ |

## Deep link

Existing edit route, plus grow focus:

```
https://seoai.space/mieteru/edit?t={token}&c={client_id}&focus=grow
```

Optional single-field focus (highlight rules in `docs/SCORING.md`):

```
&field=google_maps
&field=same_as
&field=logo
&field=faqs
```

When `{next_prompts}` has exactly one grow line, append that field. When it has several, use `focus=grow` only.

`t` is the session token. `c` is `client_id`. Both are required by `/mieteru/edit` today.

Host note: this repo serves the app at `https://seoai.space/mieteru`. If a message is sent for a host that mounts the same pages at the origin root (`https://mieteru.seoai.space`), swap the origin and keep the path and query (`/edit?t=…&c=…&focus=grow`).

## Template A — grow nudge

Replaces the missing-info mail.

**When to send**

- The page is published (`is_public`).
- `completeness` < 100 and at least one grow field is empty.
- Not more than once per page per 7 days.
- Do not send for unpublished or draft pages.
- Do not send at 100%.

This frontend repo has no mailer or cron. The production backend owns delivery. The copy and the trigger rules are still these.

### Japanese

**Subject:** `{business_name}のページ、もう少し育てられます`

**Preheader:** 地図・SNS・ロゴ・質問を足すと、AIに紹介されやすくなります。

**Body:**

```
{owner_name}さん

{business_name}のAIミエテルページは、もう公開されています。
今の完成度は {completeness}% です。

地図、SNS、ロゴ、よくある質問を足すと、ChatGPT や Gemini がお店を紹介しやすくなります。
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

**Preheader:** A map, a social link, a logo, or an FAQ helps AI introduce you.

**Body:**

```
Hi {owner_name},

{business_name}'s AI Mieteru page is already live.
Completeness is {completeness}%.

A map, a social link, a logo, and a short FAQ help ChatGPT and Gemini introduce the business.
This is a way to grow what people can see. It is not a list of mistakes.

One addition is enough to start.
{next_prompts}

Update page
{edit_url}

AI Mieteru / SEOAI
```

**Button label:** Update page

### Example at 60%

Core fields filled, grow fields empty. `{next_prompts}` is the four lines, but the widget and this email show the first three. The fourth (FAQ) is still highlighted on the edit page via `focus=grow`.

**Subject:** `青山カフェのページ、もう少し育てられます`

```
佐藤さん

青山カフェのAIミエテルページは、もう公開されています。
今の完成度は 60% です。

地図、SNS、ロゴ、よくある質問を足すと、ChatGPT や Gemini がお店を紹介しやすくなります。
直す作業ではありません。見える範囲を広げるステップです。

まずは1つだけで大丈夫です。
・地図（Googleマップ）を足す
・SNSのリンクを1つ足す
・ロゴを足す

ページを更新する
https://seoai.space/mieteru/edit?t=TOKEN&c=CLIENT&focus=grow
```

## Template B — trial ending soon (~7 days left)

Soft reminder. Same button, same edit deep link. Billing facts match `/mieteru/me`: the first month is free, month two is ¥2,980, and cancelling during the trial does not charge.

**When to send**

- Once per subscription.
- On the `Asia/Tokyo` calendar date that is **7 days before** the trial end date (`{days_left}` = 7).
- If that day's job runs late, send while `{days_left}` is 6 or 7, and do not send a second time.
- Do not send when the trial has already ended, when the subscription is cancelled, or when `{days_left}` is greater than 7.
- Unpublished pages still get this reminder if the trial is active. The button still opens edit. Grow prompts appear only when grow fields are empty; if completeness is 100%, omit `{next_prompts}` and the sentence that lists map / SNS / logo / FAQ.

### Japanese

**Subject:** `{business_name}の無料期間は、あと7日です`

**Preheader:** ページはそのまま公開されています。終了日は {trial_end_date} です。

**Body:**

```
{owner_name}さん

{business_name}の無料期間は、あと{days_left}日です（{trial_end_date}まで）。
ページはいまも公開されています。

終わる前に、地図やSNS、ロゴ、よくある質問を足しておくと、AIからの紹介が続きやすくなります。
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

**Subject:** `About 7 days left on {business_name}'s free trial`

**Preheader:** The page stays published. The trial ends on {trial_end_date}.

**Body:**

```
Hi {owner_name},

{business_name}'s free trial has {days_left} days left (through {trial_end_date}).
The page is still published.

Adding a map, a social link, a logo, or an FAQ before it ends helps AI assistants keep introducing the business.
Completeness is {completeness}%.

{next_prompts}

If you continue, month two is ¥2,980 per month.
Cancelling during the trial does not charge you.

Update page
{edit_url}

AI Mieteru / SEOAI
```

**Button label:** Update page

### Example (~7 days, 60%)

**Subject:** `青山カフェの無料期間は、あと7日です`

```
佐藤さん

青山カフェの無料期間は、あと7日です（2026年10月22日まで）。
ページはいまも公開されています。

終わる前に、地図やSNS、ロゴ、よくある質問を足しておくと、AIからの紹介が続きやすくなります。
今の完成度は 60% です。

・地図（Googleマップ）を足す
・SNSのリンクを1つ足す
・ロゴを足す

続ける場合は、2ヶ月目から月額 ¥2,980 です。
トライアル中に解約すれば、料金はかかりません。

ページを更新する
https://seoai.space/mieteru/edit?t=TOKEN&c=CLIENT&focus=grow
```

## Plain-text and HTML

Send both. The HTML button text is the label above. The plain-text version keeps the same sentences and puts the label on its own line directly above `{edit_url}`.

Do not add a second button for billing, unsubscribe-as-the-primary-action, or “fix missing information”.
