import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const grow = require("../mieteru/js/grow-card.js");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const BASE = {
  name: "横浜みなと歯科",
  industry: "歯科・医院",
  location: "横浜市中区",
  summary: "横浜市中区でインプラントと予防歯科を行うクリニックです。",
  phone: "045-000-0000",
  hours: "月-金 9:00-18:00",
  keywords: "横浜, 歯科",
  domain: "https://example.com",
};

const FULL_GROW = {
  maps_url: "https://maps.google.com/?q=minato",
  gbp_url: "https://g.page/minato",
  logo_url: "https://example.com/logo.png",
  same_as: {
    instagram: "https://instagram.com/minato",
    line: "https://line.me/R/ti/p/@minato",
  },
  faqs: [
    { q: "駐車場はありますか？", a: "裏に3台分あります。" },
    { q: "予約は必要ですか？", a: "初めての方は予約をおすすめしています。" },
  ],
};

const HARSH = /不足|欠け|未入力|足りな|不完全|記入漏れ|missing info|incomplete|you haven't filled|you have not filled/i;

test("base fields alone score 60 percent", () => {
  const result = grow.score(BASE);
  assert.equal(result.basePoints, 60);
  assert.equal(result.growPoints, 0);
  assert.equal(result.percent, 60);
  assert.match(result.lead, /公開できる土台/);
});

test("empty profile scores 0", () => {
  assert.equal(grow.score({}).percent, 0);
});

test("aliases and nested grow count", () => {
  const result = grow.score({
    business_name: "A",
    description: "概要",
    industry: "飲食",
    location: "渋谷",
    phone: "03",
    hours: "10-19",
    keywords: "渋谷",
    website: "https://a.example",
    grow: { maps_url: "https://maps.example", faqs: [{ question: "Q", answer: "A" }] },
  });
  assert.equal(result.basePoints, 60);
  assert.equal(result.parts.place, 12);
  assert.equal(result.parts.faq, 6);
  assert.equal(result.percent, 78);
});

test("partial SNS and FAQ credit, full card is 100", () => {
  assert.equal(grow.score({ ...BASE, grow: { same_as: { instagram: "https://instagram.com/a" } } }).percent, 66);
  assert.equal(grow.score({ ...BASE, grow: { faqs: [{ q: "Q", a: "A" }] } }).percent, 66);
  assert.equal(grow.score({ ...BASE, grow: { maps_url: "https://maps.example" } }).percent, 72);
  assert.equal(grow.score({ ...BASE, grow: { gbp_url: "https://g.page/a" } }).percent, 72);
  assert.equal(grow.score({ ...BASE, grow: FULL_GROW }).percent, 100);
});

test("whitespace and half FAQ pairs do not count", () => {
  const result = grow.score({
    ...BASE,
    name: "  ",
    grow: { logo_url: "  ", faqs: [{ q: "質問だけ", a: "" }] },
  });
  assert.equal(result.flat.name, "");
  assert.equal(result.parts.logo, 0);
  assert.equal(result.parts.faq, 0);
});

test("prompts are grow-tone and retire when filled", () => {
  const open = grow.score(BASE);
  assert.ok(open.prompts.includes(grow.PROMPTS.place));
  assert.ok(open.prompts.includes(grow.PROMPTS.faq));
  open.prompts.concat([open.lead]).forEach((line) => assert.doesNotMatch(line, HARSH));

  const withMap = grow.score({ ...BASE, grow: { maps_url: "https://maps.example" } });
  assert.ok(!withMap.prompts.includes(grow.PROMPTS.place));

  const done = grow.score({ ...BASE, grow: FULL_GROW });
  assert.deepEqual(done.prompts, []);
  assert.match(done.lead, /よく育ちました/);
});

test("edit deep link opens the grow section", () => {
  const url = grow.buildEditGrowUrl({ token: "tok en", clientId: "c1" });
  const parsed = new URL(url);
  assert.equal(parsed.origin + parsed.pathname, "https://seoai.space/mieteru/edit");
  assert.equal(parsed.searchParams.get("t"), "tok en");
  assert.equal(parsed.searchParams.get("c"), "c1");
  assert.equal(parsed.searchParams.get("focus"), "grow");
  assert.equal(parsed.hash, "#grow");
});

