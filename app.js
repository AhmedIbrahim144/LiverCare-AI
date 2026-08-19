/**
 * LiverCare AI - Main Frontend Application Engine
 * Vanilla JavaScript (ES6+)
 */

// Application State
const state = {
  currentLanguage: localStorage.getItem('livercare_lang') || 'en',
  currentTheme: localStorage.getItem('livercare_theme') || 'light',
  currentView: 'view-dashboard',
  patient: null,
  labs: [],
  sources: [],
  chatHistory: [],
  isChatLoading: false,
  units: 'metric', // 'metric' (kg, cm) or 'imperial' (lbs, in)
};

// Internationalization Dictionary (English / Arabic)
const i18n = {
  en: {
    nav_dashboard: "Dashboard",
    nav_assistant: "AI Assistant",
    nav_health: "My Health",
    nav_labs: "Lab Results",
    nav_sources: "Sources & Evidence",
    nav_settings: "Settings",
    badge_rag: "RAG",
    evidence_verified: "EASL & AASLD",
    evidence_subtitle: "Clinical Guidelines 2024",

    page_dashboard: "Dashboard",
    page_dashboard_sub: "Patient Health Overview & Metabolic Liver Monitoring",
    page_assistant: "AI Clinical Assistant",
    page_assistant_sub: "Grounded Hepatology Insights & Evidence-Based Guidance",
    page_health: "Patient Health & Tracking",
    page_health_sub: "Lifestyle Progression, Anthropometrics & Activity",
    page_labs: "Diagnostic Lab Results",
    page_labs_sub: "Liver Enzymes, Synthetic Markers & Fibrosis Biomarkers",
    page_sources: "Clinical Evidence & Guidelines",
    page_sources_sub: "EASL, AASLD, and WHO Hepatology Knowledge Base",
    page_settings: "Settings & Preferences",
    page_settings_sub: "Application Localization, Appearance & Safety Controls",

    medical_disclaimer_text: "<strong>Medical Notice:</strong> LiverCare AI provides educational information and clinical guideline synthesis. It does not replace professional medical diagnosis, advice, or emergency care.",
    
    greeting_prefix: "Welcome back, ",
    greeting_desc: "Your liver biomarkers show a positive improvement trend following lifestyle adjustments. Keep targeting 150 minutes of weekly aerobic exercise.",
    alt_improving: "ALT Enzyme: -16 IU/L",
    fib4_low: "FIB-4: 0.98 (Low Risk)",
    next_visit: "Next Checkup: Oct 15, 2026",
    btn_consult_ai: "Consult AI Assistant",
    btn_log_weight: "Log Today's Weight",

    metric_weight: "Current Weight",
    unit_kg: "kg",
    unit_lbs: "lbs",
    target_weight_label: "Target: 78.0 kg",
    metric_bmi: "Body Mass Index (BMI)",
    bmi_overweight: "Overweight (Class 1)",
    bmi_change: "Down 1.5 pts",
    metric_activity: "Weekly Aerobic Activity",
    unit_mins: "mins / wk",
    easl_target_met: "EASL Target Met (≥150m)",
    metric_fib4: "FIB-4 Fibrosis Index",
    fib4_f0f1: "Low Risk (F0-F1)",
    fib4_benchmark: "< 1.30 Threshold",

    shortcut_title: "Ask LiverCare AI Assistant",
    shortcut_subtitle: "Instant evidence-based insights grounded in EASL 2024 & AASLD clinical practice guidelines.",
    open_chat: "Open Chat",

    chip_prompt_1: "🔬 What does my ALT of 46 IU/L mean?",
    chip_prompt_2: "🥗 Best foods to reduce liver fat (MASLD)",
    chip_prompt_3: "☕ Can black coffee help liver enzymes?",
    chip_prompt_4: "📊 Explain my FIB-4 score (0.98)",

    recent_labs_title: "Recent Liver Function Panel",
    view_all_labs: "View Full Report →",
    clinical_milestones_title: "Clinical Care Milestones",
    on_track: "On Track",

    milestone_1_title: "Mediterranean Dietary Pattern",
    milestone_1_sub: "High in extra virgin olive oil, legumes, and fish",
    adherent: "Adherent",
    milestone_2_title: "Weight Reduction Target (5–7%)",
    milestone_2_sub: "5.2% achieved so far (84.5 kg / Start: 89.2 kg)",
    milestone_3_title: "Moderate Aerobic Exercise",
    milestone_3_sub: "165 min/week (Target ≥150 min EASL Recommendation)",
    target_met: "Target Met",
    milestone_4_title: "Alcohol & Hepatotoxin Avoidance",
    milestone_4_sub: "Zero alcohol consumption maintained",
    maintained: "Maintained",

    chat_grounded_status: "Grounded in EASL 2024, AASLD & WHO Clinical Guidelines",
    clear_chat: "Clear Chat",
    ai_welcome_p1: "Hello Alex, I am your <strong>LiverCare AI</strong> medical assistant.",
    ai_welcome_p2: "I am configured to provide educational insights and answer your questions about <strong>metabolic liver health (MASLD)</strong>, lab results (ALT, AST, FIB-4), dietary recommendations, and evidence-based clinical guidelines.",
    ai_welcome_disclaimer: "*Note: I provide educational clinical guidance and do not provide medical diagnosis or emergency prescriptions.*",

    chat_prompt_diet: "🥗 Diet for MASLD",
    chat_prompt_enzymes: "🔬 Interpret ALT / AST",
    chat_prompt_fib4: "📊 What is FIB-4 score?",
    chat_prompt_exercise: "🏃 Exercise guidelines",

    chat_placeholder: "Ask a question about your liver health, labs, or guidelines...",
    send_btn: "Send",
    enter_to_send_hint: "Press Enter to send • Shift + Enter for new line",
    safety_active: "Safety Guardrail Active",

    patient_profile_title: "Patient Clinical Profile",
    update_metrics: "Update Metrics",
    patient_name_label: "Patient Name",
    patient_age_label: "Age & Gender",
    patient_diagnosis_label: "Primary Diagnosis",
    patient_height_label: "Height & Target",

    weight_history_title: "Weight Progression Log",
    add_entry: "Add Entry",
    activity_breakdown_title: "Weekly Activity & Steps",
    active_level: "Active Level",
    daily_avg_steps: "Daily Steps Average",
    daily_avg_steps_sub: "Calculated over past 7 days",
    weekly_aerobic: "Weekly Aerobic Exercise",
    weekly_aerobic_sub: "Moderate intensity brisk walking & cycling",

    labs_banner_title: "Comprehensive Liver Function Panel",
    labs_banner_sub: "Last Laboratory Evaluation: July 28, 2026 • Central Clinical Laboratory",
    btn_explain_all_labs: "Explain Entire Panel with AI",
    explain_with_ai: "Explain with AI",
    reference_range: "Ref:",

    sources_title: "Clinical Practice Guidelines & Evidence Base",
    sources_subtitle: "LiverCare AI responses are indexed and retrieved using RAG from internationally recognized hepatology consensus statements.",
    search_guidelines_placeholder: "Search guidelines by keyword (e.g. MASLD, ALT, FIB-4, Mediterranean Diet, Coffee)...",

    settings_pref_title: "Language & Regional",
    settings_lang_label: "Application Language",
    settings_lang_sub: "Switch between Arabic (RTL) and English (LTR)",
    settings_units_label: "Measurement Units",
    settings_units_sub: "Weight and height measurement standards",
    unit_metric: "Metric (kg/cm)",
    unit_imperial: "Imperial (lbs/in)",
    settings_theme_title: "Appearance",
    settings_theme_label: "Color Mode",
    settings_theme_sub: "Soft medical light or high-contrast clinical dark",
    theme_light: "Light",
    theme_dark: "Dark",
    settings_safety_title: "Clinical Safety & Guardrails",
    safety_level_label: "Safety Filtering Level",
    safety_level_sub: "Strict triage protection against non-educational requests",
    strict_enabled: "Strict Medical Safe",
    rag_retrieval_label: "RAG Guideline Verification",
    rag_retrieval_sub: "Ground AI output in EASL & AASLD knowledge base",
    always_on: "Always On",
    settings_data_title: "Session & Data Management",
    reset_metrics_label: "Reset Demo Metrics",
    reset_metrics_sub: "Restore original clinical baseline data",
    reset_btn: "Reset Data",

    modal_weight_title: "Log Today's Body Weight",
    weight_input_label: "Weight (kg)",
    weight_help_text: "Sustained 5–7% weight reduction directly improves metabolic steatosis.",
    cancel_btn: "Cancel",
    save_btn: "Save Entry",
    close_btn: "Close",
    discuss_in_chat: "Ask Follow-up in Chat",
  },
  ar: {
    nav_dashboard: "لوحة التحكم",
    nav_assistant: "المساعد الطبي الذكي",
    nav_health: "صحتي والمتابعة",
    nav_labs: "نتائج التحاليل",
    nav_sources: "المراجع والإرشادات",
    nav_settings: "الإعدادات",
    badge_rag: "موثق",
    evidence_verified: "إرشادات EASL و AASLD",
    evidence_subtitle: "الدلائل السريرية المعتمدة 2024",

    page_dashboard: "لوحة التحكم",
    page_dashboard_sub: "نظرة عامة على صحة الكبد ومتابعة الحالة الأيضية",
    page_assistant: "المساعد السريري الذكي",
    page_assistant_sub: "استشارات كبدية موثوقة ومستندة إلى الدلائل العلمية",
    page_health: "صحة المريض والمتابعة",
    page_health_sub: "مؤشرات نمط الحياة والوزن والنشاط البدني",
    page_labs: "نتائج التحاليل المخبرية",
    page_labs_sub: "إنزيمات الكبد والوظائف التخليقية ومؤشرات التليف",
    page_sources: "المراجع والأدلة السريرية",
    page_sources_sub: "قاعدة المعرفة المستندة إلى EASL و AASLD ومنظمة الصحة العالمية",
    page_settings: "الإعدادات والتفضيلات",
    page_settings_sub: "تخصيص اللغة والمظهر وإعدادات الأمان الطبي",

    medical_disclaimer_text: "<strong>تنويه طبي:</strong> يقدم LiverCare AI معلومات تثقيفية قائمة على الإرشادات السريرية، ولا يحل محل التشخيص الطبي المهني أو الاستشارة المباشرة أو الرعاية الطارئة.",

    greeting_prefix: "مرحباً بعودتك، ",
    greeting_desc: "تظهر مؤشرات الكبد الحيوية تحسناً ملحوظاً بفضل الالتزام بتعديل نمط الحياة. واصل استهداف 150 دقيقة من النشاط الهوائي أسبوعياً.",
    alt_improving: "إنزيم ALT: تحسن بمقدار 16- وحدة",
    fib4_low: "مؤشر FIB-4: 0.98 (منخفض الخطورة)",
    next_visit: "الموعد القادم: 15 أكتوبر 2026",
    btn_consult_ai: "استشارة المساعد الذكي",
    btn_log_weight: "تسجيل وزن اليوم",

    metric_weight: "الوزن الحالي",
    unit_kg: "كجم",
    unit_lbs: "رطل",
    target_weight_label: "الهدف: 78.0 كجم",
    metric_bmi: "مؤشر كتلة الجسم (BMI)",
    bmi_overweight: "زيادة وزن (درجة 1)",
    bmi_change: "انخفاض 1.5 نقطة",
    metric_activity: "النشاط الهوائي الأسبوعي",
    unit_mins: "دقيقة / أسبوع",
    easl_target_met: "تم تحقيق هدف EASL (≥150د)",
    metric_fib4: "مؤشر تليف الكبد (FIB-4)",
    fib4_f0f1: "خطورة منخفضة (F0-F1)",
    fib4_benchmark: "أقل من حد 1.30",

    shortcut_title: "اسأل المساعد الطبي LiverCare AI",
    shortcut_subtitle: "إجابات فورية مدعومة بالأدلة السريرية المعتمدة من الجمعية الأوروبية (EASL) والأمريكية (AASLD).",
    open_chat: "فتح المحادثة",

    chip_prompt_1: "🔬 ماذا يعني مستوى إنزيم ALT لدي (46)؟",
    chip_prompt_2: "🥗 أفضل الأطعمة لتقليل دهون الكبد (MASLD)",
    chip_prompt_3: "☕ هل القهوة السوداء مفيدة لإنزيمات الكبد؟",
    chip_prompt_4: "📊 اشرح لي نتيجة فحص FIB-4 (0.98)",

    recent_labs_title: "أحدث تحاليل وظائف الكبد",
    view_all_labs: "عرض التقرير الكامل ←",
    clinical_milestones_title: "أهداف الخطة العلاجية",
    on_track: "ضمن المسار",

    milestone_1_title: "حمية البحر الأبيض المتوسط",
    milestone_1_sub: "غنية بزيت الزيتون البكر والبقوليات والأسماك",
    adherent: "ملتزم",
    milestone_2_title: "هدف خفض الوزن (5-7٪)",
    milestone_2_sub: "تم تحقيق 5.2٪ حتى الآن (84.5 كجم / البداية: 89.2 كجم)",
    milestone_3_title: "الرياضة الهوائية المعتدلة",
    milestone_3_sub: "165 دقيقة/أسبوع (هدف EASL الموصى به: ≥150 دقيقة)",
    target_met: "تم تحقيق الهدف",
    milestone_4_title: "تجنب الكحول والسموم الكبدية",
    milestone_4_sub: "امتناع تام ومستمر",
    maintained: "مستمر بنجاح",

    chat_grounded_status: "موثق بإرشادات EASL 2024 و AASLD ومنظمة الصحة العالمية",
    clear_chat: "مسح المحادثة",
    ai_welcome_p1: "مرحباً أليكس، أنا مساعدك الطبي الذكي <strong>LiverCare AI</strong>.",
    ai_welcome_p2: "أنا جاهز لتقديم معلومات تثقيفية موثوقة والإجابة عن استفساراتك حول <strong>صحة الكبد الأيضية (MASLD)</strong>، وشرح نتائج التحاليل (ALT, AST, FIB-4)، وتوصيات التغذية الصحية المبنية على الإرشادات السريرية العالمية.",
    ai_welcome_disclaimer: "*تنبيه: أقدم إرشادات تثقيفية معتمدة ولا أقدم تشخيصات طبية شخصية أو وصفات دوائية طارئة.*",

    chat_prompt_diet: "🥗 تغذية الكبد الدهني",
    chat_prompt_enzymes: "🔬 تفسير إنزيمات ALT / AST",
    chat_prompt_fib4: "📊 ما هو مؤشر FIB-4؟",
    chat_prompt_exercise: "🏃 التمارين الرياضية المناسبة",

    chat_placeholder: "اطرح سؤالاً حول صحة كبدك، تحاليلك، أو الإرشادات الطبية...",
    send_btn: "إرسال",
    enter_to_send_hint: "اضغط Enter للإرسال • Shift + Enter لسطر جديد",
    safety_active: "نظام الحماية الطبية مفعّل",

    patient_profile_title: "الملف السريري للمريض",
    update_metrics: "تحديث القياسات",
    patient_name_label: "اسم المريض",
    patient_age_label: "العمر والجنس",
    patient_diagnosis_label: "التشخيص الرئيسي",
    patient_height_label: "الطول والهدف",

    weight_history_title: "سجل تطور الوزن",
    add_entry: "إضافة قراءة",
    activity_breakdown_title: "النشاط الأسبوعي والخطوات",
    active_level: "مستوى نشط",
    daily_avg_steps: "متوسط الخطوات اليومي",
    daily_avg_steps_sub: "محسوب على مدار آخر 7 أيام",
    weekly_aerobic: "النشاط الهوائي الأسبوعي",
    weekly_aerobic_sub: "مشي سريع وركوب دراجة بشدة معتدلة",

    labs_banner_title: "لوحة تحاليل وظائف الكبد الشاملة",
    labs_banner_sub: "تاريخ آخر فحص مخبري: 28 يوليو 2026 • المختبر السريري المركزي",
    btn_explain_all_labs: "شرح جميع التحاليل بالذكاء الاصطناعي",
    explain_with_ai: "شرح التحليل بالذكاء الاصطناعي",
    reference_range: "المرجع:",

    sources_title: "الدلائل السريرية وقاعدة الأدلة",
    sources_subtitle: "تعتمد إجابات LiverCare AI على استرجاع وتوثيق البيانات (RAG) من التوصيات الإرشادية لجمعيات الكبد العالمية.",
    search_guidelines_placeholder: "ابحث في الإرشادات بالكلمات المفتاحية (مثل: الكبد الدهني، ALT، فايبروسكان، حمية البحر الأبيض المتوسط، القهوة)...",

    settings_pref_title: "اللغة والمنطقة",
    settings_lang_label: "لغة التطبيق",
    settings_lang_sub: "التبديل بين العربية (RTL) والإنجليزية (LTR)",
    settings_units_label: "وحدات القياس",
    settings_units_sub: "معايير قياس الوزن والطول",
    unit_metric: "متري (كجم/سم)",
    unit_imperial: "إمبراطوري (رطل/بوصة)",
    settings_theme_title: "المظهر والألوان",
    settings_theme_label: "نمط الألوان",
    settings_theme_sub: "فاتح طبي مريح أو داكن سريري عالي التباين",
    theme_light: "فاتح",
    theme_dark: "داكن",
    settings_safety_title: "الأمان السريري والضوابط الطبية",
    safety_level_label: "مستوى تصفية الأمان",
    safety_level_sub: "حماية مشددة ضد الطلبات غير التثقيفية والطارئة",
    strict_enabled: "أمان طبي صارم مفعّل",
    rag_retrieval_label: "توثيق الإرشادات السريرية (RAG)",
    rag_retrieval_sub: "تأصيل إجابات الذكاء الاصطناعي في إرشادات EASL و AASLD",
    always_on: "مفعّل دائماً",
    settings_data_title: "إدارة البيانات والجلسة",
    reset_metrics_label: "استعادة البيانات التجريبية",
    reset_metrics_sub: "إعادة ضبط القياسات إلى الحالة المرجعية الأصلية",
    reset_btn: "إعادة ضبط",

    modal_weight_title: "تسجيل وزن الجسم لليوم",
    weight_input_label: "الوزن (كجم)",
    weight_help_text: "فقدان 5-7٪ من وزن الجسم يؤدي مباشرة إلى تقليل دهون الكبد.",
    cancel_btn: "إلغاء",
    save_btn: "حفظ القراءة",
    close_btn: "إغلاق",
    discuss_in_chat: "متابعة النقاش في المحادثة",
  }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLanguage();
  setupNavigation();
  setupEventListeners();
  loadPatientData();
  loadLabsData();
  loadSourcesData();
});

