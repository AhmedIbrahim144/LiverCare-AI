/**
 * LiverCare AI - Main Frontend Application Engine
 * Vanilla JavaScript (ES6+)
 * v2.0 - Added: Auth, Medical AI Chat, Lab Analyzer, Voice Features
 */

// ═══════════════════════════════════════════════════════════
// Application State
// ═══════════════════════════════════════════════════════════

const state = {
  currentLang: localStorage.getItem('livercare_lang') || 'en',
  currentTheme: localStorage.getItem('livercare_theme') || 'light',
  currentView: 'view-dashboard',
  isChatLoading: false,
  isMedicalChatLoading: false,
  isLabAnalyzing: false,
};

const AUTH_TOKEN_KEY = 'livercare_jwt_token';
const AUTH_USER_KEY = 'livercare_user_profile';
let currentUser = null;
let otpTargetEmail = '';
let otpCountdownTimer = null;
let medicalChatHistory = [];

// Voice
let recognition = null;
let isRecording = false;
let activeVoiceTarget = null;

// Simple Markdown to HTML converter
function parseMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Unordered lists
  html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  // Line breaks to paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  html = '<p>' + html + '</p>';
  // Clean empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>(<h[234]>)/g, '$1');
  html = html.replace(/(<\/h[234]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  return html;
}

// Sidebar Toggle
function toggleSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const main = document.querySelector('.app-main') || document.querySelector('.app-content');
  sidebar.classList.toggle('collapsed');
  if (main) main.classList.toggle('sidebar-collapsed');
}

// ═══════════════════════════════════════════════════════════
// SVG Icon System (same as original)
// ═══════════════════════════════════════════════════════════

const IC = {
  home: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  message: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
};

// ═══════════════════════════════════════════════════════════
// Internationalization (i18n) - English & Arabic
// ═══════════════════════════════════════════════════════════

