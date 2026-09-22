/**
 * Mieteru "Grow AI business card" helper.
 * PATCH-2026-09-22-MIETERU-GROW
 *
 * Frontend-only repo: there is no mailer and no cron here.
 * planTrialReminder() is the hook a daily SEOAI job should call.
 * Email copy lives in mieteru/email/ (Japanese primary).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.MieteruGrow = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var BASE_FIELDS = [
    { key: "name", weight: 12 },
    { key: "summary", weight: 12 },
    { key: "industry", weight: 8 },
    { key: "location", weight: 8 },
    { key: "phone", weight: 8 },
    { key: "hours", weight: 6 },
    { key: "keywords", weight: 3 },
    { key: "domain", weight: 3 },
  ];

  var PROMPTS = {
    place: "Googleマップを足すと、AIがお店の場所を案内しやすくなります。",
    logo: "ロゴを足すと、名刺らしい見た目になります。",
    sns: "SNSのリンクを1つ足すと、ほかの公式情報とつながります。",
    faq: "よくある質問を1つ書くと、AIが答えやすくなります。",
    base: "名前や営業時間など、基本の情報も空いているときに整えておくと安心です。",
  };

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function pick(obj, keys) {
    if (!obj) return "";
    for (var i = 0; i < keys.length; i++) {
      var value = text(obj[keys[i]]);
      if (value) return value;
    }
    return "";
  }

  function normalizeSameAs(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map(text).filter(Boolean);
    }
    if (typeof value === "string") {
      return text(value) ? [text(value)] : [];
    }
    if (typeof value === "object") {
      return Object.keys(value).map(function (key) {
        return text(value[key]);
      }).filter(Boolean);
    }
    return [];
  }

  function normalizeFaqs(value) {
    if (!Array.isArray(value)) return [];
    return value.map(function (item) {
      if (!item || typeof item !== "object") return null;
      var q = text(item.q || item.question || item.ask);
      var a = text(item.a || item.answer);
      if (!q || !a) return null;
      return { q: q, a: a };
    }).filter(Boolean);
  }

  function flatten(input) {
    var page = input && typeof input === "object" ? input : {};
    var profile = page.profile && typeof page.profile === "object" ? page.profile : page;
    var grow = profile.grow && typeof profile.grow === "object" ? profile.grow : {};
    var same = grow.same_as || grow.socials || profile.same_as || profile.socials || null;
    var faqs = grow.faqs || profile.faqs || [];
    return {
      name: pick(profile, ["name", "business_name"]),
      industry: pick(profile, ["industry"]),
      location: pick(profile, ["location"]),
      summary: pick(profile, ["summary", "description"]),
      phone: pick(profile, ["phone"]),
      hours: pick(profile, ["hours"]),
      keywords: pick(profile, ["keywords"]),
      domain: pick(profile, ["domain", "website", "source_url"]),
      maps_url: pick(grow, ["maps_url"]) || pick(profile, ["maps_url", "google_maps_url"]),
      gbp_url: pick(grow, ["gbp_url"]) || pick(profile, ["gbp_url", "google_business_url"]),
      logo_url: pick(grow, ["logo_url"]) || pick(profile, ["logo_url", "logo"]),
      sameAs: normalizeSameAs(same),
      faqs: normalizeFaqs(faqs),
    };
  }

  function basePoints(flat) {
    var total = 0;
    BASE_FIELDS.forEach(function (field) {
      if (flat[field.key]) total += field.weight;
    });
    return total;
  }

  function growPoints(flat) {
    var place = flat.maps_url || flat.gbp_url ? 12 : 0;
    var logo = flat.logo_url ? 8 : 0;
    var sns = flat.sameAs.length >= 2 ? 10 : flat.sameAs.length === 1 ? 6 : 0;
    var faq = flat.faqs.length >= 2 ? 10 : flat.faqs.length === 1 ? 6 : 0;
    return { place: place, logo: logo, sns: sns, faq: faq, total: place + logo + sns + faq };
  }

  function leadFor(percent) {
    if (percent >= 100) {
      return "よく育ちました。このままAIに紹介してもらいやすくなっています。";
    }
    if (percent >= 80) {
      return "かなり育っています。残りは、空いたときに1つだけで十分です。";
    }
    if (percent >= 40) {
      return "公開できる土台はできています。地図やSNSを足すと、AIがもっと案内しやすくなります。";
    }
    return "まずはビジネス名と概要から。公開したあとに、少しずつ育てられます。";
  }

  function promptsFor(flat) {
    var list = [];
    if (!flat.maps_url && !flat.gbp_url) list.push(PROMPTS.place);
    if (!flat.logo_url) list.push(PROMPTS.logo);
    if (flat.sameAs.length === 0) list.push(PROMPTS.sns);
    if (flat.faqs.length === 0) list.push(PROMPTS.faq);
    var baseFull = BASE_FIELDS.every(function (field) { return !!flat[field.key]; });
    if (!baseFull) list.push(PROMPTS.base);
    return list;
  }

  function score(input) {
    var flat = flatten(input);
    var base = basePoints(flat);
    var grow = growPoints(flat);
    var points = base + grow.total;
    var percent = Math.max(0, Math.min(100, Math.round(points)));
    return {
      percent: percent,
      points: points,
      max: 100,
      basePoints: base,
      growPoints: grow.total,
      parts: grow,
      lead: leadFor(percent),
      prompts: promptsFor(flat),
      flat: flat,
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
    var ctaHref = options.ctaHref || "#grow";
    var ctaLabel = options.ctaLabel || "1つ足してみる";
    var items = result.prompts.map(function (line) {
      return "<li>" + escapeHtml(line) + "</li>";
    }).join("");
    var cta = result.percent < 100
      ? '<a class="grow-cta" href="' + escapeHtml(ctaHref) + '">' + escapeHtml(ctaLabel) + "</a>"
      : "";
    return (
      '<section class="grow-widget" aria-label="AI名刺の育ち具合">' +
        '<div class="grow-widget-head">' +
          '<span class="grow-widget-label">AI名刺の育ち具合</span>' +
          '<span class="grow-widget-pct">' + result.percent + "%</span>" +
        "</div>" +
        '<div class="grow-bar" role="progressbar" aria-valuenow="' + result.percent + '" aria-valuemin="0" aria-valuemax="100" aria-label="育ち具合 ' + result.percent + '%">' +
          '<span style="width:' + result.percent + '%"></span>' +
        "</div>" +
        '<p class="grow-lead">' + escapeHtml(result.lead) + "</p>" +
        (items ? '<ul class="grow-prompts">' + items + "</ul>" : "") +
        cta +
      "</section>"
    );
  }

  function hasFieldSignal(page) {
    if (!page || typeof page !== "object") return false;
    var profile = page.profile && typeof page.profile === "object" ? page.profile : page;
    var keys = ["summary", "description", "phone", "hours", "keywords", "domain", "website", "maps_url", "gbp_url", "logo_url", "faqs", "same_as", "grow"];
    return keys.some(function (key) {
      return Object.prototype.hasOwnProperty.call(profile, key) || Object.prototype.hasOwnProperty.call(page, key);
    });
  }

  function renderPercentShell(percent, lead, href, ctaLabel) {
    var cta = percent < 100
      ? '<a class="grow-cta" href="' + escapeHtml(href) + '">' + escapeHtml(ctaLabel) + "</a>"
      : "";
    return (
      '<section class="grow-widget" aria-label="AI名刺の育ち具合">' +
        '<div class="grow-widget-head">' +
          '<span class="grow-widget-label">AI名刺の育ち具合</span>' +
          '<span class="grow-widget-pct">' + percent + "%</span>" +
        "</div>" +
        '<div class="grow-bar" role="progressbar" aria-valuenow="' + percent + '" aria-valuemin="0" aria-valuemax="100" aria-label="育ち具合 ' + percent + '%">' +
          '<span style="width:' + percent + '%"></span>' +
        "</div>" +
        '<p class="grow-lead">' + escapeHtml(lead) + "</p>" +
        cta +
      "</section>"
    );
  }

  function renderDashboardCard(page, opts) {
    ensureStyles();
    var href = (opts && opts.href) || "#grow";
    if (hasFieldSignal(page)) {
      var profile = page.profile && typeof page.profile === "object" ? page.profile : page;
      return renderWidget(profile, { ctaHref: href, ctaLabel: "編集して育てる" });
    }
    var raw = page && (page.completeness_pct != null ? page.completeness_pct : page.completeness);
    if (raw != null && raw !== "" && !isNaN(Number(raw))) {
      var pct = Math.max(0, Math.min(100, Math.round(Number(raw))));
      return renderPercentShell(pct, leadFor(pct), href, "編集して育てる");
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
    var origin = String(options.origin || "https://seoai.space").replace(/\/$/, "");
    var url = new URL("/mieteru/edit", origin + "/");
    if (options.token) url.searchParams.set("t", options.token);
    if (options.clientId) url.searchParams.set("c", options.clientId);
    url.searchParams.set("focus", "grow");
    url.hash = "grow";
    return url.toString();
  }

  function trialEndsAt(source) {
    if (!source) return null;
    if (typeof source === "string" || source instanceof Date) return source;
    return source.trial_ends_at || source.trialEndsAt || source.trial_end || source.free_trial_ends_at || null;
  }

  function trialReminder(trialEnds, now) {
    var raw = trialEndsAt(trialEnds);
    if (!raw) return { show: false, daysLeft: null };
    var end = new Date(raw);
    var current = now ? new Date(now) : new Date();
    if (isNaN(end.getTime()) || isNaN(current.getTime())) return { show: false, daysLeft: null };
    var daysLeft = Math.ceil((end.getTime() - current.getTime()) / 86400000);
    return { show: daysLeft >= 1 && daysLeft <= 7, daysLeft: daysLeft };
  }

  function trialWhen(daysLeft) {
    if (daysLeft >= 6) return "無料の期間があと1週間ほどです。";
    if (daysLeft === 1) return "無料の期間は明日までです。";
    return "無料の期間があと" + daysLeft + "日です。";
  }

  function renderTrialBanner(source, opts) {
    var state = trialReminder(source, opts && opts.now);
    if (!state.show) return "";
    ensureStyles();
    var href = (opts && opts.href) || "";
    var text = trialWhen(state.daysLeft) + "その前に、地図やSNSを1つ足しておくと、2ヶ月目もAIに案内してもらいやすくなります。";
    var cta = href
      ? '<a class="grow-cta" href="' + escapeHtml(href) + '">カードを育てる</a>'
      : "";
    return '<aside class="grow-trial" role="status"><p>' + escapeHtml(text) + "</p>" + cta + "</aside>";
  }

  /**
   * Daily cron hook. This repository has no scheduler.
   * Send at most once, when about 7 days remain (1–7 days left).
   * Template: mieteru/email/trial-ending.ja.txt (EN sibling optional).
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

  return {
    BASE_POINTS_MAX: 60,
    GROW_POINTS_MAX: 40,
    PROMPTS: PROMPTS,
    score: score,
    flatten: flatten,
    renderWidget: renderWidget,
    renderDashboardCard: renderDashboardCard,
    renderTrialBanner: renderTrialBanner,
    buildEditGrowUrl: buildEditGrowUrl,
    trialReminder: trialReminder,
    planTrialReminder: planTrialReminder,
    hasFieldSignal: hasFieldSignal,
  };
});
