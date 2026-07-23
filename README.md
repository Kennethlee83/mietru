# AIミエテル (Mieteru) — Frontend only

Japanese marketing + signup UI for **AIミエテル**, served in production at
[https://seoai.space/mieteru](https://seoai.space/mieteru).

This repository contains **static HTML/CSS/JS only** for design and copy
updates. It does **not** include:

- Backend / Flask APIs
- Database code
- Stripe / email / secrets / `.env`
- SEOAI dashboard (Streamlit) code

## Pages

| File | Live URL |
|------|----------|
| `index.html` / `mieteru.html` | `/mieteru` |
| `mieteru/demo.html` | `/mieteru/demo` |
| `mieteru/login.html` | `/mieteru/login` |
| `mieteru/account.html` | `/mieteru/account` |
| `mieteru/edit.html` | `/mieteru/edit` |
| `mieteru/me.html` | `/mieteru/me` |
| `mieteru/terms.html` | `/mieteru/terms` |
| `mieteru/privacy.html` | `/mieteru/privacy` |
| `mieteru/tokushoho.html` | `/mieteru/tokushoho` |

`assets/hero.png` — OG / marketing image.

## Local preview (design)

Open `index.html` in a browser, or from this folder:

```bash
npx --yes serve .
```

Then visit `http://localhost:3000/`.

**Note:** Forms that call `/api/score` or `/api/mieteru/*` need the live SEOAI
backend. For pure UI/design work you can ignore those network errors.

## Collaboration

1. Edit HTML/CSS in a branch or PR.
2. Share screenshots / a zip / a PR with Ken (Kennethlee83).
3. Ken reviews and deploys to `seoai.space/mieteru` (production deploy is
   separate — not automatic from this repo).

## Security

Do **not** commit API keys, Stripe secrets, SMTP credentials, or database
dumps. If you find any secret in these files, tell Ken immediately and do not
share it further.

© AIミエテル / SEOAI (Blocksky)