const translations = {
  en: {
    nav_dashboard: "Dashboard",
    nav_assistant: "AI Assistant",
    nav_medical: "Medical AI Chat",
    nav_health: "My Health",
    nav_labs: "Lab Results",
    nav_lab_analyzer: "Lab Analyzer",
    nav_settings: "Settings",
    evidence_verified: "EASL & AASLD",
    evidence_subtitle: "Clinical Guidelines 2024",
    page_dashboard: "Dashboard",
    page_dashboard_sub: "Patient Health Overview & Metabolic Liver Monitoring",
    page_assistant: "AI Clinical Assistant",
    page_assistant_sub: "Grounded Hepatology Insights & Evidence-Based Guidance",
    page_medical: "Medical AI Chat",
    page_medical_sub: "General Liver & Medical Questions (No RAG)",
    page_health: "Patient Health & Tracking",
    page_health_sub: "Lifestyle Progression, Anthropometrics & Activity",
    page_labs: "Lab Results",
    page_labs_sub: "Liver Enzymes, Synthetic Markers & Fibrosis Biomarkers",
    page_lab_analyzer: "Lab Report Analyzer",
    page_lab_analyzer_sub: "Upload lab report images for AI-powered analysis",
    page_settings: "Settings",
    page_settings_sub: "Language, Appearance & Safety Controls",
    medical_disclaimer_text: "<strong>Medical Notice:</strong> LiverCare AI provides educational information and clinical guideline synthesis. It does not replace professional medical diagnosis, advice, or emergency care.",
    greeting_heading: "Welcome to LiverCare AI",
    greeting_desc: "Your personal AI companion for fatty liver care. Ask questions about your health, track your progress, and understand your lab results.",
    rag_active: "RAG Active",
    easl_guidelines: "EASL & AASLD Guidelines",
    btn_consult_ai: "Consult AI Assistant",
    btn_log_weight: "My Health Profile",
    metric_profile: "Patient Profile",
    profile_status_hint: "Set up your profile for personalized insights",
    metric_bmi: "Body Mass Index (BMI)",
    metric_activity: "Activity Level",
    activity_hint: "Based on your profile",
    metric_tracking: "Health Tracking",
    unit_entries: "entries",
    tracking_hint: "Log weight & activity regularly",
    shortcut_title: "Ask LiverCare AI Assistant",
    shortcut_subtitle: "Instant evidence-based insights grounded in EASL 2024 & AASLD clinical practice guidelines.",
    open_chat: "Open Chat",
    chat_grounded_status: "Evidence-based medical knowledge",
    clear_chat: "Clear Chat",
    ai_welcome_p1: "Hello! I am your <strong>LiverCare AI</strong> medical assistant.",
    ai_welcome_p2: "I can help you understand fatty liver disease, lab results (ALT, AST, FIB-4), dietary recommendations, and evidence-based clinical guidelines.",
    ai_welcome_disclaimer: "*Note: I provide educational clinical guidance and do not provide medical diagnosis or emergency prescriptions.*",
    chat_placeholder: "Ask a question about your liver health, labs, or guidelines...",
    send_btn: "Send",
    enter_to_send_hint: "Press Enter to send \u2022 Shift + Enter for new line",
    safety_active: "Safety Guardrail Active",
    sources_title: "Sources",
    patient_profile_title: "Patient Clinical Profile",
    patient_name_label: "Patient Name",
    patient_age_label: "Age & Gender",
    patient_bmi_label: "BMI",
    patient_activity_label: "Activity Level",
    edit_profile_title: "Update Profile",
    profile_name: "Name",
    profile_age: "Age",
    profile_sex: "Sex",
    profile_weight: "Weight (kg)",
    profile_height: "Height (m)",
    profile_bmi: "BMI (auto-calculated)",
    profile_diabetes: "Diabetes",
    profile_hypertension: "Hypertension",
    profile_activity: "Activity Level",
    profile_save: "Save Profile",
    sex_male: "Male",
    sex_female: "Female",
    yes: "Yes",
    no: "No",
    activity_low: "Low",
    activity_moderate: "Moderate",
    activity_high: "High",
    weight_history_title: "Weight Progression Log",
    tracking_date: "Date",
    tracking_weight: "Weight (kg)",
    tracking_activity: "Activity",
    tracking_notes: "Notes",
    tracking_save: "Save Entry",
    labs_banner_title: "Lab Explanation",
    labs_banner_sub: "Select a lab test and enter your value to get an explanation from the medical knowledge base.",
    labs_test: "Lab Test",
    labs_value: "Value",
    labs_unit: "Unit (optional)",
    labs_explain: "Explain This Result",
    lab_analyzer_title: "Lab Report Image Analyzer",
    lab_analyzer_sub: "Upload a photo of your lab report and get AI-powered analysis of your results.",
    upload_lab_image: "Upload Lab Report Image",
    upload_lab_hint: "Click or drag & drop an image (JPG, PNG)",
    analyze_btn: "Analyze Report",
    settings_pref_title: "Language & Regional",
    settings_lang_label: "Application Language",
    settings_lang_sub: "Switch between Arabic (RTL) and English (LTR)",
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
    reset_metrics_label: "Reset Chat",
    reset_metrics_sub: "Clear the current conversation history",
    reset_btn: "Clear Chat",
    login_btn: "Login",
    auth_title: "Account",
    auth_tab_login: "Login",
    auth_tab_register: "Register",
    auth_email: "Email",
    auth_password: "Password",
    auth_login_btn: "Sign In",
    auth_or: "or",
    auth_google: "Sign in with Google",
    auth_full_name: "Full Name",
    auth_confirm_password: "Confirm Password",
    auth_register_btn: "Create Account",
    otp_sent_to: "Verification code sent to:",
    otp_code_label: "6-digit code",
    otp_verify_btn: "Verify",
    otp_resend: "Resend Code",
    medical_welcome_p1: "Hello! I am your <strong>Medical AI Assistant</strong>.",
    medical_welcome_p2: "I can answer general medical questions about liver health, hepatology, and related topics. I support Arabic, English, and Egyptian Arabic.",
    medical_welcome_disclaimer: "*This assistant provides general medical information only. It does not diagnose, prescribe, or replace professional medical advice.*",
    medical_chat_placeholder: "Ask a general medical question...",
    medical_chat_subtitle: "General liver & medical questions (no RAG)",
    medical_chat_hint: "General medical information \u2014 not a substitute for professional advice",
  },
  ar: {
    nav_dashboard: "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645",
    nav_assistant: "\u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u064A",
    nav_medical: "\u0645\u062D\u0627\u0636\u062B\u0629 \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u0630\u0643\u064A",
    nav_health: "\u0635\u062D\u062A\u064A",
    nav_labs: "\u0646\u062A\u0627\u0626\u062C \u0627\u0644\u062A\u062D\u0627\u0644\u064A\u0644",
    nav_lab_analyzer: "\u0645\u062D\u0644\u0644 \u0627\u0644\u062A\u062D\u0627\u0644\u064A\u0644",
    nav_settings: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
    evidence_verified: "EASL & AASLD",
    evidence_subtitle: "\u0627\u0644\u0625\u0631\u0634\u0627\u062F\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0639\u0629 2024",
    page_dashboard: "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645",
    page_dashboard_sub: "\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u064A\u0636 \u0648\u0627\u0644\u0631\u0642\u0627\u0628\u0629 \u0627\u0644\u0643\u0628\u062F\u064A\u0629 \u0627\u0644\u062A\u0627\u0628\u0639\u0629",
    page_assistant: "\u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u0630\u0643\u064A",
    page_assistant_sub: "\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0643\u0628\u062F \u0627\u0644\u0633\u0631\u064A\u0639\u0629 \u0627\u0644\u0645\u0633\u0646\u062F\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u062F\u0644\u0629",
    page_medical: "\u0645\u062D\u0627\u0636\u062B\u0629 \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u0630\u0643\u064A",
    page_medical_sub: "\u0623\u0633\u0626\u0644\u0629 \u0637\u0628\u064A\u0629 \u0639\u0627\u0645\u0629 \u0628\u062F\u0648\u0646 RAG",
    page_health: "\u0635\u062D\u062A\u064A \u0648\u0627\u0644\u062A\u062A\u0628\u0639",
    page_health_sub: "\u0627\u0644\u062A\u0642\u062F\u0645 \u0627\u0644\u0646\u0638\u0631\u064A \u0648\u0627\u0644\u0623\u062D\u0648\u0627\u0644",
    page_labs: "\u0646\u062A\u0627\u0626\u062C \u0627\u0644\u062A\u062D\u0627\u0644\u064A\u0644",
    page_labs_sub: "\u0625\u0636\u0645\u0627\u0631\u0627\u062A \u0627\u0644\u0643\u0628\u062F \u0648\u0627\u0644\u062A\u062D\u0644\u064A\u0644\u0627\u062A",
    page_lab_analyzer: "\u0645\u062D\u0644\u0644 \u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u062A\u062D\u0627\u0644\u064A\u0644",
    page_lab_analyzer_sub: "\u0631\u0641\u0639 \u0635\u0648\u0631 \u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u062A\u062D\u0627\u0644\u064A\u0644 \u0644\u0644\u062A\u062D\u0644\u064A\u0644 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A",
    page_settings: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
    page_settings_sub: "\u0627\u0644\u0644\u063A\u0629 \u0648\u0627\u0644\u0645\u0638\u0647\u0631 \u0648\u0627\u0644\u0623\u0645\u0627\u0646",
    medical_disclaimer_text: "<strong>\u062a\u0646\u0628\u064a\u0647 \u0637\u0628\u064a:</strong> \u064a\u0648\u0641\u0631 LiverCare AI \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u062a\u0639\u0644\u064a\u0645\u064a\u0629 \u0648\u0645\u0644\u062e\u0635\u0627\u062a \u0625\u0631\u0634\u0627\u062f\u0627\u062a \u0637\u0628\u064a\u0629. \u0644\u0627 \u064a\u0628\u062f\u0644 \u0628\u062f\u0644 \u0627\u0644\u0634\u062e\u0635 \u0627\u0644\u0637\u0628\u064a \u0623\u0648 \u0627\u0644\u0634\u0631\u062d \u0627\u0644\u0645\u0647\u0646\u064a \u0623\u0648 \u0631\u0639\u0627\u0626\u064a\u0629 \u0627\u0644\u0637\u0648\u0627\u0631\u0621.",
    greeting_heading: "\u0645\u0631\u062d\u0628\u064b\u0627 \u0628\u0643 \u0641\u064a LiverCare AI",
    greeting_desc: "\u0631\u0641\u064a\u0642\u0643 \u0627\u0644\u0630\u0643\u064a \u0627\u0644\u0634\u062e\u0635\u064a \u0644\u0644\u0639\u0646\u0627\u064a\u0629 \u0628\u0627\u0644\u0643\u0628\u062F \u0627\u0644\u062f\u0647\u0646\u064a. \u0627\u0633\u0623\u0644 \u0639\u0646 \u0635\u062d\u062a\u0643 \u0648\u062a\u0627\u0628\u0639 \u062a\u0642\u062f\u0645\u0627\u062a\u0643 \u0648\u0627\u0641\u0647\u0645 \u0646\u062a\u0627\u0626\u062c \u0627\u0644\u062a\u062d\u0627\u0644\u064a\u0644.",
    rag_active: "\u0627\u0644\u0628\u062d\u062b \u0627\u0644\u0645\u0639\u0646\u0649 \u0645\u0641\u0639\u0644",
    easl_guidelines: "\u0625\u0631\u0634\u0627\u062f\u0627\u062a EASL & AASLD",
    btn_consult_ai: "\u0627\u0633\u062a\u0634\u0631\u0639 \u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u064A",
    btn_log_weight: "\u0645\u0644\u0641\u064a \u0627\u0644\u0635\u062d\u064a",
    metric_profile: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a",
    profile_status_hint: "\u0623\u0646\u0634\u0626 \u0645\u0644\u0641\u0643 \u0644\u0644\u062d\u0635\u0648\u0644 \u0639\u0644\u0649 \u062a\u0642\u0631\u064a\u0631\u0627\u062a \u0634\u062e\u0635\u064a\u0629",
    metric_bmi: "\u0645\u0624\u0634\u0631 \u0643\u062a\u0644\u0629 \u0627\u0644\u062c\u0633\u0645 (BMI)",
    metric_activity: "\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0646\u0634\u0627\u0637",
    activity_hint: "\u0628\u0646\u0621\u0627\u064b \u0639\u0644\u0649 \u0645\u0644\u0641\u0643",
    metric_tracking: "\u0627\u0644\u062a\u062a\u0628\u0639 \u0627\u0644\u0635\u062d\u064a",
    unit_entries: "\u0633\u062c\u0644\u0627\u062a",
    tracking_hint: "\u0633\u062c\u0644 \u0627\u0644\u0648\u0632\u0646 \u0648\u0627\u0644\u0646\u0634\u0627\u0637 \u0628\u0634\u0643\u0644 \u0645\u0646\u062a\u0638\u0645",
    shortcut_title: "\u0627\u0633\u0623\u0644 LiverCare AI",
    shortcut_subtitle: "\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0637\u0628\u064a\u0629 \u0641\u0648\u0631\u064a\u0629 \u0645\u0628\u0646\u064a\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u062f\u0644\u0629",
    open_chat: "\u0641\u062a\u062d \u0627\u0644\u0645\u062d\u0627\u0636\u062b\u0629",
    chat_grounded_status: "\u0645\u0628\u0646\u064a\u0629 \u0639\u0644\u0649 EASL 2024, AASLD & WHO",
    clear_chat: "\u0645\u0633\u062d \u0627\u0644\u0645\u062d\u0627\u0636\u062b\u0629",
    ai_welcome_p1: "\u0645\u0631\u062d\u0628\u064b\u0627! \u0623\u0646\u0627 <strong>LiverCare AI</strong> \u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u0630\u0643\u064A.",
    ai_welcome_p2: "\u064a\u0645\u0643\u0646\u0646\u064a \u0645\u0633\u0627\u0639\u062f\u062a\u0643 \u0641\u064a \u0641\u0647\u0645 \u0645\u0631\u0636 \u0627\u0644\u0643\u0628\u062F \u0627\u0644\u062f\u0647\u0646\u064a \u0648\u0646\u062a\u0627\u0626\u062c \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0648\u0627\u0644\u062a\u063a\u0630\u064a\u0629.",
    ai_welcome_disclaimer: "*\u0645\u0644\u0627\u062d\u0638\u0629: \u0623\u0642\u062f\u0645 \u0625\u0631\u0634\u0627\u062f\u0627\u062a \u0637\u0628\u064a\u0629 \u062a\u0639\u0644\u064a\u0645\u064a\u0629 \u0648\u0644\u0627 \u0623\u0642\u062f\u0645 \u0634\u062e\u0635 \u0637\u0628\u064a.*",
    chat_placeholder: "\u0627\u0633\u0623\u0644 \u0639\u0646 \u0635\u062d\u062a\u0643 \u0623\u0648 \u062a\u062d\u0627\u0644\u064a\u0644\u0627\u062a\u0643...",
    send_btn: "\u0625\u0631\u0633\u0627\u0644",
    enter_to_send_hint: "\u0627\u0636\u063a\u0637 Enter \u0644\u0644\u0625\u0631\u0633\u0627\u0644 \u2022 Shift + Enter \u0644\u0633\u0637\u0631 \u062c\u062f\u064a\u062f",
    safety_active: "\u062d\u0645\u0627\u064a\u0629 \u0627\u0644\u0633\u0644\u0627\u0645\u0629 \u0645\u0641\u0639\u0644\u0629",
    sources_title: "\u0627\u0644\u0645\u0635\u0627\u062f\u0631",
    patient_profile_title: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a \u0644\u0644\u0645\u0631\u064a\u0636",
    patient_name_label: "\u0627\u0644\u0645\u0631\u064a\u0636",
    patient_age_label: "\u0627\u0644\u0639\u0645\u0631 \u0648\u0627\u0644\u062c\u0646\u0633",
    patient_bmi_label: "BMI",
    patient_activity_label: "\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0646\u0634\u0627\u0637",
    edit_profile_title: "\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u0644\u0641",
    profile_name: "\u0627\u0644\u0627\u0633\u0645",
    profile_age: "\u0627\u0644\u0639\u0645\u0631",
    profile_sex: "\u0627\u0644\u062c\u0646\u0633",
    profile_weight: "\u0627\u0644\u0648\u0632\u0646 (kg)",
    profile_height: "\u0627\u0644\u0637\u0648\u0644 (m)",
    profile_bmi: "BMI (\u0645\u062d\u0633\u0648\u0628 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b)",
    profile_diabetes: "\u0627\u0644\u0633\u0643\u0631\u064a",
    profile_hypertension: "\u0631\u0641\u0639 \u0636\u063a\u0637 \u0627\u0644\u062f\u0645",
    profile_activity: "\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0646\u0634\u0627\u0637",
    profile_save: "\u062d\u0641\u0638 \u0627\u0644\u0645\u0644\u0641",
    sex_male: "\u0630\u0643\u0631",
    sex_female: "\u0623\u0646\u062b\u0649",
    yes: "\u0646\u0639\u0645",
    no: "\u0644\u0627",
    activity_low: "\u0645\u0646\u062e\u0641\u0636",
    activity_moderate: "\u0645\u062a\u0648\u0633\u0637",
    activity_high: "\u0639\u0627\u0644\u064a",
    weight_history_title: "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0648\u0632\u0646",
    tracking_date: "\u0627\u0644\u062a\u0627\u0631\u064a\u062e",
    tracking_weight: "\u0627\u0644\u0648\u0632\u0646 (kg)",
    tracking_activity: "\u0627\u0644\u0646\u0634\u0627\u0637",
    tracking_notes: "\u0645\u0644\u0627\u062d\u0638\u0627\u062a",
    tracking_save: "\u062d\u0641\u0638 \u0627\u0644\u0633\u062c\u0644",
    labs_banner_title: "\u0634\u0631\u062d \u0627\u0644\u062a\u062d\u0627\u0644\u064a\u0644",
    labs_banner_sub: "\u0627\u062e\u062a\u0631 \u0641\u062d\u0635\u0627\u064b \u0645\u062e\u0628\u0631\u064a\u0627\u064b \u0648\u0623\u062f\u062e\u0644 \u0642\u064a\u0645\u062a\u0643 \u0644\u0644\u062d\u0635\u0648\u0644 \u0639\u0644\u0649 \u0634\u0631\u062d.",
    labs_test: "\u0641\u062d\u0635 \u0645\u062e\u0628\u0631\u064a",
    labs_value: "\u0627\u0644\u0642\u064a\u0645\u0629",
    labs_unit: "\u0627\u0644\u0648\u062d\u062f\u0629 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)",
    labs_explain: "\u0627\u0634\u0631\u062d \u0647\u0630\u0647 \u0627\u0644\u0646\u062a\u064a\u062c\u0629",
    lab_analyzer_title: "\u0645\u062d\u0644\u0644 \u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u062a\u062d\u0627\u0644\u064a\u0644",
    lab_analyzer_sub: "\u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u062a\u062d\u0627\u0644\u064a\u0644 \u0644\u0644\u062a\u062d\u0644\u064a\u0644 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a",
    upload_lab_image: "\u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u062a\u062d\u0627\u0644\u064a\u0644",
    upload_lab_hint: "\u0627\u0636\u063a\u0637 \u0623\u0648 \u0627\u0633\u062d\u0628 \u0648\u0623\u0633\u0642\u0637 \u0635\u0648\u0631\u0629 (JPG, PNG)",
    analyze_btn: "\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u062a\u0642\u0631\u064a\u0631",
    settings_pref_title: "\u0627\u0644\u0644\u063a\u0629 \u0648\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a",
    settings_lang_label: "\u0644\u063a\u0629 \u0627\u0644\u062a\u0637\u0628\u064a\u0642",
    settings_lang_sub: "\u0627\u0644\u0628\u062a\u0628\u064a\u0646 \u0628\u064a\u0646 \u0627\u0644\u0639\u0631\u0628\u064a\u0629 (RTL) \u0648\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629 (LTR)",
    settings_theme_title: "\u0627\u0644\u0645\u0638\u0647\u0631",
    settings_theme_label: "\u0627\u0644\u0639\u0646\u0648\u0627\u0631",
    settings_theme_sub: "\u0645\u0638\u0647\u0631 \u0637\u0628\u064a\u0639\u064a \u0646\u0638\u064a\u0641 \u0623\u0648 \u0645\u0636\u0627\u062f \u0639\u0644\u0649",
    theme_light: "\u0641\u0627\u062a\u062d",
    theme_dark: "\u0645\u0636\u0644\u0644",
    settings_safety_title: "\u0627\u0644\u0623\u0645\u0627\u0646 \u0627\u0644\u0637\u0628\u064a \u0648\u0627\u0644\u062d\u0645\u0627\u064a\u0627\u062a",
    safety_level_label: "\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062a\u0635\u0641\u064a\u0629",
    safety_level_sub: "\u062d\u0645\u0627\u064a\u0629 \u0635\u0631\u0645\u0629 \u0636\u062f \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u063a\u064a\u0631 \u0627\u0644\u062a\u0639\u0644\u064a\u0645\u064a\u0629",
    strict_enabled: "\u0623\u0645\u0627\u0646 \u0637\u0628\u064a \u0635\u0631\u0645",
    rag_retrieval_label: "\u0627\u0644\u0628\u062d\u062b RAG",
    rag_retrieval_sub: "\u0627\u0644\u062a\u0623\u0643\u064a\u062f \u0645\u0646 EASL & AASLD",
    always_on: "\u0645\u0641\u0639\u0644 \u062f\u0627\u0626\u0645\u0627\u064b",
    settings_data_title: "\u0627\u0644\u062c\u0644\u0633\u0629 \u0648\u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a",
    reset_metrics_label: "\u0645\u0633\u062d \u0627\u0644\u0645\u062d\u0627\u0636\u062b\u0629",
    reset_metrics_sub: "\u0645\u0633\u062d \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629",
    reset_btn: "\u0645\u0633\u062d",
    login_btn: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
    auth_title: "\u0627\u0644\u062d\u0633\u0627\u0628",
    auth_tab_login: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
    auth_tab_register: "\u062a\u0633\u062c\u064a\u0644",
    auth_email: "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a",
    auth_password: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
    auth_login_btn: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
    auth_or: "\u0623\u0648",
    auth_google: "\u062a\u0633\u062c\u064a\u0644 \u0628\u062d\u0633\u0627\u0628 Google",
    auth_full_name: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644",
    auth_confirm_password: "\u062a\u0623\u0643\u064a\u062f \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
    auth_register_btn: "\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628",
    otp_sent_to: "\u0643\u0648\u062f \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0631\u0633\u0644 \u0625\u0644\u0649:",
    otp_code_label: "\u0631\u0645\u0632 \u0645\u0643\u0648\u0646 \u0645\u0646 6 \u0623\u0631\u0642\u0627\u0645",
    otp_verify_btn: "\u062a\u062d\u0642\u0642",
    otp_resend: "\u0625\u0639\u0627\u062f\u0629 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0645\u0632",
    medical_welcome_p1: "\u0645\u0631\u062d\u0628\u064b\u0627! \u0623\u0646\u0627 <strong>\u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u0630\u0643\u064A</strong>.",
    medical_welcome_p2: "\u064a\u0645\u0643\u0646\u0646\u064a \u0627\u0644\u0625\u062c\u0627\u0628\u0629 \u0639\u0646 \u0623\u0633\u0626\u0644\u0629 \u0637\u0628\u064a\u0629 \u0639\u0627\u0645\u0629 \u0639\u0646 \u0635\u062d\u0629 \u0627\u0644\u0643\u0628\u062F \u0648\u0627\u0644\u0628\u064a\u0644\u0629 \u0627\u0644\u0643\u0628\u062f\u064a\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u0636\u0639 \u0627\u0644\u0645\u0631\u062a\u0628\u0637\u0629. \u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0627\u0644\u0645\u0635\u0631\u064a\u0629 \u0648\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629 \u0648\u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0627\u0644\u0645\u0635\u0631\u064a\u0629.",
    medical_welcome_disclaimer: "*\u0647\u0630\u0627 \u0645\u0633\u0627\u0639\u062f \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0637\u0628\u064a\u0629 \u0639\u0627\u0645\u0629 \u0641\u0642\u0637. \u0644\u0627 \u064a\u0634\u062e\u0635 \u0623\u0648 \u064a\u0643\u062a\u0628 \u0627\u0644\u0633\u0639\u062f \u0627\u0644\u0645\u0647\u0646\u064a.*",
    medical_chat_placeholder: "\u0627\u0633\u0623\u0644 \u0633\u0624\u0644 \u0637\u0628\u064a \u0639\u0627\u0645...",
    medical_chat_subtitle: "\u0623\u0633\u0626\u0644\u0629 \u0643\u0628\u062f \u0648\u0637\u0628\u064a\u0629 \u0639\u0627\u0645\u0629 (\u0628\u062f\u0648\u0646 RAG)",
    medical_chat_hint: "\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0637\u0628\u064a\u0629 \u0639\u0627\u0645\u0629 \u2014 \u063a\u064a\u0631 \u0628\u062f\u064a\u0644 \u0639\u0646 \u0627\u0644\u0646\u0635\u064a\u062d\u0629 \u0627\u0644\u0645\u0647\u0646\u064a\u0629",
  }
};