// ----------------------------------------------------
// Theme Management (Light / Dark)
// ----------------------------------------------------
function initTheme() {
  const savedTheme = state.currentTheme;
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  state.currentTheme = theme;
  localStorage.setItem('livercare_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);

  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
  }

  // Update Settings buttons
  const btnLight = document.getElementById('btn-theme-light');
  const btnDark = document.getElementById('btn-theme-dark');
  if (btnLight && btnDark) {
    btnLight.classList.toggle('active', theme === 'light');
    btnDark.classList.toggle('active', theme === 'dark');
  }

  refreshIcons();
}

function toggleTheme() {
  const nextTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
}

// ----------------------------------------------------
// Language & RTL Management
// ----------------------------------------------------
function initLanguage() {
  applyLanguage(state.currentLanguage);
}

function applyLanguage(lang) {
  state.currentLanguage = lang;
  localStorage.setItem('livercare_lang', lang);

  const isArabic = lang === 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = isArabic ? 'rtl' : 'ltr';

  if (isArabic) {
    document.body.classList.add('rtl');
  } else {
    document.body.classList.remove('rtl');
  }

  // Update Language Toggles
  const btnLangEn = document.getElementById('btn-lang-en');
  const btnLangAr = document.getElementById('btn-lang-ar');
  const btnSetEn = document.getElementById('btn-settings-lang-en');
  const btnSetAr = document.getElementById('btn-settings-lang-ar');

  if (btnLangEn && btnLangAr) {
    btnLangEn.classList.toggle('active', !isArabic);
    btnLangAr.classList.toggle('active', isArabic);
  }
  if (btnSetEn && btnSetAr) {
    btnSetEn.classList.toggle('active', !isArabic);
    btnSetAr.classList.toggle('active', isArabic);
  }

  // Update Static Texts with data-i18n
  const dict = i18n[lang] || i18n.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  // Update dynamic patient elements if loaded
  if (state.patient) {
    renderPatientData(state.patient);
  }
  if (state.labs && state.labs.length > 0) {
    renderLabsData(state.labs);
  }
  if (state.sources && state.sources.length > 0) {
    renderSourcesData(state.sources);
  }

  // Update current page header breadcrumb
  updatePageBreadcrumb();
  refreshIcons();
}

