/**
 * Grow-card helper aligned to live Mieteru CRITICAL_FIELDS.
 *
 * This file is a scaffold in Kennethlee83/mietru. Production HTML on
 * mieteru.seoai.space already has its own widget. Production Python
 * (missing_fields_mailer, upsert_public_profile, publish_core) is on the
 * droplet and is not in this repo. See docs/DROPLET_AUDIT_2026-09-22.md.
 *
 * Percent = round(100 * filled / 8), same eight checks as the live edit page,
 * plus gbp_place_id as an alternate for the maps check (live HTML does not
 * read gbp_place_id yet).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MieteruGrow = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var CHECKS = ["website", "maps", "address", "phone", "hours", "social", "logo", "faq"];
  var PROMPTS = {
    website: "公式サイトのURLを足すと、AIがお店のページと結びつけやすくなります。",
    maps: "Googleマップのリンクを足すと、場所を案内しやすくなります。",
    address: "番地までの住所を足すと、どの店舗か伝わりやすくなります。",
    phone: "電話番号を足すと、AIが連絡先を案内しやすくなります。",
    hours: "営業時間を足すと、今行けるかどうかが伝わります。",
    social: "SNSのリンクを1つ足すと、ほかの公式情報とつながります。",
    logo: "ロゴの画像URLを足すと、名刺らしい見た目になります。",
    faq: "よくある質問を1つ書くと、AIが答えやすくなります。",
  };

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function parseJson(value) {
    if (value == null || value === "") return null;
    if (typeof value === "object") return value;
    var s = text(value);
    if (!s || s === "[]" || s === "{}" || s === "null" || s === "None") return null;
    try { return JSON.parse(s); } catch (e) { return s; }
  }

  function socialFilled(value) {
    var parsed = parseJson(value);
    if (!parsed) return false;
    if (Array.isArray(parsed)) return parsed.some(function (item) { return text(item); });
    if (typeof parsed === "object") {
      return Object.keys(parsed).some(function (key) {
        var v = parsed[key];
        if (Array.isArray(v)) return v.length > 0;
        return !!text(v);
      });
    }
    return !!text(parsed);
  }

  function faqItems(value) {
    var parsed = parseJson(value);
    var list = Array.isArray(parsed) ? parsed : [];
    return list.filter(function (item) {
      if (!item || typeof item !== "object") return false;
      var q = text(item.question || item.q);
      var a = text(item.answer || item.a);
      return !!(q && a);
    });
  }

  function addressFilled(profile) {
    if (text(profile.street_address)) return true;
    return /[丁目番地号]|〒|\d/.test(text(profile.location));
  }

  function flags(profile) {
    var p = profile || {};
    return {
      website: !!text(p.domain || p.website || p.source_url),
      maps: !!(text(p.google_maps_url) || text(p.gbp_place_id)),
      address: addressFilled(p),
      phone: !!text(p.phone),
      hours: !!text(p.hours || p.opening_hours),
      social: socialFilled(p.social_links),
      logo: !!text(p.logo_url),
      faq: faqItems(p.faq_json).length > 0,
    };
  }

  function leadFor(percent) {
    if (percent >= 100) return "よく育ちました。AIが引用しやすい状態です。";
    if (percent >= 75) return "かなり育っています。残りは、空いたときに1つだけで十分です。";
    if (percent >= 38) return "公開できる土台はできています。地図やSNSを足すと、AIがもっと案内しやすくなります。";
    return "まずは電話番号や営業時間から。公開したあとに、少しずつ育てられます。";
  }

  function score(profile) {
    var state = flags(profile);
    var filled = CHECKS.filter(function (key) { return state[key]; }).length;
    var percent = Math.round(100 * filled / CHECKS.length);
    var prompts = CHECKS.filter(function (key) { return !state[key]; }).map(function (key) {
      return PROMPTS[key];
    });
    return {
      percent: percent,
      filled: filled,
      total: CHECKS.length,
      flags: state,
      lead: leadFor(percent),
      prompts: prompts,
    };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function ensureStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById("mieteru-grow-style")) return;
    var style = document.createElement("style");
    style.id = "mieteru-grow-style";
    style.textContent = [
      ".grow-widget,.grow-trial{background:rgba(20,180,230,0.08);border:1px solid rgba(20,180,230,0.35);border-radius:14px;padding:14px 16px;margin:12px 0;}",
      ".grow-widget-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;}",
      ".grow-widget-label{font-size:13px;font-weight:700;color:#d5def5;}",
      ".grow-widget-pct{font-size:22px;font-weight:800;color:#7ee0ff;}",
      ".grow-bar{height:8px;border-radius:999px;background:rgba(255,255,255,0.08);margin:8px 0 10px;overflow:hidden;}",
      ".grow-bar>span{display:block;height:100%;background:linear-gradient(90deg,#4a8cff,#14b4e6);border-radius:999px;}",
      ".grow-lead{font-size:13px;color:#c5cde4;margin:0 0 8px;line-height:1.6;}",
      ".grow-prompts{margin:0 0 10px;padding-left:1.1em;color:#d5def5;font-size:13px;}",
      ".grow-prompts li{margin:4px 0;}",
      ".grow-cta{display:inline-block;margin-top:4px;padding:8px 12px;border-radius:10px;background:linear-gradient(135deg,#4a8cff,#14b4e6);color:#fff !important;font-size:13px;font-weight:700;text-decoration:none;}",
      ".grow-trial p{margin:0 0 8px;font-size:14px;line-height:1.6;}",
      ".grow-section{margin:8px 0 18px;padding:16px 14px 4px;border:1px dashed rgba(20,180,230,0.45);border-radius:16px;scroll-margin-top:76px;}",
      ".grow-section h2{font-size:16px;font-weight:800;margin:0 0 4px;}",
      ".grow-section.grow-focus{animation:growPulse 1.6s ease 2;}",
      "@keyframes growPulse{50%{box-shadow:0 0 0 3px rgba(20,180,230,0.55);}}",
    ].join("");
    document.head.appendChild(style);
  }

  function renderWidget(profile, opts) {
    ensureStyles();
    var result = score(profile);
    var options = opts || {};
    var ctaHref = options.ctaHref || "#grow-ai-card";
    var ctaLabel = options.ctaLabel || "1つ足してみる";
    var items = result.prompts.map(function (line) {
      return "<li>" + escapeHtml(line) + "</li>";
    }).join("");
    var cta = result.percent < 100
      ? '<a class="grow-cta" href="' + escapeHtml(ctaHref) + '">' + escapeHtml(ctaLabel) + "</a>"
      : "";
    return (
      '<section class="grow-widget" aria-label="AI名刺の育ち具合">' +
        '<div class="grow-widget-head"><span class="grow-widget-label">AI名刺の育ち具合</span>' +
        '<span class="grow-widget-pct">' + result.percent + "%</span></div>" +
        '<div class="grow-bar" role="progressbar" aria-valuenow="' + result.percent + '" aria-valuemin="0" aria-valuemax="100">' +
        '<span style="width:' + result.percent + '%"></span></div>' +
        '<p class="grow-lead">' + escapeHtml(result.lead) + "</p>" +
        (items ? '<ul class="grow-prompts">' + items + "</ul>" : "") + cta +
      "</section>"
    );
  }

  function hasFieldSignal(page) {
    if (!page || typeof page !== "object") return false;
    var profile = page.profile && typeof page.profile === "object" ? page.profile : page;
    var keys = ["domain", "website", "phone", "hours", "opening_hours", "google_maps_url", "gbp_place_id", "street_address", "social_links", "logo_url", "faq_json", "location"];
    return keys.some(function (key) {
      return Object.prototype.hasOwnProperty.call(profile, key);
    });
  }

  function renderDashboardCard(page, opts) {
    ensureStyles();
    var href = (opts && opts.href) || "#grow-ai-card";
    if (page && page.completeness_pct != null && page.completeness_pct !== "" && !isNaN(Number(page.completeness_pct))) {
      var pct = Math.max(0, Math.min(100, Math.round(Number(page.completeness_pct))));
      var cta = pct < 100 ? '<a class="grow-cta" href="' + escapeHtml(href) + '">編集して育てる</a>' : "";
      return (
        '<section class="grow-widget" aria-label="AI名刺の育ち具合">' +
          '<div class="grow-widget-head"><span class="grow-widget-label">AI名刺の育ち具合</span>' +
          '<span class="grow-widget-pct">' + pct + "%</span></div>" +
          '<div class="grow-bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">' +
          '<span style="width:' + pct + '%"></span></div>' +
          '<p class="grow-lead">' + escapeHtml(leadFor(pct)) + "</p>" + cta +
        "</section>"
      );
    }
    if (hasFieldSignal(page)) {
      var profile = page.profile && typeof page.profile === "object" ? page.profile : page;
      return renderWidget(profile, { ctaHref: href, ctaLabel: "編集して育てる" });
    }
    return (
      '<section class="grow-widget" aria-label="AI名刺を育てる">' +
        '<p class="grow-lead">公開したあとに、地図・SNS・ロゴ・質問を足して名刺を育てられます。</p>' +
        '<a class="grow-cta" href="' + escapeHtml(href) + '">編集して育てる</a>' +
      "</section>"
    );
  }

  function buildEditGrowUrl(opts) {
    var options = opts || {};
    var origin = String(options.origin || "https://mieteru.seoai.space").replace(/\/$/, "");
    var url = new URL("/edit", origin + "/");
    if (options.token) url.searchParams.set("t", options.token);
    if (options.clientId) url.searchParams.set("c", options.clientId);
    url.searchParams.set("grow", "1");
    url.hash = "grow-ai-card";
    return url.toString();
  }

  function daysLeftOf(source, now) {
    if (source == null) return null;
    if (typeof source === "number") return source;
    if (typeof source === "object") {
      if (source.days_left != null && source.days_left !== "") return Number(source.days_left);
      var plan = source.plan;
      if (plan && plan.days_left != null && plan.days_left !== "") return Number(plan.days_left);
      var raw = source.trial_ends_at || source.trialEndsAt || source.trial_end || source.free_trial_ends_at;
      if (!raw) return null;
      var end = new Date(raw);
      var current = now ? new Date(now) : new Date();
      if (isNaN(end.getTime()) || isNaN(current.getTime())) return null;
      return Math.ceil((end.getTime() - current.getTime()) / 86400000);
    }
    return null;
  }

  function trialReminder(source, now) {
    var daysLeft = daysLeftOf(source, now);
    if (daysLeft == null || isNaN(daysLeft)) return { show: false, daysLeft: null };
    return { show: daysLeft >= 1 && daysLeft <= 7, daysLeft: daysLeft };
  }

  function renderTrialBanner(source, opts) {
    var state = trialReminder(source, opts && opts.now);
    if (!state.show) return "";
    ensureStyles();
    var href = (opts && opts.href) || "";
    var when = state.daysLeft >= 6
      ? "無料の期間があと1週間ほどです。"
      : state.daysLeft === 1
        ? "無料の期間は明日までです。"
        : "無料の期間があと" + state.daysLeft + "日です。";
    var text = when + "その前に、地図やSNSを1つ足しておくと、2ヶ月目もAIに案内してもらいやすくなります。";
    var cta = href ? '<a class="grow-cta" href="' + escapeHtml(href) + '">カードを育てる</a>' : "";
    return '<aside class="grow-trial" role="status"><p>' + escapeHtml(text) + "</p>" + cta + "</aside>";
  }

  /**
   * Dashboard nudge rule. The droplet already renders this from plan.days_left.
   * The missing-fields mailer is a separate cron (20 11 * * *, 7-day cooldown)
   * and is not this function.
   */
  function planTrialReminder(user, now) {
    var record = user || {};
    var state = trialReminder(record, now);
    var sent = Boolean(record.trial_reminder_sent || record.trialReminderSent);
    return {
      send: Boolean(state.show && !sent),
      daysLeft: state.daysLeft,
      template: "trial-ending",
      locale: "ja",
      ctaUrl: buildEditGrowUrl({
        origin: record.origin,
        token: record.token || "",
        clientId: record.client_id || record.clientId || record.primary_client_id || "",
      }),
    };
  }

  function buildSocialLinks(urls) {
    var list = (urls || []).map(text).filter(Boolean).slice(0, 3);
    if (!list.length) return "";
    var platforms = { instagram: "instagram", facebook: "facebook", twitter: "twitter", "x.com": "twitter", youtube: "youtube", tiktok: "tiktok", linkedin: "linkedin" };
    var obj = {};
    var other = [];
    list.forEach(function (u) {
      var low = u.toLowerCase();
      var hit = null;
      Object.keys(platforms).forEach(function (key) {
        if (low.indexOf(key) !== -1) hit = platforms[key];
      });
      if (!hit && low.indexOf("line") !== -1) {
        other.push({ label: "LINE", url: u });
        return;
      }
      if (hit && !obj[hit]) obj[hit] = u;
      else other.push({ label: "SNS", url: u });
    });
    if (other.length) obj.other_urls = other;
    return JSON.stringify(obj);
  }

  function buildFaqJson(items) {
    var faqs = faqItems(items);
    if (!faqs.length) return "";
    return JSON.stringify(faqs.map(function (item) {
      return { question: text(item.question || item.q), answer: text(item.answer || item.a) };
    }));
  }

  return {
    CHECKS: CHECKS,
    PROMPTS: PROMPTS,
    score: score,
    renderWidget: renderWidget,
    renderDashboardCard: renderDashboardCard,
    renderTrialBanner: renderTrialBanner,
    buildEditGrowUrl: buildEditGrowUrl,
    trialReminder: trialReminder,
    planTrialReminder: planTrialReminder,
    buildSocialLinks: buildSocialLinks,
    buildFaqJson: buildFaqJson,
    hasFieldSignal: hasFieldSignal,
  };
});