// ═══════════════════════════════════════════════════════════
// Language & Theme
// ═══════════════════════════════════════════════════════════

function setLanguage(lang) {
  state.currentLang = lang;
  localStorage.setItem('livercare_lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  if (lang === 'ar') document.body.classList.add('rtl');
  else document.body.classList.remove('rtl');

  document.querySelectorAll('#language-toggle-group .toggle-pill-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll(`#language-toggle-group .toggle-pill-btn[onclick="setLanguage('${lang}')"]`).forEach(btn => btn.classList.add('active'));
  document.querySelectorAll('#btn-settings-lang-en, #btn-settings-lang-ar').forEach(btn => btn.classList.remove('active'));
  const settingsLangBtn = lang === 'en' ? document.getElementById('btn-settings-lang-en') : document.getElementById('btn-settings-lang-ar');
  if (settingsLangBtn) settingsLangBtn.classList.add('active');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) el.innerHTML = translations[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang][key]) el.placeholder = translations[lang][key];
  });

  loadProfileSummary();
  loadTrackingHistory();
}

function setTheme(theme) {
  state.currentTheme = theme;
  localStorage.setItem('livercare_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('#btn-theme-light, #btn-theme-dark').forEach(btn => btn.classList.remove('active'));
  const themeBtn = theme === 'light' ? document.getElementById('btn-theme-light') : document.getElementById('btn-theme-dark');
  if (themeBtn) themeBtn.classList.add('active');
  const svg = document.getElementById('theme-icon-svg');
  if (svg) {
    if (theme === 'dark') {
      svg.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    } else {
      svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    }
  }
}

function toggleTheme() { setTheme(state.currentTheme === 'light' ? 'dark' : 'light'); }

// ═══════════════════════════════════════════════════════════
// Navigation
// ═══════════════════════════════════════════════════════════

function showSection(viewId) {
  document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active-view'));
  const target = document.getElementById(viewId);
  if (target) target.classList.add('active-view');

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-item[data-target="${viewId}"]`);
  if (navBtn) navBtn.classList.add('active');

  const titleMap = {
    'view-dashboard': 'page_dashboard', 'view-assistant': 'page_assistant',
    'view-medical': 'page_medical', 'view-health': 'page_health',
    'view-labs': 'page_labs', 'view-lab-analyzer': 'page_lab_analyzer',
    'view-settings': 'page_settings',
  };
  const subMap = {
    'view-dashboard': 'page_dashboard_sub', 'view-assistant': 'page_assistant_sub',
    'view-medical': 'page_medical_sub', 'view-health': 'page_health_sub',
    'view-labs': 'page_labs_sub', 'view-lab-analyzer': 'page_lab_analyzer_sub',
    'view-settings': 'page_settings_sub',
  };
  const titleEl = document.getElementById('current-page-title');
  const subEl = document.getElementById('current-page-subtitle');
  if (titleEl && translations[state.currentLang][titleMap[viewId]]) titleEl.textContent = translations[state.currentLang][titleMap[viewId]];
  if (subEl && translations[state.currentLang][subMap[viewId]]) subEl.textContent = translations[state.currentLang][subMap[viewId]];

  state.currentView = viewId;
  document.getElementById('app-sidebar').classList.remove('mobile-open');
}

function toggleMobileSidebar() { document.getElementById('app-sidebar').classList.toggle('mobile-open'); }

// ═══════════════════════════════════════════════════════════
// Authentication System
// ═══════════════════════════════════════════════════════════

function getAuthToken() { return localStorage.getItem(AUTH_TOKEN_KEY); }
function setAuthToken(token) { token ? localStorage.setItem(AUTH_TOKEN_KEY, token) : localStorage.removeItem(AUTH_TOKEN_KEY); }
function getAuthHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const t = getAuthToken();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

function showAuthAlert(msg, type = 'error') {
  const el = document.getElementById('auth-alert');
  if (!el) return;
  el.className = `auth-alert ${type}`;
  el.textContent = msg;
  el.style.display = 'block';
}
function clearAuthAlert() { const el = document.getElementById('auth-alert'); if (el) { el.style.display = 'none'; el.textContent = ''; } }

function openAuthModal(defaultTab = 'login') {
  clearAuthAlert();
  document.getElementById('auth-modal-backdrop').style.display = 'flex';
  document.getElementById('auth-view-tabs').style.display = 'block';
  document.getElementById('auth-view-otp').style.display = 'none';
  switchAuthTab(defaultTab);
}

function closeAuthModal() {
  document.getElementById('auth-modal-backdrop').style.display = 'none';
  clearAuthAlert();
  if (otpCountdownTimer) { clearInterval(otpCountdownTimer); otpCountdownTimer = null; }
}

function switchAuthTab(tab) {
  clearAuthAlert();
  const isLogin = tab === 'login';
  document.getElementById('tab-btn-login').classList.toggle('active', isLogin);
  document.getElementById('tab-btn-register').classList.toggle('active', !isLogin);
  document.getElementById('form-login').style.display = isLogin ? 'flex' : 'none';
  document.getElementById('form-register').style.display = isLogin ? 'none' : 'flex';
}

function showOtpScreen(email) {
  otpTargetEmail = email;
  document.getElementById('otp-target-email').textContent = email;
  document.getElementById('otp-input').value = '';
  document.getElementById('auth-view-tabs').style.display = 'none';
  document.getElementById('auth-view-otp').style.display = 'block';
}

function updateAuthUI() {
  const authBtn = document.getElementById('auth-header-btn');
  const profileBadge = document.getElementById('user-profile-badge');
  if (currentUser) {
    if (authBtn) authBtn.style.display = 'none';
    if (profileBadge) {
      profileBadge.style.display = 'flex';
      document.getElementById('user-display-name').textContent = currentUser.full_name.split(' ')[0];
      document.getElementById('user-avatar-circle').textContent = (currentUser.full_name || 'U').charAt(0).toUpperCase();
    }
  } else {
    if (authBtn) authBtn.style.display = 'inline-flex';
    if (profileBadge) profileBadge.style.display = 'none';
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  clearAuthAlert();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showAuthAlert(state.currentLang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields'); return; }

  try {
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    let data = {}; try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      if (data.code === 'NOT_VERIFIED') { showOtpScreen(data.email || email); showAuthAlert(data.error || 'Please verify your email first', 'error'); return; }
      showAuthAlert(data.error || `Login failed (${res.status})`, 'error'); return;
    }
    setAuthToken(data.token);
    currentUser = data.user;
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
    updateAuthUI();
    closeAuthModal();
  } catch (err) { showAuthAlert(state.currentLang === 'ar' ? 'خطأ في الاتصال' : 'Connection error'); }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  clearAuthAlert();
  const fullName = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-password-confirm').value;
  if (password !== confirm) { showAuthAlert(state.currentLang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match', 'error'); return; }
  if (!fullName) { showAuthAlert(state.currentLang === 'ar' ? 'الاسم مطلوب' : 'Name is required', 'error'); return; }

  try {
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: fullName, email, password }) });
    let data = {}; try { data = await res.json(); } catch (_) {}
    if (!res.ok) { showAuthAlert(data.detail || data.error || 'Registration failed', 'error'); return; }
    showOtpScreen(email);
    showAuthAlert(state.currentLang === 'ar' ? 'تم إرسال رمز التحقق!' : 'Verification code sent!', 'success');
  } catch (err) { showAuthAlert(state.currentLang === 'ar' ? 'خطأ في الاتصال' : 'Connection error', 'error'); }
}

async function handleVerifyOtpSubmit(e) {
  e.preventDefault();
  clearAuthAlert();
  const code = document.getElementById('otp-input').value.trim();
  if (!code || code.length < 6) { showAuthAlert(state.currentLang === 'ar' ? 'أدخل 6 أرقام' : 'Enter 6-digit code', 'error'); return; }

  try {
    const res = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: otpTargetEmail, otp_code: code }) });
    let data = {}; try { data = await res.json(); } catch (_) {}
    if (!res.ok) { showAuthAlert(data.detail || data.error || 'Verification failed', 'error'); return; }
    setAuthToken(data.token);
    currentUser = data.user;
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
    updateAuthUI();
    closeAuthModal();
  } catch (err) { showAuthAlert(state.currentLang === 'ar' ? 'خطأ' : 'Error', 'error'); }
}

async function handleResendOtp() {
  if (!otpTargetEmail) return;
  try {
    const res = await fetch('/api/auth/resend-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: otpTargetEmail }) });
    let data = {}; try { data = await res.json(); } catch (_) {}
    if (res.ok) showAuthAlert(state.currentLang === 'ar' ? 'تمت إعادة الإرسال' : 'Code resent', 'success');
  } catch (_) {}
}

function handleGoogleSignIn() {
  const mockEmail = prompt(state.currentLang === 'ar' ? 'أدخل بريد Gmail:' : 'Enter your Gmail:', 'user@gmail.com');
  if (!mockEmail) return;
  fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: mockEmail.trim().toLowerCase(), name: mockEmail.split('@')[0], sub: 'google_' + Math.random().toString(36).slice(2) }) })
    .then(r => r.json()).then(data => {
      if (data.token) { setAuthToken(data.token); currentUser = data.user; localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser)); updateAuthUI(); closeAuthModal(); }
    }).catch(() => showAuthAlert('Error', 'error'));
}

function handleLogout() {
  if (!confirm(state.currentLang === 'ar' ? 'هل تريد تسجيل الخروج؟' : 'Logout?')) return;
  setAuthToken(null); currentUser = null; localStorage.removeItem(AUTH_USER_KEY); updateAuthUI();
}

async function checkAuthSession() {
  const token = getAuthToken();
  if (!token) return;
  try {
    const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) { const data = await res.json(); currentUser = data.user; updateAuthUI(); }
    else { setAuthToken(null); currentUser = null; updateAuthUI(); }
  } catch (e) { try { const c = localStorage.getItem(AUTH_USER_KEY); if (c) currentUser = JSON.parse(c); updateAuthUI(); } catch (_) {} }
}

// ═══════════════════════════════════════════════════════════
// RAG Chat (existing - preserved)
// ═══════════════════════════════════════════════════════════

function addChatMessage(role, content, citationsHtml, safetyHtml) {
  const container = document.getElementById('chat-messages-container');
  const row = document.createElement('div');
  row.className = `chat-message-row ${role}`;
  const avatarClass = role === 'ai' ? 'ai-avatar' : 'user-avatar';
  const avatarSvg = role === 'ai' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/><path d="M12 11V7"/><polyline points="8 7 12 3 16 7"/></svg>' : 'U';
  row.innerHTML = `<div class="message-avatar ${avatarClass}">${avatarSvg}</div><div class="message-body-wrap"><div class="message-bubble">${content}</div>${citationsHtml || ''}${safetyHtml || ''}</div>`;
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}

function addTypingIndicator() {
  const container = document.getElementById('chat-messages-container');
  const row = document.createElement('div');
  row.className = 'chat-message-row ai'; row.id = 'typing-indicator';
  row.innerHTML = '<div class="message-avatar ai-avatar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/><path d="M12 11V7"/><polyline points="8 7 12 3 16 7"/></svg></div><div class="message-body-wrap"><div class="typing-bubble"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>';
  container.appendChild(row); container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() { const el = document.getElementById('typing-indicator'); if (el) el.remove(); }

function formatCitationsHtml(citations, lang) {
  if (!citations || citations.length === 0) return '';
  let html = '<div class="citations-wrapper"><div class="citations-header-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> ' + (translations[lang]?.sources_title || 'Sources') + ' (' + citations.length + ')</div><div class="citations-cards-container">';
  citations.forEach(c => {
    const doc = c.document || c.doc_name || 'Unknown', page = c.page || 'N/A', score = c.relevance_score || '';
    html += `<div class="citation-card"><div class="citation-card-top"><span class="citation-source-tag">${doc}</span>${score ? `<span class="citation-match-score">${Math.round(score * 100)}%</span>` : ''}</div><div class="citation-title">Page ${page}</div></div>`;
  });
  return html + '</div></div>';
}

function formatSafetyHtml(safetyNotice) {
  if (!safetyNotice) return '';
  return '<div class="safety-warning-card"><div class="safety-warning-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><div class="safety-warning-content"><h5>Safety Notice</h5><p>' + safetyNotice + '</p></div></div>';
}

async function sendChat() {
  const input = document.getElementById('chat-user-input');
  const question = input.value.trim();
  if (!question || state.isChatLoading) return;
  state.isChatLoading = true;
  addChatMessage('user', question);
  input.value = '';
  addTypingIndicator();
  try {
    const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, lang: state.currentLang }) });
    const data = await response.json();
    removeTypingIndicator();
    addChatMessage('ai', parseMarkdown(data.answer), formatCitationsHtml(data.citations, state.currentLang), formatSafetyHtml(data.safety_notice));
  } catch (err) { removeTypingIndicator(); addChatMessage('ai', state.currentLang === 'ar' ? 'خطأ في الاتصال.' : 'Connection error.'); }
  state.isChatLoading = false;
}

function handleChatKeydown(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }
function askFromChat(chip) { const text = chip.getAttribute('data-' + state.currentLang) || chip.textContent; document.getElementById('chat-user-input').value = text; sendChat(); }
function askFromDashboard(chip) { showSection('view-assistant'); setTimeout(() => { const text = chip.getAttribute('data-' + state.currentLang) || chip.textContent; document.getElementById('chat-user-input').value = text; sendChat(); }, 100); }
function clearChat() { const c = document.getElementById('chat-messages-container'); const w = document.getElementById('initial-ai-welcome-message'); c.innerHTML = ''; if (w) c.appendChild(w); }

// ═══════════════════════════════════════════════════════════
// Medical AI Chat
// ═══════════════════════════════════════════════════════════

function addMedicalMessage(role, content) {
  const container = document.getElementById('medical-chat-messages');
  const row = document.createElement('div');
  row.className = `chat-message-row ${role}`;
  const avatarBg = role === 'ai' ? 'background: linear-gradient(135deg, #2563eb, #1d4ed8);' : '';
  const avatarSvg = role === 'ai' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' : 'U';
  row.innerHTML = `<div class="message-avatar ai-avatar" style="${avatarBg}">${avatarSvg}</div><div class="message-body-wrap"><div class="message-bubble">${content}</div></div>`;
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}

function addMedicalTyping() {
  const container = document.getElementById('medical-chat-messages');
  const row = document.createElement('div');
  row.className = 'chat-message-row ai'; row.id = 'medical-typing';
  row.innerHTML = '<div class="message-avatar ai-avatar" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div><div class="message-body-wrap"><div class="typing-bubble"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>';
  container.appendChild(row); container.scrollTop = container.scrollHeight;
}

function removeMedicalTyping() { const el = document.getElementById('medical-typing'); if (el) el.remove(); }

async function sendMedicalChat() {
  const input = document.getElementById('medical-chat-input');
  const question = input.value.trim();
  if (!question || state.isMedicalChatLoading) return;
  state.isMedicalChatLoading = true;
  addMedicalMessage('user', question);
  input.value = '';
  addMedicalTyping();
  medicalChatHistory.push({ role: 'user', content: question });

  try {
    const response = await fetch('/api/medical-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, lang: state.currentLang, history: medicalChatHistory }) });
    const data = await response.json();
    removeMedicalTyping();
    const answer = data.answer || data.detail || 'Error';
    addMedicalMessage('ai', parseMarkdown(answer));
    medicalChatHistory.push({ role: 'assistant', content: answer });
  } catch (err) { removeMedicalTyping(); addMedicalMessage('ai', state.currentLang === 'ar' ? 'خطأ في الاتصال.' : 'Connection error.'); }
  state.isMedicalChatLoading = false;
}

function clearMedicalChat() {
  medicalChatHistory = [];
  const container = document.getElementById('medical-chat-messages');
  container.innerHTML = '';
  const lang = state.currentLang;
  const welcomeHtml = lang === 'ar'
    ? '<p>مرحباً! أنا <strong>المساعد الطبي الذكي</strong>.</p><p>يمكنني الإجابة على أسئلة طبية عامة عن صحة الكبد والبِيلة والمواضيع الطبية ذات الصلة.</p><p style="font-size:0.82rem;color:var(--text-muted);margin-top:0.5rem;">*هذا المساعد يقدم معلومات طبية عامة فقط. لا يشخص أو يصف أو يحل محل النصيحة الطبية المهنية.*</p>'
    : '<p>Hello! I am your <strong>Medical AI Assistant</strong>.</p><p>I can answer general medical questions about liver health, hepatology, and related topics. I support Arabic, English, and Egyptian Arabic.</p><p style="font-size:0.82rem;color:var(--text-muted);margin-top:0.5rem;">*This assistant provides general medical information only. It does not diagnose, prescribe, or replace professional medical advice.*</p>';
  addMedicalMessage('ai', welcomeHtml);
}

// ═══════════════════════════════════════════════════════════
// Lab Image Analyzer
// ═══════════════════════════════════════════════════════════

let labImageBase64 = '';
let labResults = [];

function handleLabImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { alert('Please upload an image file.'); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    labImageBase64 = e.target.result;
    document.getElementById('lab-preview-img').src = labImageBase64;
    document.getElementById('lab-preview-section').style.display = 'block';
    document.getElementById('lab-upload-zone').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removeLabImage() {
  labImageBase64 = '';
  labResults = [];
  document.getElementById('lab-preview-section').style.display = 'none';
  document.getElementById('lab-upload-zone').style.display = 'flex';
  document.getElementById('lab-image-input').value = '';
  document.getElementById('lab-analysis-result').style.display = 'none';
}

function editLabResult(index, field, value) {
  if (labResults[index]) {
    labResults[index][field] = value;
    renderLabResultsTable();
  }
}

function renderLabResultsTable() {
  const container = document.getElementById('lab-results-table');
  if (!container || labResults.length === 0) return;
  const lang = state.currentLang;
  const isAr = lang === 'ar';

  let html = `<div class="lab-results-table-wrap">
    <table class="lab-results-table">
      <thead><tr>
        <th>${isAr ? 'اسم التحليل' : 'Test Name'}</th>
        <th>${isAr ? 'القيمة' : 'Value'}</th>
        <th>${isAr ? 'الوحدة' : 'Unit'}</th>
        <th>${isAr ? 'المدى الطبيعي' : 'Reference Range'}</th>
        <th>${isAr ? 'الحالة' : 'Status'}</th>
        <th>${isAr ? 'اين تجد القيمة' : 'Where to Find'}</th>
        <th></th>
      </tr></thead><tbody>`;

  labResults.forEach((r, i) => {
    const statusClass = r.status === 'normal' ? 'status-normal' : r.status === 'high' ? 'status-high' : r.status === 'low' ? 'status-low' : '';
    const statusText = isAr
      ? (r.status === 'normal' ? 'طبيعي' : r.status === 'high' ? 'مرتفع' : r.status === 'low' ? 'منخفض' : r.status)
      : r.status;
    html += `<tr>
      <td><strong>${r.name}</strong><br><small style="color:var(--text-muted)">${r.nameEn}</small></td>
      <td><input type="text" class="lab-edit-input" value="${r.value}" onchange="editLabResult(${i},'value',this.value)"></td>
      <td>${r.unit}</td>
      <td>${r.range}</td>
      <td><span class="lab-status-badge ${statusClass}">${statusText}</span></td>
      <td><small>${r.findWhere || '-'}</small></td>
      <td></td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
  container.style.display = 'block';
}

function parseLabAnalysis(text, lang) {
  labResults = [];
  const lines = text.split('\n');
  const isAr = lang === 'ar';

  lines.forEach(line => {
    const clean = line.replace(/\*\*/g, '').replace(/\*/g, '').trim();
    if (!clean || clean.length < 5) return;

    // Try to match patterns like "ALT: 45 U/L (7-56) - Normal" or numbered items
    const match = clean.match(/(?:\d+[\.\)]\s*)?(.+?):\s*(.+?)(?:\s*[\(（]([^)）]+)[\)）])?(?:\s*[-–]\s*(.+))?$/i);
    if (match) {
      const nameRaw = match[1].trim();
      const value = match[2].trim();
      const range = match[3] ? match[3].trim() : '';
      const statusRaw = match[4] ? match[4].trim().toLowerCase() : '';

      let status = 'normal';
      if (statusRaw.includes('مرتفع') || statusRaw.includes('high') || statusRaw.includes('عالي')) status = 'high';
      else if (statusRaw.includes('منخفض') || statusRaw.includes('low') || statusRaw.includes('واطئ')) status = 'low';
      else if (statusRaw.includes('طبيعي') || statusRaw.includes('normal')) status = 'normal';

      const unitMatch = value.match(/([\d\.]+)\s*(.*)/);
      const numValue = unitMatch ? unitMatch[1] : value;
      const unit = unitMatch ? unitMatch[2] : '';

      const knownTests = {
        'ALT': { ar: 'الأنزيم الناقل للأمين', en: 'ALT', unit: 'U/L', range: '7-56', findAr: 'ابحث عن "ALT" في عمود النتائج', findEn: 'Look for "ALT" in the Result column' },
        'AST': { ar: 'الأنزيم الناقل للأسبارت', en: 'AST', unit: 'U/L', range: '10-40', findAr: 'ابحث عن "AST" في عمود النتائج', findEn: 'Look for "AST" in the Result column' },
        'GGT': { ar: 'إنزيم جاما جلوتاميل', en: 'GGT', unit: 'U/L', range: '9-48', findAr: 'ابحث عن "GGT" في عمود النتائج', findEn: 'Look for "GGT" in the Result column' },
        'Bilirubin': { ar: 'البيليروبين', en: 'Bilirubin', unit: 'mg/dL', range: '0.1-1.2', findAr: 'ابحث عن "Bilirubin" أو "البيليروبين"', findEn: 'Look for "Bilirubin" on the report' },
        'Albumin': { ar: 'الألبومين', en: 'Albumin', unit: 'g/dL', range: '3.5-5.0', findAr: 'ابحث عن "Albumin" في عمود البروتينات', findEn: 'Look for "Albumin" in proteins section' },
        'Creatinine': { ar: 'الكرياتينين', en: 'Creatinine', unit: 'mg/dL', range: '0.6-1.2', findAr: 'ابحث عن "Creatinine" في وظائف الكلى', findEn: 'Look for "Creatinine" in kidney function' },
        'HbA1c': { ar: 'الهيموجلوبين السكري', en: 'HbA1c', unit: '%', range: '4.0-5.6', findAr: 'ابحث عن "HbA1c" في قسم السكر', findEn: 'Look for "HbA1c" in glucose section' },
        'Platelets': { ar: 'الصفائح الدموية', en: 'Platelets', unit: 'K/uL', range: '150-400', findAr: 'ابحث عن "Platelets" في تحليل الدم', findEn: 'Look for "Platelets" in blood count' },
        'WBC': { ar: 'الكريات البيضاء', en: 'WBC', unit: 'K/uL', range: '4.5-11.0', findAr: 'ابحث عن "WBC" في تحليل الدم', findEn: 'Look for "WBC" in blood count' },
        'Hemoglobin': { ar: 'الهيموجلوبين', en: 'Hemoglobin', unit: 'g/dL', range: '12.0-17.5', findAr: 'ابحث عن "Hemoglobin" أو "HGB"', findEn: 'Look for "Hemoglobin" or "HGB"' },
        'Triglycerides': { ar: 'الدهون الثلاثية', en: 'Triglycerides', unit: 'mg/dL', range: '<150', findAr: 'ابحث عن "Triglycerides" في الدهون', findEn: 'Look for "Triglycerides" in lipid panel' },
        'Cholesterol': { ar: 'الكوليسترول', en: 'Cholesterol', unit: 'mg/dL', range: '<200', findAr: 'ابحث عن "Cholesterol" في الدهون', findEn: 'Look for "Cholesterol" in lipid panel' },
        'LDL': { ar: 'الكوليسترول الضار', en: 'LDL', unit: 'mg/dL', range: '<100', findAr: 'ابحث عن "LDL" في الدهون', findEn: 'Look for "LDL" in lipid panel' },
        'HDL': { ar: 'الكوليسترول النافع', en: 'HDL', unit: 'mg/dL', range: '>40', findAr: 'ابحث عن "HDL" في الدهون', findEn: 'Look for "HDL" in lipid panel' },
      };

      let testInfo = null;
      for (const [key, info] of Object.entries(knownTests)) {
        if (nameRaw.toUpperCase().includes(key)) { testInfo = info; break; }
      }

      if (testInfo) {
        labResults.push({
          name: isAr ? testInfo.ar : testInfo.en,
          nameEn: testInfo.en,
          value: numValue || value,
          unit: unit || testInfo.unit,
          range: range || testInfo.range,
          status: status,
          findWhere: isAr ? testInfo.findAr : testInfo.findEn,
        });
      }
    }
  });
}