// ----------------------------------------------------
// Navigation & Views
// ----------------------------------------------------
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-target');
      if (targetView) {
        switchView(targetView);
      }
    });
  });

  // Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('app-sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target) && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
      }
    });
  }
}

function switchView(viewId) {
  state.currentView = viewId;

  // Update Nav buttons
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === viewId);
  });

  // Update View sections
  document.querySelectorAll('.app-view').forEach(view => {
    view.classList.toggle('active-view', view.id === viewId);
  });

  // Close mobile sidebar if open
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) sidebar.classList.remove('mobile-open');

  // Update Header Breadcrumb
  updatePageBreadcrumb();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  refreshIcons();
}

function updatePageBreadcrumb() {
  const dict = i18n[state.currentLanguage] || i18n.en;
  const titleEl = document.getElementById('current-page-title');
  const subEl = document.getElementById('current-page-subtitle');

  if (!titleEl || !subEl) return;

  switch (state.currentView) {
    case 'view-dashboard':
      titleEl.innerText = dict.page_dashboard;
      subEl.innerText = dict.page_dashboard_sub;
      break;
    case 'view-assistant':
      titleEl.innerText = dict.page_assistant;
      subEl.innerText = dict.page_assistant_sub;
      break;
    case 'view-health':
      titleEl.innerText = dict.page_health;
      subEl.innerText = dict.page_health_sub;
      break;
    case 'view-labs':
      titleEl.innerText = dict.page_labs;
      subEl.innerText = dict.page_labs_sub;
      break;
    case 'view-sources':
      titleEl.innerText = dict.page_sources;
      subEl.innerText = dict.page_sources_sub;
      break;
    case 'view-settings':
      titleEl.innerText = dict.page_settings;
      subEl.innerText = dict.page_settings_sub;
      break;
  }
}