test("trial reminder is the one-week window, once", () => {
  const now = "2026-09-22T00:00:00Z";
  assert.equal(grow.trialReminder("2026-09-29T00:00:00Z", now).show, true);
  assert.equal(grow.trialReminder("2026-09-29T00:00:00Z", now).daysLeft, 7);
  assert.equal(grow.trialReminder("2026-09-30T00:00:00Z", now).show, false);
  assert.equal(grow.trialReminder("2026-09-23T00:00:00Z", now).show, true);
  assert.equal(grow.trialReminder("2026-09-22T00:00:00Z", now).show, false);
  assert.equal(grow.trialReminder("2026-09-21T00:00:00Z", now).show, false);
  assert.equal(grow.trialReminder("not-a-date", now).show, false);
  assert.equal(grow.trialReminder(null, now).show, false);

  const due = grow.planTrialReminder({
    trial_ends_at: "2026-09-27T00:00:00Z",
    token: "t",
    client_id: "shop",
  }, now);
  assert.equal(due.send, true);
  assert.equal(due.template, "trial-ending");
  assert.equal(due.locale, "ja");
  assert.equal(due.daysLeft, 5);
  assert.match(due.ctaUrl, /focus=grow#grow$/);

  const again = grow.planTrialReminder({
    trial_ends_at: "2026-09-27T00:00:00Z",
    trial_reminder_sent: true,
  }, now);
  assert.equal(again.send, false);

  const banner = grow.renderTrialBanner({ trial_ends_at: "2026-09-27T00:00:00Z" }, {
    now,
    href: due.ctaUrl,
  });
  assert.match(banner, /あと5日/);
  assert.match(banner, /カードを育てる/);
  assert.doesNotMatch(banner, HARSH);
  assert.equal(grow.renderTrialBanner({ trial_ends_at: "2026-10-20T00:00:00Z" }, { now }), "");
});

test("dashboard widget uses fields, a server percent, or an invitation", () => {
  const rich = grow.renderDashboardCard({ ...BASE, client_id: "1" }, { href: "/mieteru/edit?focus=grow#grow" });
  assert.match(rich, /60%/);
  assert.match(rich, /編集して育てる/);

  const sparse = grow.renderDashboardCard({ name: "店", industry: "飲食", location: "大阪" }, { href: "/edit" });
  assert.doesNotMatch(sparse, /%/);
  assert.match(sparse, /育てられます/);

  const server = grow.renderDashboardCard({ name: "店", completeness_pct: 60 }, { href: "/edit" });
  assert.match(server, /60%/);
  assert.doesNotMatch(server, /名前や営業時間/);
});

test("email templates are JA primary with a grow deep link", () => {
  const files = [
    "mieteru/email/grow-card.ja.txt",
    "mieteru/email/grow-card.en.txt",
    "mieteru/email/trial-ending.ja.txt",
    "mieteru/email/trial-ending.en.txt",
  ];
  files.forEach((file) => {
    const body = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(body, /\{\{edit_url\}\}/);
    assert.doesNotMatch(body, HARSH);
  });
  const ja = fs.readFileSync(path.join(root, "mieteru/email/grow-card.ja.txt"), "utf8");
  assert.match(ja, /育て/);
  assert.match(ja, /\{\{pct\}\}/);
  const trial = fs.readFileSync(path.join(root, "mieteru/email/trial-ending.ja.txt"), "utf8");
  assert.match(trial, /\{\{trial_end_date\}\}/);
  assert.match(trial, /約1週間/);
});

test("create, landing, and publish screens are outside this change", () => {
  const demo = fs.readFileSync(path.join(root, "mieteru/demo.html"), "utf8");
  assert.equal(demo.includes("maps_url"), false);
  assert.equal(demo.includes('id="grow"'), false);
  assert.match(demo, /name="business_name"/);

  for (const file of ["index.html", "mieteru.html"]) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.equal(html.includes("grow-card.js"), false);
    assert.equal(html.includes('id="grow"'), false);
  }

  const me = fs.readFileSync(path.join(root, "mieteru/me.html"), "utf8");
  assert.match(me, /\/api\/mieteru\/publish/);
  assert.match(me, /\/api\/mieteru\/checkout/);
  assert.equal(me.includes("maps_url"), false);

  const edit = fs.readFileSync(path.join(root, "mieteru/edit.html"), "utf8");
  assert.match(edit, /\/api\/mieteru\/page\/update/);
  assert.match(edit, /\/api\/mieteru\/page\/unpublish/);
  assert.match(edit, /id="grow"/);
  assert.match(edit, /grow-card\.js/);

  const account = fs.readFileSync(path.join(root, "mieteru/account.html"), "utf8");
  assert.match(account, /grow-card\.js/);
  assert.match(account, /\/api\/mieteru\/pages/);
});