async function analyzeLabImage() {
  if (!labImageBase64 || state.isLabAnalyzing) return;
  state.isLabAnalyzing = true;
  const btn = document.getElementById('btn-analyze-lab');
  btn.disabled = true;
  btn.innerHTML = '<span class="typing-dot"></span> ' + (state.currentLang === 'ar' ? 'جاري التحليل...' : 'Analyzing...');

  const resultEl = document.getElementById('lab-analysis-result');
  resultEl.style.display = 'block';
  resultEl.innerHTML = '<div class="typing-bubble"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';

  try {
    const response = await fetch('/api/analyze-lab', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_base64: labImageBase64, lang: state.currentLang }) });
    const data = await response.json();
    if (data.analysis) {
      const cleanAnalysis = data.analysis.replace(/\*\*/g, '').replace(/\*/g, '');
      parseLabAnalysis(cleanAnalysis, state.currentLang);

      let tableHtml = '';
      if (labResults.length > 0) {
        tableHtml = '<div id="lab-results-table"></div>';
      }

      resultEl.innerHTML = `<div class="lab-analysis-content">
        <h3 style="margin-bottom:1rem;">${state.currentLang === 'ar' ? 'تحليل التقرير' : 'Report Analysis'}</h3>
        <div class="analysis-text">${cleanAnalysis.replace(/\n/g, '<br>')}</div>
        ${tableHtml}
        ${data.notice ? `<div class="safety-notice-inline">${data.notice}</div>` : ''}
      </div>`;

      if (labResults.length > 0) renderLabResultsTable();
    } else {
      resultEl.innerHTML = `<p style="color:var(--status-danger-text);">${data.detail || 'Analysis failed'}</p>`;
    }
  } catch (err) { resultEl.innerHTML = `<p style="color:var(--status-danger-text);">Error: ${err.message}</p>`; }

  btn.disabled = false;
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg> ${translations[state.currentLang].analyze_btn || 'Analyze Report'}`;
  state.isLabAnalyzing = false;
}

// ═══════════════════════════════════════════════════════════
// Voice Features (Browser Web Speech API)
// ═══════════════════════════════════════════════════════════

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    console.warn('Speech API requires HTTPS or localhost. Current:', location.href);
    return null;
  }
  const rec = new SpeechRecognition();
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = state.currentLang === 'ar' ? 'ar-EG' : 'en-US';
  return rec;
}

function toggleVoiceInput(target) {
  if (isRecording) { stopRecording(); return; }
  activeVoiceTarget = target;

  // Stop any previous recognition instance
  if (recognition) {
    try { recognition.abort(); } catch(e) {}
    recognition = null;
  }

  recognition = initSpeechRecognition();
  if (!recognition) {
    const isSecure = window.isSecureContext;
    const msg = state.currentLang === 'ar'
      ? (isSecure ? 'المتصفح لا يدعم التعرف على الصوت' : 'التعرف على الصوت يتطلب HTTPS. افتح على localhost أو فعّل SSL')
      : (isSecure ? 'Speech recognition not supported by this browser' : 'Speech recognition requires HTTPS. Use localhost or enable SSL');
    alert(msg);
    return;
  }

  recognition.onresult = function(event) {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) { transcript += event.results[i][0].transcript; }
    const inputId = target === 'rag' ? 'chat-user-input' : 'medical-chat-input';
    document.getElementById(inputId).value = transcript;
  };

  recognition.onend = function() { isRecording = false; updateMicUI(target, false); };
  recognition.onerror = function(e) {
    console.error('Speech recognition error:', e.error);
    isRecording = false;
    updateMicUI(target, false);
    if (e.error === 'not-allowed') {
      alert(state.currentLang === 'ar' ? 'يرجى السماح بالوصول إلى الميكروفون' : 'Please allow microphone access');
    } else if (e.error === 'network') {
      alert(state.currentLang === 'ar' ? 'خطأ في الشبكة. تأكد من الاتصال بالإنترنت' : 'Network error. Check your connection');
    } else if (e.error === 'service-not-allowed' || e.error === 'audio-capture') {
      alert(state.currentLang === 'ar' ? 'الميكروفون غير متاح. تأكد من توصيل ميكروفون' : 'Microphone not available. Check your mic');
    }
  };

  try {
    recognition.start();
    isRecording = true;
    updateMicUI(target, true);
  } catch(e) {
    console.error('Failed to start recognition:', e);
    alert(state.currentLang === 'ar' ? 'فشل بدء التعرف على الصوت' : 'Failed to start speech recognition');
  }
}

function stopRecording() { if (recognition) recognition.stop(); isRecording = false; updateMicUI(activeVoiceTarget, false); }

function updateMicUI(target, recording) {
  const btnId = target === 'rag' ? 'rag-mic-btn' : 'med-mic-btn';
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (recording) { btn.classList.add('recording'); btn.style.background = 'var(--status-danger-bg)'; btn.style.color = 'var(--status-danger-text)'; }
  else { btn.classList.remove('recording'); btn.style.background = ''; btn.style.color = ''; }
}

// ═══════════════════════════════════════════════════════════
// Patient Profile & Tracking (existing - preserved)
// ═══════════════════════════════════════════════════════════

async function saveProfile(e) {
  e.preventDefault();
  const profile = {
    name: document.getElementById('pName').value, age: parseInt(document.getElementById('pAge').value) || null,
    sex: document.getElementById('pSex').value, weight: parseFloat(document.getElementById('pWeight').value) || null,
    height: parseFloat(document.getElementById('pHeight').value) || null,
    diabetes: document.getElementById('pDiabetes').value === 'true', hypertension: document.getElementById('pHypertension').value === 'true',
    activity_level: document.getElementById('pActivity').value,
  };
  if (profile.weight && profile.height) profile.bmi = Math.round(profile.weight / (profile.height * profile.height) * 10) / 10;
  try {
    await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
    alert(state.currentLang === 'ar' ? '\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0645\u0644\u0641!' : 'Profile saved!');
    loadProfileSummary();
  } catch (err) { alert(state.currentLang === 'ar' ? '\u062e\u0637\u0623' : 'Error saving profile.'); }
}

async function loadProfile() {
  try {
    const res = await fetch('/api/profile'); const p = await res.json();
    if (p.name) document.getElementById('pName').value = p.name;
    if (p.age) document.getElementById('pAge').value = p.age;
    if (p.sex) document.getElementById('pSex').value = p.sex;
    if (p.weight) document.getElementById('pWeight').value = p.weight;
    if (p.height) document.getElementById('pHeight').value = p.height;
    if (p.bmi) document.getElementById('pBmi').value = p.bmi;
    if (p.diabetes !== undefined) document.getElementById('pDiabetes').value = String(p.diabetes);
    if (p.hypertension !== undefined) document.getElementById('pHypertension').value = String(p.hypertension);
    if (p.activity_level) document.getElementById('pActivity').value = p.activity_level;
  } catch (err) {}
}

async function loadProfileSummary() {
  try {
    const res = await fetch('/api/profile'); const p = await res.json(); const lang = state.currentLang;
    const profileStatus = document.getElementById('val-profile-status');
    const bmiVal = document.getElementById('val-current-bmi');
    const activityVal = document.getElementById('val-current-activity');
    const bmiStatus = document.getElementById('bmi-status');
    if (p.name || p.age) { if (profileStatus) profileStatus.textContent = p.name || (lang === 'ar' ? '\u0645\u0639\u0644\u0648\u0645' : 'Set'); } else { if (profileStatus) profileStatus.textContent = '--'; }
    if (p.bmi) {
      if (bmiVal) bmiVal.textContent = p.bmi;
      if (bmiStatus) { let st = '', sc = 'status-chip'; if (p.bmi < 18.5) { st = lang === 'ar' ? '\u0646\u0642\u0635' : 'Underweight'; sc += ' warning'; } else if (p.bmi < 25) { st = lang === 'ar' ? '\u0637\u0628\u064a\u0639\u064a' : 'Normal'; sc += ' success'; } else if (p.bmi < 30) { st = lang === 'ar' ? '\u0632\u0627\u0626\u062f' : 'Overweight'; sc += ' warning'; } else { st = lang === 'ar' ? '\u0633\u0645\u0646' : 'Obese'; sc += ' warning'; } bmiStatus.className = sc; bmiStatus.textContent = st; }
    } else { if (bmiVal) bmiVal.textContent = '--'; }
    if (p.activity_level) { if (activityVal) { const am = { low: lang === 'ar' ? '\u0645\u0646\u062e\u0641\u0636' : 'Low', moderate: lang === 'ar' ? '\u0645\u062a\u0648\u0633\u0637' : 'Moderate', high: lang === 'ar' ? '\u0639\u0627\u0644\u064a' : 'High' }; activityVal.textContent = am[p.activity_level] || p.activity_level; } }
    const headerName = document.getElementById('header-patient-name'), avatarLetter = document.getElementById('patient-avatar-letter'), headerDiag = document.getElementById('header-patient-diag');
    if (headerName && p.name) headerName.textContent = p.name;
    if (avatarLetter && p.name) avatarLetter.textContent = p.name.charAt(0).toUpperCase();
    if (headerDiag) { const parts = []; if (p.age) parts.push(p.age); if (p.sex) parts.push(p.sex === 'male' ? (lang === 'ar' ? '\u0630\u0643\u0631' : 'Male') : (lang === 'ar' ? '\u0623\u0646\u062b\u0649' : 'Female')); headerDiag.textContent = parts.join(' \u2022 ') || (lang === 'ar' ? '\u0645\u0644\u0641 \u0635\u062d\u064a' : 'Health Profile'); }
    const nameVal = document.getElementById('profile-name-val'), ageSexVal = document.getElementById('profile-age-sex-val'), bmiProfileVal = document.getElementById('profile-bmi-val'), activityProfileVal = document.getElementById('profile-activity-val');
    if (nameVal) nameVal.textContent = p.name || '--';
    if (ageSexVal) { const parts = []; if (p.age) parts.push(p.age + ' yrs'); if (p.sex) parts.push(p.sex === 'male' ? (lang === 'ar' ? '\u0630\u0643\u0631' : 'Male') : (lang === 'ar' ? '\u0623\u0646\u062b\u0649' : 'Female')); ageSexVal.textContent = parts.join(' \u2022 ') || '--'; }
    if (bmiProfileVal) bmiProfileVal.textContent = p.bmi || '--';
    if (activityProfileVal) { const am = { low: lang === 'ar' ? '\u0645\u0646\u062e\u0641\u0636' : 'Low', moderate: lang === 'ar' ? '\u0645\u062a\u0648\u0633\u0637' : 'Moderate', high: lang === 'ar' ? '\u0639\u0627\u0644\u064a' : 'High' }; activityProfileVal.textContent = am[p.activity_level] || p.activity_level || '--'; }
  } catch (err) {}
}

async function saveTracking(e) {
  e.preventDefault();
  const entry = { date: document.getElementById('tDate').value, weight: parseFloat(document.getElementById('tWeight').value) || null, activity: document.getElementById('tActivity').value, notes: document.getElementById('tNotes').value };
  try {
    await fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
    alert(state.currentLang === 'ar' ? '\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0633\u062c\u0644!' : 'Entry saved!');
    loadTrackingHistory(); document.getElementById('trackingForm').reset(); document.getElementById('tDate').value = new Date().toISOString().split('T')[0];
  } catch (err) { alert(state.currentLang === 'ar' ? '\u062e\u0637\u0623' : 'Error saving entry.'); }
}

async function loadTrackingHistory() {
  try {
    const res = await fetch('/api/track'); const data = await res.json(); const entries = data.entries || [];
    const tableEl = document.getElementById('weight-history-table-body'), countEl = document.getElementById('val-tracking-count'), lang = state.currentLang;
    if (countEl) countEl.textContent = entries.length;
    if (entries.length === 0) { if (tableEl) tableEl.innerHTML = lang === 'ar' ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u0633\u062c\u0644\u0627\u062a \u0628\u0639\u062f.' : 'No entries yet.'; return; }
    let html = '';
    entries.slice(-10).reverse().forEach(e => { html += `<div class="lab-mini-item"><div class="lab-mini-left"><h5>${e.date || ''}</h5><span>${e.activity || ''} ${e.notes ? '- ' + e.notes : ''}</span></div><div class="lab-mini-val">${e.weight ? e.weight + ' kg' : ''}</div></div>`; });
    if (tableEl) tableEl.innerHTML = html;
    drawWeightChart(entries.slice(-10));
  } catch (err) {}
}

function drawWeightChart(entries) {
  const canvas = document.getElementById('trackingChart'); if (!canvas) return;
  const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height);
  const weights = entries.filter(e => e.weight).map(e => e.weight);
  if (weights.length < 2) return;
  const padding = 40, w = canvas.width - padding * 2, h = canvas.height - padding * 2;
  const maxW = Math.max(...weights) + 2, minW = Math.min(...weights) - 2;
  ctx.strokeStyle = '#0d9488'; ctx.lineWidth = 2; ctx.beginPath();
  weights.forEach((weight, i) => { const x = padding + (i / (weights.length - 1)) * w; const y = padding + h - ((weight - minW) / (maxW - minW)) * h; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.stroke();
  ctx.fillStyle = '#0d9488';
  weights.forEach((weight, i) => { const x = padding + (i / (weights.length - 1)) * w; const y = padding + h - ((weight - minW) / (maxW - minW)) * h; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#0f172a'; ctx.font = '11px Plus Jakarta Sans, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(weight + ' kg', x, y - 10); ctx.fillStyle = '#0d9488'; });
}

// ═══════════════════════════════════════════════════════════
// Lab Explanation (existing)
// ═══════════════════════════════════════════════════════════

async function explainLab(e) {
  e.preventDefault();
  const testName = document.getElementById('labTest').value, value = document.getElementById('labValue').value, unit = document.getElementById('labUnit').value;
  const resultEl = document.getElementById('labResult'), lang = state.currentLang;
  const question = lang === 'ar' ? `\u0627\u0634\u0631\u062d \u0644\u064a \u0645\u0627 \u0647\u0648 \u062a\u062d\u0644\u064a\u0644 ${testName} \u0648\u0645\u0627\u0630\u0627 \u062a\u0639\u0646\u064a \u0642\u064a\u0645\u062a\u064a ${value} ${unit}\u061f` : `Explain what ${testName} measures and what a value of ${value} ${unit} means in the context of liver health.`;
  resultEl.style.display = 'block'; resultEl.innerHTML = '<div class="typing-bubble"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
  try {
    const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, lang }) });
    const data = await response.json();
    let html = `<h3>${testName}: ${value} ${unit}</h3><div style="margin-top:12px;line-height:1.7;">${data.answer}</div>`;
    if (data.citations && data.citations.length > 0) html += formatCitationsHtml(data.citations, lang);
    if (data.safety_notice) html += formatSafetyHtml(data.safety_notice);
    resultEl.innerHTML = html;
  } catch (err) { resultEl.innerHTML = lang === 'ar' ? '\u062d\u062f\u062b \u062e\u0637\u0623.' : 'An error occurred.'; }
}

// ═══════════════════════════════════════════════════════════
// Initialization
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  setTheme(state.currentTheme);
  setLanguage(state.currentLang);
  loadProfile(); loadProfileSummary(); loadTrackingHistory();
  document.getElementById('tDate').value = new Date().toISOString().split('T')[0];
  const chatInput = document.getElementById('chat-user-input');
  if (chatInput) chatInput.addEventListener('keydown', handleChatKeydown);
  const medInput = document.getElementById('medical-chat-input');
  if (medInput) medInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMedicalChat(); } });
  checkAuthSession();
});