// ----------------------------------------------------
// Event Listeners Setup
// ----------------------------------------------------
function setupEventListeners() {
  // Theme Toggle Button
  const themeToggle = document.getElementById('theme-toggle-btn');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Language buttons
  document.getElementById('btn-lang-en')?.addEventListener('click', () => applyLanguage('en'));
  document.getElementById('btn-lang-ar')?.addEventListener('click', () => applyLanguage('ar'));
  document.getElementById('btn-settings-lang-en')?.addEventListener('click', () => applyLanguage('en'));
  document.getElementById('btn-settings-lang-ar')?.addEventListener('click', () => applyLanguage('ar'));

  // Theme buttons in settings
  document.getElementById('btn-theme-light')?.addEventListener('click', () => applyTheme('light'));
  document.getElementById('btn-theme-dark')?.addEventListener('click', () => applyTheme('dark'));

  // Shortcut & Banner actions
  document.getElementById('btn-quick-ask-ai')?.addEventListener('click', () => switchView('view-assistant'));
  document.getElementById('btn-shortcut-open-chat')?.addEventListener('click', () => switchView('view-assistant'));
  document.getElementById('btn-view-all-labs')?.addEventListener('click', () => switchView('view-labs'));

  // Modals
  const logWeightBtn1 = document.getElementById('btn-log-weight-modal');
  const logWeightBtn2 = document.getElementById('btn-log-weight-btn2');
  const modalWeight = document.getElementById('modal-log-weight');
  const closeWeightModal = document.getElementById('btn-close-weight-modal');
  const cancelWeightModal = document.getElementById('btn-cancel-weight-modal');
  const saveWeightBtn = document.getElementById('btn-save-weight');

  const openWeightModal = () => {
    if (modalWeight) modalWeight.classList.add('active');
  };
  const hideWeightModal = () => {
    if (modalWeight) modalWeight.classList.remove('active');
  };

  logWeightBtn1?.addEventListener('click', openWeightModal);
  logWeightBtn2?.addEventListener('click', openWeightModal);
  closeWeightModal?.addEventListener('click', hideWeightModal);
  cancelWeightModal?.addEventListener('click', hideWeightModal);

  saveWeightBtn?.addEventListener('click', async () => {
    const inputVal = parseFloat(document.getElementById('input-new-weight')?.value);
    if (!isNaN(inputVal) && inputVal > 30 && inputVal < 250) {
      await updatePatientWeight(inputVal);
      hideWeightModal();
    }
  });

  // Lab modal close buttons
  document.getElementById('btn-close-lab-modal')?.addEventListener('click', () => {
    document.getElementById('modal-lab-explainer')?.classList.remove('active');
  });
  document.getElementById('btn-close-lab-modal-footer')?.addEventListener('click', () => {
    document.getElementById('modal-lab-explainer')?.classList.remove('active');
  });
  document.getElementById('btn-lab-modal-discuss-ai')?.addEventListener('click', () => {
    document.getElementById('modal-lab-explainer')?.classList.remove('active');
    switchView('view-assistant');
  });

  // Explain full panel master button
  document.getElementById('btn-explain-full-panel')?.addEventListener('click', () => {
    explainLabWithAI('FULL_PANEL');
  });

  // Reset Data button in Settings
  document.getElementById('btn-reset-patient-data')?.addEventListener('click', () => {
    loadPatientData();
  });

  // Prompt chips clicks
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.prompt-chip');
    if (chip && chip.dataset.prompt) {
      const promptText = chip.dataset.prompt;
      switchView('view-assistant');
      const chatInput = document.getElementById('chat-user-input');
      if (chatInput) {
        chatInput.value = promptText;
        sendChatMessage();
      }
    }
  });

  // Chat input handling
  const chatInput = document.getElementById('chat-user-input');
  const sendBtn = document.getElementById('btn-send-message');
  const clearChatBtn = document.getElementById('btn-clear-chat');

  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });

    // Auto grow textarea
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
    });
  }

  sendBtn?.addEventListener('click', sendChatMessage);

  clearChatBtn?.addEventListener('click', () => {
    const container = document.getElementById('chat-messages-container');
    if (container) {
      // Keep only initial welcome
      const welcome = document.getElementById('initial-ai-welcome-message');
      container.innerHTML = '';
      if (welcome) container.appendChild(welcome);
    }
    state.chatHistory = [];
  });

  // Sources search input
  const sourceSearch = document.getElementById('sources-search-input');
  if (sourceSearch) {
    sourceSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      filterSources(query);
    });
  }
}

