/**
 * LiverCare AI - GitHub Pages demo shim
 * =====================================
 * GitHub Pages hosts static files only: there is no FastAPI backend behind
 * this page, so every /api/* call would return a 404 HTML page.
 *
 * This script wraps window.fetch and, when the real backend cannot answer
 * with JSON, serves realistic demo responses so the whole UI stays
 * navigable and interactive in the browser.
 *
 * When you run the app locally (python run_backend.py) the real API is
 * reached first and this shim never kicks in.
 */
(function () {
  "use strict";

  var realFetch = window.fetch.bind(window);
  var demoMode = false;
  // "unknown" -> try the real API first; "live" -> backend answers JSON;
  // "static"  -> no backend at this origin, serve demo data without any
  // extra network round-trips (keeps the GitHub Pages console clean).
  var backendState = "unknown";

  function isLocalHost() {
    return (
      location.protocol === "file:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1" ||
      location.hostname === "::1" ||
      location.hostname === ""
    );
  }

  if (!isLocalHost()) backendState = "static";

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  function jsonResponse(data, status) {
    return new Response(JSON.stringify(data), {
      status: status || 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  function bodyOf(init) {
    try {
      return JSON.parse((init && init.body) || "{}");
    } catch (e) {
      return {};
    }
  }

  function looksArabic(text) {
    return /[\u0600-\u06FF]/.test(String(text || ""));
  }

  // Prefer the UI language, but fall back to Arabic when the question
  // itself is written in Arabic (e.g. the page stayed in English).
  function langOf(body) {
    if (body.lang === "ar") return "ar";
    if (body.lang === "en" && looksArabic(body.question)) return "ar";
    return body.lang || (looksArabic(body.question) ? "ar" : "en");
  }

  function showBanner() {
    if (demoMode) return;
    demoMode = true;

    var banner = document.createElement("div");
    banner.id = "demo-mode-banner";
    banner.innerHTML =
      '<strong>وضع العرض التجريبي / Demo Mode</strong>' +
      "<span>هذه نسخة ثابتة مستضافة على GitHub Pages — الواجهة تعمل كاملة، " +
      "لكن الإجابات والبيانات توضيحية. لتشغيل النسخة الحقيقية (RAG + Gemini) شغّل الخادم محلياً: " +
      "<code>python run_backend.py</code> ثم افتح <code>http://localhost:8000</code></span>" +
      '<button type="button" aria-label="Close demo banner">&times;</button>';
    banner.querySelector("button").addEventListener("click", function () {
      banner.remove();
      document.body.classList.remove("demo-banner-visible");
    });
    document.body.classList.add("demo-banner-visible");
    document.body.appendChild(banner);
  }

  /* ------------------------------------------------------------------ */
  /* Demo data                                                           */
  /* ------------------------------------------------------------------ */
  var DEMO_PROFILE = {
    name: "محمود",
    age: 39,
    sex: "male",
    weight: 90.0,
    height: 1.78,
    bmi: 28.4,
    diabetes: false,
    hypertension: true,
    activity_level: "moderate",
    labs: {},
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  var DEMO_TRACKING = {
    entries: [
      { date: "2026-04-10", weight: 93.4, activity: "walking", notes: "بداية المتابعة" },
      { date: "2026-05-08", weight: 92.6, activity: "walking", notes: "مشي 30 دقيقة" },
      { date: "2026-06-05", weight: 91.8, activity: "gym", notes: "تحسن في الالتزام" },
      { date: "2026-07-03", weight: 91.1, activity: "walking", notes: "اتباع نظام البحر المتوسط" },
      { date: "2026-08-01", weight: 90.5, activity: "swimming", notes: "" },
      { date: "2026-09-01", weight: 90.0, activity: "walking", notes: "استقرار الوزن" },
    ],
  };

  var DEMO_USER = {
    id: "demo-user-1",
    full_name: "زائر العرض",
    email: "demo@livercare.ai",
    is_verified: true,
  };

  function demoCitations() {
    return [
      {
        document: "EASL-EASD-EASO-2024-MASLD-GUIDELINE",
        page: 14,
        relevance_score: 0.72,
        source_type: "medical_guideline",
        category: "healthcare",
      },
      {
        document: "AASLD-Practice-Guidance-Elevated-Liver-Enzymes",
        page: 22,
        relevance_score: 0.66,
        source_type: "medical_guideline",
        category: "healthcare",
      },
      {
        document: "BMC-Medicine-2025-Lifestyle-Metabolic-Syndrome",
        page: 1,
        relevance_score: 0.61,
        source_type: "medical_guideline",
        category: "healthcare",
      },
    ];
  }

  function demoChatAnswer(question, lang) {
    var isAr = lang === "ar";
    if (isAr) {
      return (
        "**وضع العرض التجريبي** — هذه إجابة توضيحية ثابتة لعرض الواجهة على GitHub Pages.\n\n" +
        "سؤالك: *" + question + "*\n\n" +
        "- **إنجازات الوزن:** خسارة **5–7%** من وزن الجسم تقلل تدهور الكبد الدهني، و**10%** أو أكثر قد تؤدي إلى تراجع التليف (إرشادات EASL 2024).\n" +
        "- **الحمية:** نظام البحر المتوسط، تقليل السكريات المضافة والدهون المشبعة، وزيادة الألياف والخضروات.\n" +
        "- **النشاط البدني:** 150–200 دقيقة أسبوعياً من الحركة متوسطة الشدة.\n" +
        "- **المتابعة:** قياس ALT/AST ودرجة FIB-4 دورياً مع طبيبك.\n\n" +
        "*ملاحظة: للإجابة الحقيقية المبنية على قاعدة المعرفة (RAG) شغّل الخادم محلياً: http://localhost:8000*"
      );
    }
    return (
      "**Demo mode** — this is a static preview answer served on GitHub Pages.\n\n" +
      "Your question: *" + question + "*\n\n" +
      "- **Weight loss:** a sustained **5–7%** reduction improves hepatic steatosis, while **≥10%** may regress fibrosis (EASL 2024).\n" +
      "- **Diet:** Mediterranean pattern, less added sugar and saturated fat, more fibre and vegetables.\n" +
      "- **Activity:** 150–200 minutes of moderate activity per week.\n" +
      "- **Follow-up:** periodic ALT/AST and FIB-4 assessment with your physician.\n\n" +
      "*For the real RAG-backed answer, run the backend locally: http://localhost:8000*"
    );
  }

  function demoMedicalAnswer(question, lang) {
    var isAr = lang === "ar";
    if (isAr) {
      return (
        "هذه إجابة توضيحية في **وضع العرض التجريبي** لسؤالك: *" + question + "*\n\n" +
        "بشكل عام، صحة الكبد مرتبطة بنمط الحياة: تقليل الوزن تدريجياً، تناول غذاء متوازن، " +
        "والامتناع عن الكحول والمكملات غير الموثوقة، مع مراجعة الطبيب لتحديد ما يناسب حالتك.\n\n" +
        "*هذه معلومات تعليمية فقط ولا تُغني عن استشارة الطبيب.*"
      );
    }
    return (
      "This is a **demo-mode** preview answer for: *" + question + "*\n\n" +
      "In general, liver health is closely linked to lifestyle: gradual weight loss, " +
      "a balanced diet, avoiding alcohol and unverified supplements, plus regular follow-up " +
      "with your physician for personalised advice.\n\n" +
      "*Educational information only — not a substitute for medical advice.*"
    );
  }

  function demoLabAnalysis(lang) {
    var isAr = lang === "ar";
    if (isAr) {
      return (
        "وضع العرض التجريبي: لم يتم رفع صورة فعلية إلى خادم ذكاء اصطناعي.\n\n" +
        "ALT: 46 U/L (7-56) - طبيعي\n" +
        "AST: 34 U/L (10-40) - طبيعي\n" +
        "Bilirubin: 0.8 mg/dL (0.1-1.2) - طبيعي\n" +
        "Platelets: 245 K/uL (150-400) - طبيعي\n\n" +
        "الملخص: النتائج توضيحية لعرض الجدول فقط. ارجع للنسخة المحلية لتحليل تقرير حقيقي.\n" +
        "نصيحة: استشر طبيبك لتفسير نتائجك الفعلية."
      );
    }
    return (
      "Demo mode: no image was sent to a real AI model.\n\n" +
      "ALT: 46 U/L (7-56) - Normal\n" +
      "AST: 34 U/L (10-40) - Normal\n" +
      "Bilirubin: 0.8 mg/dL (0.1-1.2) - Normal\n" +
      "Platelets: 245 K/uL (150-400) - Normal\n\n" +
      "Summary: these values only demonstrate the results table. Run the app locally " +
      "to analyse a real report.\n" +
      "Important: always consult your doctor for personal evaluation."
    );
  }

  /* ------------------------------------------------------------------ */
  /* Route table                                                         */
  /* ------------------------------------------------------------------ */
  function mock(path, init) {
    var method = ((init && init.method) || "GET").toUpperCase();
    var body = bodyOf(init);
    var lang = langOf(body);

    if (path.indexOf("/api/profile") !== -1) {
      if (method === "POST") {
        DEMO_PROFILE = Object.assign({}, DEMO_PROFILE, body);
        if (body.weight && body.height) {
          DEMO_PROFILE.bmi = Math.round((body.weight / (body.height * body.height)) * 10) / 10;
        }
        return jsonResponse(DEMO_PROFILE);
      }
      return jsonResponse(DEMO_PROFILE);
    }

    if (path.indexOf("/api/track") !== -1) {
      if (method === "POST") {
        DEMO_TRACKING.entries.push(body);
        return jsonResponse({ status: "success" });
      }
      return jsonResponse(DEMO_TRACKING);
    }

    if (path.indexOf("/api/chat") !== -1) {
      var q = body.question || "your question";
      return jsonResponse({
        answer: demoChatAnswer(q, lang),
        citations: demoCitations(),
        citations_text: "",
        retrieved_chunks: [],
        safety_notice: null,
        confidence: "high",
      });
    }

    if (path.indexOf("/api/medical-chat") !== -1) {
      return jsonResponse({
        answer: demoMedicalAnswer(body.question || "", lang),
        confidence: "general",
        notice: "General medical information only — not a diagnosis or prescription.",
      });
    }

    if (path.indexOf("/api/analyze-lab") !== -1) {
      return jsonResponse({
        analysis: demoLabAnalysis(lang),
        reference_ranges: {},
        notice: "Demo analysis for interface preview only.",
      });
    }

    if (path.indexOf("/api/auth/login") !== -1) {
      return jsonResponse({ status: "success", token: "demo-token", user: DEMO_USER });
    }
    if (path.indexOf("/api/auth/register") !== -1) {
      return jsonResponse({ status: "success", message: "Verification code sent", email: body.email });
    }
    if (path.indexOf("/api/auth/verify-otp") !== -1) {
      return jsonResponse({ status: "success", token: "demo-token", user: DEMO_USER });
    }
    if (path.indexOf("/api/auth/resend-otp") !== -1) {
      return jsonResponse({ status: "success", message: "Code resent", resend_cooldown: 20 });
    }
    if (path.indexOf("/api/auth/google") !== -1) {
      return jsonResponse({ token: "demo-token", user: DEMO_USER });
    }
    if (path.indexOf("/api/auth/me") !== -1) {
      return jsonResponse({ user: DEMO_USER });
    }

    return jsonResponse({ detail: "Demo mode: this endpoint is not available on GitHub Pages." }, 501);
  }

  /* ------------------------------------------------------------------ */
  /* fetch wrapper                                                       */
  /* ------------------------------------------------------------------ */
  window.fetch = async function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    var isApi = url.indexOf("/api/") !== -1;

    if (!isApi) return realFetch(input, init);

    // Already known to be static hosting: answer instantly, no 404 noise.
    if (backendState === "static") {
      showBanner();
      return mock(url, init);
    }

    try {
      var res = await realFetch(input, init);
      var contentType = res.headers.get("content-type") || "";
      // Real backend (or any JSON API) answers: hand the response through,
      // including 4xx/5xx JSON errors.
      if (contentType.indexOf("application/json") !== -1) {
        backendState = "live";
        return res;
      }
      // Static hosting answered (404 HTML, SPA fallback, ...): use demo data.
      backendState = "static";
      showBanner();
      return mock(url, init);
    } catch (err) {
      // No backend at all (offline / blocked): use demo data.
      backendState = "static";
      showBanner();
      return mock(url, init);
    }
  };

  // Surface the banner early on static hosting so the demo is never
  // mistaken for a live clinical system.
  if (backendState === "static") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", showBanner);
    } else {
      showBanner();
    }
  }
})();
