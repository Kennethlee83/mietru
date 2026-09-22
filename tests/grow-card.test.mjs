import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const grow = require("../mieteru/js/grow-card.js");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const HARSH = /不足|欠け|未入力|足りな|不完全|記入漏れ|missing info|incomplete|まだない項目/i;

test("eight critical checks, city-only address does not count", () => {
  const partial = grow.score({
    domain: "https://example.com",
    phone: "045-000-0000",
    hours: "月-金 9:00-18:00",
    location: "横浜市中区",
  });
  assert.equal(partial.filled, 3);
  assert.equal(partial.percent, 38);
  assert.equal(partial.flags.address, false);
  assert.equal(partial.flags.maps, false);
});

test("street number, maps or place id, social, logo, and faq complete the card", () => {
  const result = grow.score({
    domain: "https://example.com",
    google_maps_url: "https://maps.google.com/?q=minato",
    location: "横浜市中区1-2-3",
    phone: "045-000-0000",
    hours: "9:00-18:00",
    social_links: JSON.stringify({ instagram: "https://instagram.com/minato" }),
    logo_url: "https://example.com/logo.png",
    faq_json: JSON.stringify([{ question: "予約は必要ですか？", answer: "当日も歓迎です。" }]),
  });
  assert.equal(result.percent, 100);
  assert.deepEqual(result.prompts, []);

  const byPlace = grow.score({ gbp_place_id: "ChIJexample", phone: "03" });
  assert.equal(byPlace.flags.maps, true);
  assert.equal(byPlace.flags.phone, true);
  assert.equal(byPlace.percent, 25);
});

test("empty social and half FAQ pairs do not count", () => {
  const result = grow.score({
    social_links: "{}",
    faq_json: JSON.stringify([{ question: "質問だけ", answer: "" }]),
    logo_url: "  ",
  });
  assert.equal(result.percent, 0);
  assert.equal(result.flags.social, false);
  assert.equal(result.flags.faq, false);
});

test("prompts stay in a grow tone", () => {
  const open = grow.score({ phone: "03" });
  assert.ok(open.prompts.includes(grow.PROMPTS.maps));
  open.prompts.concat([open.lead]).forEach((line) => assert.doesNotMatch(line, HARSH));
});

test("edit deep link matches the live grow section", () => {
  const url = grow.buildEditGrowUrl({ token: "tok en", clientId: "c1" });
  const parsed = new URL(url);
  assert.equal(parsed.origin + parsed.pathname, "https://mieteru.seoai.space/edit");
  assert.equal(parsed.searchParams.get("t"), "tok en");
  assert.equal(parsed.searchParams.get("c"), "c1");
  assert.equal(parsed.searchParams.get("grow"), "1");
  assert.equal(parsed.hash, "#grow-ai-card");
});

test("days_left 1 through 7 shows the nudge once", () => {
  assert.equal(grow.trialReminder({ plan: { days_left: 7 } }).show, true);
  assert.equal(grow.trialReminder({ days_left: 8 }).show, false);
  assert.equal(grow.trialReminder({ days_left: 1 }).show, true);
  assert.equal(grow.trialReminder({ days_left: 0 }).show, false);
  assert.equal(grow.trialReminder({ plan: { days_left: -1 } }).show, false);

  const due = grow.planTrialReminder({ days_left: 5, token: "t", client_id: "shop" });
  assert.equal(due.send, true);
  assert.equal(due.daysLeft, 5);
  assert.match(due.ctaUrl, /grow=1#grow-ai-card$/);
  assert.equal(grow.planTrialReminder({ days_left: 5, trial_reminder_sent: true }).send, false);

  const banner = grow.renderTrialBanner({ plan: { days_left: 5, paid: false } }, { href: due.ctaUrl });
  assert.match(banner, /あと5日/);
  assert.match(banner, /カードを育てる/);
  assert.doesNotMatch(banner, HARSH);
  assert.equal(grow.renderTrialBanner({ plan: { days_left: 20 } }), "");
});

test("dashboard prefers completeness_pct from the pages API", () => {
  const server = grow.renderDashboardCard(
    { name: "店", completeness_pct: 38, domain: "https://example.com" },
    { href: "/edit?grow=1#grow-ai-card" }
  );
  assert.match(server, /38%/);
  assert.match(server, /編集して育てる/);

  const sparse = grow.renderDashboardCard({ name: "店", industry: "飲食" }, { href: "/edit" });
  assert.doesNotMatch(sparse, /%/);
});

test("social and faq payloads match the live edit shape", () => {
  const social = JSON.parse(grow.buildSocialLinks([
    "https://instagram.com/minato",
    "https://line.me/R/ti/p/@minato",
  ]));
  assert.equal(social.instagram, "https://instagram.com/minato");
  assert.equal(social.other_urls[0].label, "LINE");
  const faq = JSON.parse(grow.buildFaqJson([{ q: "Q", a: "A" }, { q: "only" }]));
  assert.deepEqual(faq, [{ question: "Q", answer: "A" }]);
  assert.equal(grow.buildFaqJson([]), "");
  assert.equal(grow.buildSocialLinks([]), "");
});

test("email templates stay soft and point at the edit deep link", () => {
  for (const file of [
    "mieteru/email/grow-card.ja.txt",
    "mieteru/email/grow-card.en.txt",
    "mieteru/email/trial-ending.ja.txt",
    "mieteru/email/trial-ending.en.txt",
  ]) {
    const body = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(body, /\{\{edit_url\}\}/);
    assert.doesNotMatch(body, HARSH);
  }
});

test("this repo does not own create, landing, or publish, and edit uses live field names", () => {
  const demo = fs.readFileSync(path.join(root, "mieteru/demo.html"), "utf8");
  assert.equal(demo.includes("google_maps_url"), false);
  assert.equal(demo.includes("faq_json"), false);

  for (const file of ["index.html", "mieteru.html"]) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.equal(html.includes("grow-card.js"), false);
    assert.equal(html.includes("grow-ai-card"), false);
  }

  const edit = fs.readFileSync(path.join(root, "mieteru/edit.html"), "utf8");
  assert.match(edit, /google_maps_url/);
  assert.match(edit, /social_links/);
  assert.match(edit, /logo_url/);
  assert.match(edit, /faq_json/);
  assert.match(edit, /id="grow-ai-card"/);
  assert.match(edit, /\/api\/mieteru\/page\/update/);
  assert.match(edit, /\/api\/mieteru\/page\/unpublish/);
  assert.equal(edit.includes('name="maps_url"'), false);
  assert.match(edit, /name="google_maps_url"/);

  const me = fs.readFileSync(path.join(root, "mieteru/me.html"), "utf8");
  assert.match(me, /\/api\/mieteru\/publish/);
  assert.equal(me.includes("google_maps_url"), false);
});