// ----------------------------------------------------
// Data Fetching & Rendering
// ----------------------------------------------------
async function loadPatientData() {
  try {
    const res = await fetch('/api/patient');
    const data = await res.json();
    if (data.success && data.patient) {
      state.patient = data.patient;
      renderPatientData(data.patient);
    }
  } catch (err) {
    console.error("Failed to fetch patient:", err);
  }
}

function renderPatientData(patient) {
  const isArabic = state.currentLanguage === 'ar';
  const dict = i18n[state.currentLanguage] || i18n.en;

  const patientName = isArabic ? patient.nameAr : patient.nameEn;
  const diagnosis = isArabic ? patient.diagnosisAr : patient.diagnosisEn;
  const fib4Risk = isArabic ? patient.fib4RiskAr : patient.fib4RiskEn;

  // Header
  const headerName = document.getElementById('header-patient-name');
  const headerDiag = document.getElementById('header-patient-diag');
  const avatarLetter = document.getElementById('patient-avatar-letter');
  if (headerName) headerName.innerText = patientName;
  if (headerDiag) headerDiag.innerText = isArabic ? "الكبد الدهني MASLD" : "MASLD Stage 1";
  if (avatarLetter) avatarLetter.innerText = patientName.charAt(0);

  // Hero greeting
  const greetingHeading = document.getElementById('greeting-heading');
  if (greetingHeading) {
    greetingHeading.innerText = `${dict.greeting_prefix}${patientName}`;
  }

  // Metric cards
  const valWeight = document.getElementById('val-current-weight');
  const valBmi = document.getElementById('val-current-bmi');
  const valActiveMins = document.getElementById('val-current-active-mins');
  const valFib4 = document.getElementById('val-current-fib4');
  const stepsLabel = document.getElementById('val-daily-steps-label');

  if (valWeight) valWeight.innerText = patient.currentWeightKg.toFixed(1);
  if (valBmi) valBmi.innerText = patient.bmi.toFixed(1);
  if (valActiveMins) valActiveMins.innerText = patient.weeklyActiveMinutes;
  if (valFib4) valFib4.innerText = patient.fib4Score.toFixed(2);
  if (stepsLabel) stepsLabel.innerText = `${patient.dailyStepsAvg.toLocaleString()} ${isArabic ? 'خطوة/يوم' : 'steps/day'}`;

  // Progress Bar for Weight (from start 89.2 to target 78.0)
  const totalToLose = patient.startingWeightKg - patient.targetWeightKg;
  const currentLost = patient.startingWeightKg - patient.currentWeightKg;
  const pct = Math.min(Math.max((currentLost / totalToLose) * 100, 10), 100);
  const weightBar = document.getElementById('weight-progress-bar');
  if (weightBar) weightBar.style.width = `${pct.toFixed(0)}%`;

  // Profile View Card
  const profileName = document.getElementById('profile-name-val');
  const profileDiag = document.getElementById('profile-diag-val');
  if (profileName) profileName.innerText = patientName;
  if (profileDiag) profileDiag.innerText = diagnosis;

  // Render Weight History Table
  const historyTable = document.getElementById('weight-history-table-body');
  if (historyTable && patient.weightHistory) {
    historyTable.innerHTML = patient.weightHistory.slice().reverse().map(w => `
      <div class="lab-mini-item">
        <div class="lab-mini-left">
          <h5>${w.weight} kg</h5>
          <span>${w.date}</span>
        </div>
        <span class="status-chip success">${(w.weight - patient.startingWeightKg).toFixed(1)} kg</span>
      </div>
    `).join('');
  }

  // Render Activity Bars
  const activityContainer = document.getElementById('activity-chart-bars');
  if (activityContainer && patient.activityHistory) {
    const maxSteps = 10000;
    activityContainer.innerHTML = patient.activityHistory.map(day => {
      const heightPct = Math.min((day.steps / maxSteps) * 100, 100);
      const dayLabel = isArabic ? day.dayAr : day.dayEn;
      return `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; flex: 1;">
          <span style="font-size: 0.7rem; font-weight: 700; color: var(--primary-700);">${(day.steps / 1000).toFixed(1)}k</span>
          <div style="width: 28px; height: 110px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); display: flex; align-items: flex-end; overflow: hidden;">
            <div style="width: 100%; height: ${heightPct}%; background: linear-gradient(180deg, var(--primary-500), var(--primary-700)); border-radius: var(--radius-sm);"></div>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">${dayLabel}</span>
        </div>
      `;
    }).join('');
  }

  refreshIcons();
}

async function updatePatientWeight(newWeight) {
  try {
    const res = await fetch('/api/patient', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight: newWeight }),
    });
    const data = await res.json();
    if (data.success && data.patient) {
      state.patient = data.patient;
      renderPatientData(data.patient);
    }
  } catch (err) {
    console.error("Failed to update weight:", err);
  }
}

// ----------------------------------------------------
// Labs Fetching & Rendering
// ----------------------------------------------------
async function loadLabsData() {
  try {
    const res = await fetch('/api/labs');
    const data = await res.json();
    if (data.success && data.labs) {
      state.labs = data.labs;
      renderLabsData(data.labs);
      renderDashboardLabs(data.labs);
    }
  } catch (err) {
    console.error("Failed to fetch labs:", err);
  }
}

function renderDashboardLabs(labs) {
  const container = document.getElementById('dashboard-lab-list');
  if (!container) return;

  const isArabic = state.currentLanguage === 'ar';
  const topLabs = labs.slice(0, 4);

  container.innerHTML = topLabs.map(lab => {
    const name = isArabic ? lab.nameAr : lab.nameEn;
    const statusText = isArabic ? lab.statusTextAr : lab.statusTextEn;
    const statusClass = lab.status === 'elevated' ? 'warning' : 'success';

    return `
      <div class="lab-mini-item">
        <div class="lab-mini-left">
          <h5>${name}</h5>
          <span>Ref: ${lab.referenceRange}</span>
        </div>
        <div class="lab-mini-right">
          <div class="lab-mini-val">${lab.value} <span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">${lab.unit}</span></div>
          <span class="status-chip ${statusClass}" style="font-size: 0.72rem; padding: 0.15rem 0.5rem;">${statusText}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderLabsData(labs) {
  const container = document.getElementById('labs-grid-container');
  if (!container) return;

  const isArabic = state.currentLanguage === 'ar';
  const dict = i18n[state.currentLanguage] || i18n.en;

  container.innerHTML = labs.map(lab => {
    const name = isArabic ? lab.nameAr : lab.nameEn;
    const statusText = isArabic ? lab.statusTextAr : lab.statusTextEn;
    const significance = isArabic ? lab.significanceAr : lab.significanceEn;
    const statusClass = lab.status === 'elevated' ? 'warning' : 'success';

    return `
      <div class="lab-card-detailed" id="lab-card-${lab.code}">
        <div>
          <div class="lab-card-top">
            <div class="lab-name-block">
              <h4>${name}</h4>
              <span>${dict.reference_range} ${lab.referenceRange}</span>
            </div>
            <span class="status-chip ${statusClass}">${statusText}</span>
          </div>

          <div class="lab-value-block">
            <span class="lab-huge-val">${lab.value}</span>
            <span class="metric-unit">${lab.unit}</span>
          </div>

          <p class="lab-significance-text">${significance}</p>
        </div>

        <div class="lab-card-footer">
          <span class="trend-badge positive">
            <i data-lucide="${lab.trend === 'improving' ? 'trending-down' : 'check'}" style="width: 14px; height: 14px;"></i>
            <span>${lab.trend === 'improving' ? (isArabic ? 'مسار متحسن' : 'Improving') : (isArabic ? 'مستقر' : 'Stable')}</span>
          </span>

          <button class="btn-explain-lab" onclick="explainLabWithAI('${lab.code}')">
            <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>
            <span>${dict.explain_with_ai}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  refreshIcons();
}

// ----------------------------------------------------
// Clinical Sources Fetching & Rendering
// ----------------------------------------------------
async function loadSourcesData() {
  try {
    const res = await fetch('/api/sources');
    const data = await res.json();
    if (data.success && data.sources) {
      state.sources = data.sources;
      renderSourcesData(data.sources);
    }
  } catch (err) {
    console.error("Failed to fetch sources:", err);
  }
}

function renderSourcesData(sources) {
  const container = document.getElementById('sources-list-container');
  if (!container) return;

  const isArabic = state.currentLanguage === 'ar';

  container.innerHTML = sources.map(s => {
    const summary = isArabic ? s.summaryAr : s.summaryEn;
    const excerpt = isArabic ? s.fullExcerptAr : s.fullExcerptEn;

    return `
      <div class="source-item-card">
        <div class="source-item-top">
          <span class="source-org-badge">${s.organization} (${s.year})</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Page ${s.page} ${s.doi ? `• DOI: ${s.doi}` : ''}</span>
        </div>
        <h3 class="source-item-title">${s.title}</h3>
        <p class="source-item-section">${s.section}</p>
        <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 0.75rem;">${summary}</p>
        <div class="source-item-excerpt">
          <strong>${isArabic ? 'النص الإرشادي السريري المقتبس:' : 'Clinical Guideline Excerpt:'}</strong><br />
          ${excerpt}
        </div>
      </div>
    `;
  }).join('');

  refreshIcons();
}

function filterSources(query) {
  if (!state.sources) return;
  const filtered = state.sources.filter(s => {
    const haystack = (s.title + ' ' + s.summaryEn + ' ' + s.summaryAr + ' ' + s.keywords.join(' ')).toLowerCase();
    return haystack.includes(query);
  });
  renderSourcesData(filtered);
}

// ----------------------------------------------------
// AI Lab Explainer Modal
// ----------------------------------------------------
window.explainLabWithAI = async function(labCode) {
  const modal = document.getElementById('modal-lab-explainer');
  const titleEl = document.getElementById('modal-lab-title');
  const contentEl = document.getElementById('modal-lab-content');

  if (!modal || !contentEl) return;

  const isArabic = state.currentLanguage === 'ar';
  modal.classList.add('active');
  
  titleEl.innerText = isArabic ? "تحليل الفحص بالذكاء الاصطناعي (RAG)" : "AI Clinical Lab Interpretation";
  contentEl.innerHTML = `
    <div style="padding: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center;">
      <div class="typing-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
      <p style="font-size: 0.88rem; color: var(--text-secondary);">
        ${isArabic ? "جاري استرجاع إرشادات EASL السريرية وتحليل الفحص..." : "Retrieving EASL / AASLD clinical guidelines and synthesizing lab findings..."}
      </p>
    </div>
  `;

  try {
    const res = await fetch('/api/labs/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        labCode,
        language: state.currentLanguage,
      }),
    });
    const data = await res.json();

    if (data.reply) {
      contentEl.innerHTML = `
        <div style="font-size: 0.95rem; line-height: 1.6; color: var(--text-primary);">
          ${formatMarkdown(data.reply)}
        </div>
        ${data.citations && data.citations.length > 0 ? renderCitationsHTML(data.citations) : ''}
      `;
      refreshIcons();
    } else {
      contentEl.innerHTML = `<p style="color: var(--status-danger-text);">Unable to retrieve lab explanation. Please try again.</p>`;
    }
  } catch (err) {
    contentEl.innerHTML = `<p style="color: var(--status-danger-text);">Error connecting to AI service.</p>`;
  }
};

// ----------------------------------------------------
// AI Chat Engine (RAG + Safety + Citations)
// ----------------------------------------------------
async function sendChatMessage() {
  if (state.isChatLoading) return;

  const chatInput = document.getElementById('chat-user-input');
  const message = chatInput?.value?.trim();
  if (!message) return;

  chatInput.value = '';
  chatInput.style.height = 'auto';

  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  // Append User Message
  appendUserMessage(message);

  // Append Typing Indicator
  const typingIndicator = createTypingIndicator();
  container.appendChild(typingIndicator);
  container.scrollTop = container.scrollHeight;

  state.isChatLoading = true;
  const sendBtn = document.getElementById('btn-send-message');
  if (sendBtn) sendBtn.disabled = true;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        language: state.currentLanguage,
        chatHistory: state.chatHistory,
      }),
    });

    const data = await res.json();
    typingIndicator.remove();

    if (data.isRefused) {
      // High-Risk Safety Card
      appendSafetyWarningMessage(data.reply, data.emergencyAdvice, data.matchedCategory);
    } else {
      // Normal Grounded AI Message with Citations
      appendAIMessage(data.reply, data.citations);
      state.chatHistory.push({ role: 'user', content: message });
      state.chatHistory.push({ role: 'assistant', content: data.reply });
    }
  } catch (err) {
    typingIndicator.remove();
    appendAIMessage("I apologize, but I encountered an error connecting to the clinical knowledge base. Please verify your connection or try again.");
  } finally {
    state.isChatLoading = false;
    if (sendBtn) sendBtn.disabled = false;
    container.scrollTop = container.scrollHeight;
    refreshIcons();
  }
}

function appendUserMessage(text) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const row = document.createElement('div');
  row.className = 'chat-message-row user';
  row.innerHTML = `
    <div class="message-avatar user-avatar">
      <i data-lucide="user" style="width: 18px; height: 18px;"></i>
    </div>
    <div class="message-body-wrap">
      <div class="message-bubble">
        <p>${escapeHTML(text)}</p>
      </div>
      <span class="message-timestamp">${now}</span>
    </div>
  `;
  container.appendChild(row);
  refreshIcons();
}

function appendAIMessage(markdownText, citations = []) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'chat-message-row ai';

  const citationsHTML = (citations && citations.length > 0) ? renderCitationsHTML(citations) : '';

  row.innerHTML = `
    <div class="message-avatar ai-avatar">
      <i data-lucide="bot" style="width: 20px; height: 20px;"></i>
    </div>
    <div class="message-body-wrap">
      <div class="message-bubble">
        ${formatMarkdown(markdownText)}
      </div>
      ${citationsHTML}
      <span class="message-timestamp">LiverCare AI &bull; Grounded in Clinical Guidelines</span>
    </div>
  `;
  container.appendChild(row);
  refreshIcons();
}

function appendSafetyWarningMessage(refusalReason, emergencyAdvice, category) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  const isArabic = state.currentLanguage === 'ar';
  const row = document.createElement('div');
  row.className = 'chat-message-row ai';
  row.innerHTML = `
    <div class="message-avatar" style="background: #ef4444; color: #fff;">
      <i data-lucide="alert-triangle" style="width: 20px; height: 20px;"></i>
    </div>
    <div class="message-body-wrap" style="width: 100%;">
      <div class="safety-warning-card">
        <div class="safety-warning-icon">
          <i data-lucide="shield-alert" style="width: 20px; height: 20px;"></i>
        </div>
        <div class="safety-warning-content">
          <h5>${isArabic ? 'تنبيه أمان سريري عالي الخطورة' : 'Clinical Safety Guardrail Alert'} (${category || 'Clinical Red Flag'})</h5>
          <p>${refusalReason}</p>
          <div class="safety-emergency-box">
            <strong>${isArabic ? 'الإجراء الطبي الموصى به:' : 'Recommended Clinical Action:'}</strong><br />
            ${emergencyAdvice}
          </div>
        </div>
      </div>
      <span class="message-timestamp">${isArabic ? 'نظام الحماية السريرية' : 'LiverCare Safety Layer'}</span>
    </div>
  `;
  container.appendChild(row);
  refreshIcons();
}

function createTypingIndicator() {
  const row = document.createElement('div');
  row.className = 'chat-message-row ai';
  row.id = 'chat-typing-indicator';
  row.innerHTML = `
    <div class="message-avatar ai-avatar">
      <i data-lucide="bot" style="width: 20px; height: 20px;"></i>
    </div>
    <div class="message-body-wrap">
      <div class="typing-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
      <span style="font-size: 0.7rem; color: var(--text-muted);">
        ${state.currentLanguage === 'ar' ? 'جاري البحث في إرشادات EASL الطبية...' : 'Searching EASL & AASLD clinical knowledge base...'}
      </span>
    </div>
  `;
  return row;
}

function renderCitationsHTML(citations) {
  const isArabic = state.currentLanguage === 'ar';
  const citationCards = citations.map(c => `
    <div class="citation-card">
      <div class="citation-card-top">
        <span class="citation-source-tag">${c.organization} (${c.year})</span>
        <span class="citation-match-score">★ ${c.relevance}% ${isArabic ? 'تطابق' : 'Relevance'}</span>
      </div>
      <div class="citation-title">${c.title}</div>
      <div class="citation-section">${c.section} &bull; Page ${c.page}</div>
      <div class="citation-excerpt">${c.summary}</div>
    </div>
  `).join('');

  return `
    <div class="citations-wrapper">
      <button class="citations-header-btn" onclick="this.nextElementSibling.classList.toggle('hidden')">
        <i data-lucide="book-marked" style="width: 14px; height: 14px;"></i>
        <span>${citations.length} ${isArabic ? 'مراجع سريرية موثقة' : 'Verified Clinical Citations'}</span>
      </button>
      <div class="citations-cards-container">
        ${citationCards}
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// Markdown Formatter & Sanitizer
// ----------------------------------------------------
function formatMarkdown(text) {
  if (!text) return '';
  let formatted = escapeHTML(text);

  // Bold
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Bullet Lists
  const lines = formatted.split('\n');
  let inList = false;
  let result = [];

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('• ') || line.startsWith('- ')) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${line.substring(2)}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      if (line) {
        result.push(`<p>${line}</p>`);
      }
    }
  }

  if (inList) result.push('</ul>');
  return result.join('');
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}
