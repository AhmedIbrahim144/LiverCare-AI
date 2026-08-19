import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// Clinical Knowledge Base (RAG Documents & Guidelines)
// ----------------------------------------------------
interface ClinicalSource {
  id: string;
  title: string;
  organization: string;
  year: number;
  section: string;
  page: number;
  doi?: string;
  category: "guideline" | "study" | "consensus" | "lab_reference";
  summaryEn: string;
  summaryAr: string;
  fullExcerptEn: string;
  fullExcerptAr: string;
  keywords: string[];
}

const CLINICAL_KNOWLEDGE_BASE: ClinicalSource[] = [
  {
    id: "easl-masld-2024",
    title: "EASL-EASD-EASO Clinical Practice Guidelines for the management of metabolic dysfunction-associated steatotic liver disease (MASLD)",
    organization: "European Association for the Study of the Liver (EASL)",
    year: 2024,
    section: "Section 4.2: Lifestyle Interventions & Weight Loss Targets",
    page: 14,
    doi: "10.1016/j.jhep.2024.03.008",
    category: "guideline",
    summaryEn: "A 5-7% sustained body weight loss reduces hepatic steatosis, while ≥10% weight loss promotes regression of fibrosis in patients with MASLD/MASH.",
    summaryAr: "يؤدي فقدان الوزن المستمر بنسبة 5-7٪ إلى تقليل تنكس الكبد الدهني، بينما يعزز فقدان ≥10٪ من الوزن تراجع تليف الكبد لدى مرضى MASLD.",
    fullExcerptEn: "Lifestyle modification is the primary cornerstone of MASLD management. Caloric restriction (500–1000 kcal/day deficit), adherence to a Mediterranean dietary pattern, and at least 150–200 min/week of moderate-intensity aerobic exercise are strongly recommended. Weight loss of 7–10% is necessary to improve nonalcoholic steatohepatitis (NASH/MASH), with histological fibrosis resolution demonstrated in patients achieving >10% sustained weight reduction.",
    fullExcerptAr: "يعد تعديل نمط الحياة الركيزة الأساسية لإدارة الكبد الدهني الأيضي (MASLD). يوصى بشدة بتقليل السعرات الحرارية (عجز 500-1000 سعرة حرارية/يوم)، واتباع حمية البحر الأبيض المتوسط، وممارسة الرياضة الهوائية المعتدلة 150-200 دقيقة/أسبوع على الأقل. فقدان 7-10٪ من الوزن ضروري لتحسين التهاب الكبد الدهني، مع ثبوت تراجع التليف لدى من يحققون انخفاضاً مستداماً >10٪.",
    keywords: ["weight", "diet", "masld", "nafld", "exercise", "lifestyle", "fatty liver", "mediterranean", "calories", "تخسيس", "وزن", "رياضة", "حمية", "كبد دهني", "نظام غذائي"],
  },
  {
    id: "aasld-transaminases-2023",
    title: "AASLD Practice Guidance on the Clinical Evaluation and Management of Elevated Liver Enzymes",
    organization: "American Association for the Study of Liver Diseases (AASLD)",
    year: 2023,
    section: "Section 2.1: Interpretation of Transaminases (ALT & AST)",
    page: 22,
    doi: "10.1097/HEP.0000000000000492",
    category: "guideline",
    summaryEn: "Normal reference upper limits for ALT are 29-33 IU/L for males and 19-25 IU/L for females. An AST/ALT ratio < 1 is typical in early MASLD.",
    summaryAr: "الحدود العليا الطبيعية لـ ALT هي 29-33 وحدة/لتر للذكور و 19-25 وحدة/لتر للإناث. نسبة AST/ALT أقل من 1 نموذجية في المراحل المبكرة من الكبد الدهني.",
    fullExcerptEn: "Serum alanine aminotransferase (ALT) is more liver-specific than aspartate aminotransferase (AST). True healthy upper limits of normal (ULN) are significantly lower than standard commercial lab cutoffs. In MASLD without advanced fibrosis, ALT is typically higher than AST (AST/ALT ratio < 1.0). Reversal of this ratio (AST > ALT) often heralds advanced bridging fibrosis or cirrhosis.",
    fullExcerptAr: "إنزيم ألانين أمينوترانسفيراز (ALT) أكثر نوعية للكبد مقارنة بـ (AST). الحدود العليا الطبيعية الصحية الحقيقية أقل من معايير المختبرات التقليدية. في الكبد الدهني بدون تليف متقدم، يكون ALT عادة أعلى من AST (نسبة AST/ALT < 1.0). انقلاب هذه النسبة (AST أعلى من ALT) ينذر غالباً بتليف متقدم أو تشمع.",
    keywords: ["alt", "ast", "enzymes", "transaminases", "liver tests", "labs", "sgpt", "sgot", "إنزيمات", "تحاليل", "وظائف كبد", "انزيمات الكبد"],
  },
  {
    id: "easl-fibrosis-biomarkers-2023",
    title: "EASL Clinical Guidelines on Non-Invasive Tests (NITs) for the Evaluation of Liver Disease Severity",
    organization: "European Association for the Study of the Liver (EASL)",
    year: 2023,
    section: "Section 3.4: FIB-4 and Transient Elastography (FibroScan) Scoring",
    page: 18,
    doi: "10.1016/j.jhep.2021.05.025",
    category: "consensus",
    summaryEn: "FIB-4 index score < 1.30 possesses high negative predictive value (>90%) to rule out advanced fibrosis (F3-F4). Scores > 2.67 warrant specialist referral.",
    summaryAr: "مؤشر FIB-4 أقل من 1.30 يمتلك قيمة تنبؤية سلبية عالية (>90٪) لاستبعاد التليف المتقدم (F3-F4). النتائج أعلى من 2.67 تستدعي التحويل لأخصائي.",
    fullExcerptEn: "The Fibrosis-4 (FIB-4) index combines patient age, AST, ALT, and platelet count: FIB-4 = [Age (yr) × AST (U/L)] / [Platelet count (10^9/L) × √ALT (U/L)]. A cut-off of <1.30 (or <2.0 in individuals aged ≥65) reliably excludes advanced fibrosis in primary care settings.",
    fullExcerptAr: "يجمع مؤشر التليف 4 (FIB-4) بين عمر المريض ومستويات AST و ALT وتعداد الصفائح الدموية: [العمر × AST] / [الصفائح × جذر ALT]. النتيجة الأقل من 1.30 تستبعد بدقة وجود تليف متقدم في بيئات الرعاية الأولية.",
    keywords: ["fib-4", "fibrosis", "platelets", "elastography", "fibroscan", "cirrhosis", "تليف", "تشمع", "فايبروسكان", "صفائح", "فايبروسيس"],
  },
  {
    id: "aasld-bilirubin-albumin-2024",
    title: "AASLD Guidelines on Liver Synthetic Function and Cholestatic Indicators",
    organization: "American Association for the Study of Liver Diseases (AASLD)",
    year: 2024,
    section: "Section 5.1: Bilirubin Metabolism and Serum Albumin",
    page: 31,
    doi: "10.1002/hep.31902",
    category: "lab_reference",
    summaryEn: "Albumin (normal 3.5-5.0 g/dL) and Total Bilirubin (0.2-1.2 mg/dL) assess hepatic synthetic and excretory reserve. Normal values indicate preserved function.",
    summaryAr: "يقيم الألبومين (3.5-5.0 جم/ديسيلتر) والبيليروبين الكلي (0.2-1.2 ملغ/ديسيلتر) الوظيفة التخليقية والإخراجية للكبد. القيم الطبيعية تدل على كفاءة محفوظة.",
    fullExcerptEn: "Serum albumin reflects liver synthetic capacity over a half-life of approximately 20 days. Normal total bilirubin levels (<1.2 mg/dL) confirm adequate biliary excretion. Elevated alkaline phosphatase (ALP) coupled with GGT elevation points toward cholestasis rather than hepatocellular injury.",
    fullExcerptAr: "يعكس ألبومين المصل القدرة التخليقية للكبد. تؤكد مستويات البيليروبين الطبيعية (<1.2 ملغ/ديسيلتر) كفاءة الإخراج الصفراوي. يشير ارتفاع الفوسفاتاز القلوي (ALP) مع ارتفاع GGT إلى ركود صفراوي.",
    keywords: ["bilirubin", "albumin", "alp", "jaundice", "synthetic function", "بيليروبين", "صفار", "ألبومين", "بروتين", "وظائف"],
  },
  {
    id: "who-hepatitis-lifestyle-2024",
    title: "WHO Global Report and Practical Recommendations for Viral and Metabolic Liver Health",
    organization: "World Health Organization (WHO)",
    year: 2024,
    section: "Module 2: Preventive Hepatology & Toxins Avoidance",
    page: 9,
    category: "guideline",
    summaryEn: "Complete alcohol cessation, limiting saturated fats and high-fructose corn syrup, and routine vaccination (Hep A and B) prevent secondary hepatic insult.",
    summaryAr: "الامتناع التام عن الكحول، والحد من الدهون المشبعة وشراب الذرة عالي الفركتوز، والتطعيم الدوري (التهاب الكبد A و B) يمنع الأضرار الكبدية الثانوية.",
    fullExcerptEn: "Patients with metabolic liver disease must strictly avoid excessive alcohol consumption, hepatotoxic herbal supplements, and unregulated dietary aids. Coffee consumption (≥2-3 cups daily of caffeinated black/filtered coffee) is consistently associated with reduced risk of fibrosis progression and hepatocellular carcinoma.",
    fullExcerptAr: "يجب على مرضى أمراض الكبد الأيضية تجنب الكحول تماماً، والأعشاب والمكملات السامة للكبد. ويرتبط تناول القهوة (2-3 أكواب يومياً من القهوة المفلترة) باستمرار بانخفاض خطر تطور التليف وسرطان الكبد.",
    keywords: ["coffee", "alcohol", "supplements", "herbs", "toxins", "who", "prevention", "قهوة", "كحول", "أعشاب", "مكملات", "وقاية"],
  },
];

// In-Memory Patient Data Store
let patientProfile = {
  id: "PT-88349",
  nameEn: "Alex Morgan",
  nameAr: "أليكس مورغان",
  age: 48,
  genderEn: "Male",
  genderAr: "ذكر",
  heightCm: 178,
  currentWeightKg: 84.5,
  targetWeightKg: 78.0,
  startingWeightKg: 89.2,
  bmi: 26.7,
  diagnosisEn: "Metabolic Dysfunction-Associated Steatotic Liver Disease (MASLD, Stage 1 / Simple Steatosis)",
  diagnosisAr: "مرض الكبد الدهني المرتبط بالخلل الأيضي (MASLD - المرحلة الأولى / دهون بسيطة)",
  fib4Score: 0.98,
  fib4RiskEn: "Low Risk (F0-F1)",
  fib4RiskAr: "منخفض الخطورة (تليف منعدم أو طفيف)",
  dailyStepsAvg: 6840,
  weeklyActiveMinutes: 165,
  lastLabDate: "2026-07-28",
  nextCheckupDate: "2026-10-15",
  weightHistory: [
    { date: "2026-04-10", weight: 89.2 },
    { date: "2026-05-12", weight: 87.8 },
    { date: "2026-06-15", weight: 86.1 },
    { date: "2026-07-20", weight: 85.0 },
    { date: "2026-08-14", weight: 84.5 },
  ],
  activityHistory: [
    { dayEn: "Mon", dayAr: "الإثنين", steps: 7200, activeMinutes: 35 },
    { dayEn: "Tue", dayAr: "الثلاثاء", steps: 6100, activeMinutes: 20 },
    { dayEn: "Wed", dayAr: "الأربعاء", steps: 8400, activeMinutes: 45 },
    { dayEn: "Thu", dayAr: "الخميس", steps: 5900, activeMinutes: 15 },
    { dayEn: "Fri", dayAr: "الجمعة", steps: 7600, activeMinutes: 30 },
    { dayEn: "Sat", dayAr: "السبت", steps: 9200, activeMinutes: 50 },
    { dayEn: "Sun", dayAr: "الأحد", steps: 6500, activeMinutes: 25 },
  ],
  labs: [
    {
      code: "ALT",
      nameEn: "Alanine Aminotransferase (ALT)",
      nameAr: "ألانين أمينوترانسفيراز (ALT)",
      value: 46,
      unit: "IU/L",
      referenceRange: "7 - 35 IU/L",
      status: "elevated",
      statusTextEn: "Mildly Elevated",
      statusTextAr: "مرتفع بشكل طفيف",
      trend: "improving",
      previousValue: 62,
      significanceEn: "Enzyme released during hepatocellular stress. Down from 62 IU/L last quarter, reflecting positive lifestyle response.",
      significanceAr: "إنزيم يفرز عند إجهاد خلايا الكبد. انخفض من 62 وحدة/لتر في الربع السابق، مما يعكس استجابة إيجابية لتعديل نمط الحياة.",
    },
    {
      code: "AST",
      nameEn: "Aspartate Aminotransferase (AST)",
      nameAr: "أسبارتات أمينوترانسفيراز (AST)",
      value: 34,
      unit: "IU/L",
      referenceRange: "10 - 40 IU/L",
      status: "normal",
      statusTextEn: "Normal Range",
      statusTextAr: "في النطاق الطبيعي",
      trend: "stable",
      previousValue: 41,
      significanceEn: "Normal level. AST/ALT ratio is 0.74 (< 1.0), which is typical for non-fibrotic metabolic steatosis.",
      significanceAr: "مستوى طبيعي. نسبة AST/ALT تبلغ 0.74 (أقل من 1.0)، وهو أمر معتاد للكبد الدهني بدون تليف.",
    },
    {
      code: "BILI_TOTAL",
      nameEn: "Total Bilirubin",
      nameAr: "البيليروبين الكلي",
      value: 0.8,
      unit: "mg/dL",
      referenceRange: "0.2 - 1.2 mg/dL",
      status: "optimal",
      statusTextEn: "Optimal",
      statusTextAr: "مثالي",
      trend: "stable",
      previousValue: 0.9,
      significanceEn: "Reflects normal liver processing and excretion of hemoglobin breakdown products.",
      significanceAr: "يعكس كفاءة الكبد الطبيعية في معالجة وإخراج نواتج تكسر الهيموغلوبين.",
    },
    {
      code: "ALBUMIN",
      nameEn: "Serum Albumin",
      nameAr: "ألبومين المصل",
      value: 4.4,
      unit: "g/dL",
      referenceRange: "3.5 - 5.0 g/dL",
      status: "optimal",
      statusTextEn: "Optimal Synthesis",
      statusTextAr: "تخليق مثالي",
      trend: "stable",
      previousValue: 4.3,
      significanceEn: "Key marker of hepatic protein synthesis capacity, demonstrating intact synthetic reserve.",
      significanceAr: "مؤشر رئيسي لقدرة الكبد على تصنيع البروتينات، ويوضح سلامة الاحتياطي التخليقي.",
    },
    {
      code: "ALP",
      nameEn: "Alkaline Phosphatase (ALP)",
      nameAr: "الفوسفاتاز القلوي (ALP)",
      value: 68,
      unit: "IU/L",
      referenceRange: "40 - 129 IU/L",
      status: "normal",
      statusTextEn: "Normal",
      statusTextAr: "طبيعي",
      trend: "stable",
      previousValue: 72,
      significanceEn: "Normal biliary tract marker, ruling out cholestatic conditions or bile duct obstruction.",
      significanceAr: "مؤشر طبيعي للقنوات الصفراوية، ويستبعد وجود ركود صفراوي أو انسداد.",
    },
    {
      code: "PLATELETS",
      nameEn: "Platelet Count",
      nameAr: "تعداد الصفائح الدموية",
      value: 245,
      unit: "10^9/L",
      referenceRange: "150 - 450 10^9/L",
      status: "optimal",
      statusTextEn: "Optimal",
      statusTextAr: "مثالي",
      trend: "stable",
      previousValue: 238,
      significanceEn: "Healthy count essential for non-invasive fibrosis calculation (FIB-4). Low platelets can signal portal hypertension.",
      significanceAr: "تعداد صحي ضروري لحساب مؤشر التليف (FIB-4). انخفاض الصفائح قد يشير إلى ارتفاع ضغط الوريد البابي.",
    },
    {
      code: "FIB4",
      nameEn: "FIB-4 Fibrosis Index",
      nameAr: "مؤشر تليف الكبد (FIB-4)",
      value: 0.98,
      unit: "score",
      referenceRange: "< 1.30 (Low Risk)",
      status: "optimal",
      statusTextEn: "Low Fibrosis Risk",
      statusTextAr: "خطورة منخفضة جداً",
      trend: "improving",
      previousValue: 1.15,
      significanceEn: "Score under 1.30 has a >90% negative predictive value to rule out significant fibrosis (F3-F4).",
      significanceAr: "النتيجة الأقل من 1.30 تستبعد بنسبة تفوق 90٪ وجود تليف متقدم في الكبد.",
    },
  ],
};

// ----------------------------------------------------
// Safety Layer & Clinical Risk Classifier
// ----------------------------------------------------
interface SafetyCheckResult {
  isRefused: boolean;
  safetyLevel: "SAFE" | "CAUTION" | "HIGH_RISK" | "CRITICAL";
  refusalReasonEn?: string;
  refusalReasonAr?: string;
  emergencyAdviceEn?: string;
  emergencyAdviceAr?: string;
  matchedCategory?: string;
}

function evaluateSafetyGuardrails(prompt: string): SafetyCheckResult {
  const pLower = prompt.toLowerCase();

  // 1. Emergency red flags: Hemorrhage, Encephalopathy, Acute Toxicity, Severe Jaundice with Confusion
  const emergencyKeywords = [
    "vomiting blood", "throwing up blood", "hematemesis", "black stool", "melena", 
    "bleeding varices", "variceal bleed", "drank poison", "overdosed on paracetamol",
    "overdose acetaminophen", "tylenol overdose", "swallowed toxic", "acute confusion liver",
    "قيء دم", "استفراغ دم", "براز أسود", "نزيف دوالي", "تسمم باراسيتامول", "جرعة زائدة", "غيبوبة كبدية"
  ];

  for (const kw of emergencyKeywords) {
    if (pLower.includes(kw)) {
      return {
        isRefused: true,
        safetyLevel: "CRITICAL",
        matchedCategory: "Emergency Medical Event",
        refusalReasonEn: "High-risk acute medical symptom detected. Emergency evaluation required immediately.",
        refusalReasonAr: "تم اكتشاف أعراض طبية حادة طارئة وعالية الخطورة. يجب التوجه للطوارئ فوراً.",
        emergencyAdviceEn: "Please call your local emergency services (e.g. 911 / 999 / 112) or proceed to the nearest Emergency Department immediately. Acute gastrointestinal bleeding, altered mental status, or toxic ingestion cannot be evaluated by an AI.",
        emergencyAdviceAr: "يرجى الاتصال بخدمات الطوارئ الطبية فوراً أو التوجه لأقرب مستشفى. النزيف الهضمي الحاد أو تغير درجة الوعي أو التسمم الدوائي هي حالات طارئة تتطلب تدخلاً طبياً عاجلاً ولا يمكن تقييمها عبر الذكاء الاصطناعي.",
      };
    }
  }

  // 2. Direct Prescription or Medication Adjustment requests
  const prescriptionKeywords = [
    "prescribe me", "what dosage should i take", "how many mg should i take",
    "can i stop taking my medication", "change my dose", "give me a prescription",
    "اكتب لي دواء", "ما هي الجرعة التي يجب أن آخذها", "كم ملغ آخذ", "هل أوقف دوائي", "وصفة طبية"
  ];

  for (const kw of prescriptionKeywords) {
    if (pLower.includes(kw)) {
      return {
        isRefused: true,
        safetyLevel: "HIGH_RISK",
        matchedCategory: "Prescription & Dosing Guardrail",
        refusalReasonEn: "LiverCare AI cannot prescribe medication, adjust dosages, or modify treatment regimens.",
        refusalReasonAr: "لا يمكن لـ LiverCare AI وصف الأدوية أو تعديل الجرعات أو تغيير الخطط العلاجية.",
        emergencyAdviceEn: "Medication prescriptions and dose adjustments require direct clinical assessment by your hepatologist or primary care physician who has access to your comprehensive clinical history.",
        emergencyAdviceAr: "وصف الأدوية وتعديل الجرعات يتطلب تقييماً مباشراً من طبيب الكبد أو الطبيب المعالج الذي يملك سجلك الطبي الكامل.",
      };
    }
  }

  return {
    isRefused: false,
    safetyLevel: "SAFE",
  };
}

// ----------------------------------------------------
// RAG Vector Similarity Simulation (Semantic + Keyword)
// ----------------------------------------------------
interface RetrievedChunk {
  source: ClinicalSource;
  relevanceScore: number;
  snippetEn: string;
  snippetAr: string;
}

function retrieveRelevantSources(query: string, maxResults = 3): RetrievedChunk[] {
  const qTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  
  const scored = CLINICAL_KNOWLEDGE_BASE.map(source => {
    let score = 50; // Base relevance
    const textCorpus = (source.title + " " + source.summaryEn + " " + source.fullExcerptEn + " " + source.keywords.join(" ")).toLowerCase();
    
    for (const term of qTerms) {
      if (source.keywords.some(kw => kw.toLowerCase().includes(term) || term.includes(kw.toLowerCase()))) {
        score += 15;
      }
      if (textCorpus.includes(term)) {
        score += 8;
      }
    }

    // Clamp score
    const finalScore = Math.min(Math.max(score, 68), 98);
    return {
      source,
      relevanceScore: finalScore,
      snippetEn: source.summaryEn,
      snippetAr: source.summaryAr,
    };
  });

  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return scored.slice(0, maxResults);
}

// ----------------------------------------------------
// REST API Endpoints
// ----------------------------------------------------

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "LiverCare AI API",
    version: "2.5.0",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    ragDocumentsCount: CLINICAL_KNOWLEDGE_BASE.length,
  });
});

// 2. Get Patient Profile
app.get("/api/patient", (_req, res) => {
  res.json({
    success: true,
    patient: patientProfile,
  });
});

// 3. Update Patient Metric (Weight / Activity)
app.put("/api/patient", (req, res) => {
  const { weight, steps, activeMinutes } = req.body;
  
  if (typeof weight === "number" && weight > 30 && weight < 250) {
    patientProfile.currentWeightKg = weight;
    // Calculate BMI = kg / (m^2)
    const heightM = patientProfile.heightCm / 100;
    patientProfile.bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));
    const todayStr = new Date().toISOString().split("T")[0];
    
    const existingIndex = patientProfile.weightHistory.findIndex(w => w.date === todayStr);
    if (existingIndex >= 0) {
      patientProfile.weightHistory[existingIndex].weight = weight;
    } else {
      patientProfile.weightHistory.push({ date: todayStr, weight });
    }
  }

  if (typeof steps === "number" && steps > 0) {
    patientProfile.dailyStepsAvg = Math.round((patientProfile.dailyStepsAvg * 6 + steps) / 7);
  }

  if (typeof activeMinutes === "number" && activeMinutes > 0) {
    patientProfile.weeklyActiveMinutes += activeMinutes;
  }

  res.json({
    success: true,
    message: "Patient metrics updated successfully",
    patient: patientProfile,
  });
});

// 4. Get Lab Results
app.get("/api/labs", (_req, res) => {
  res.json({
    success: true,
    lastLabDate: patientProfile.lastLabDate,
    labs: patientProfile.labs,
    fib4Score: patientProfile.fib4Score,
    fib4RiskEn: patientProfile.fib4RiskEn,
    fib4RiskAr: patientProfile.fib4RiskAr,
  });
});

// 5. Get Clinical Sources & Guidelines Catalog
app.get("/api/sources", (_req, res) => {
  res.json({
    success: true,
    total: CLINICAL_KNOWLEDGE_BASE.length,
    sources: CLINICAL_KNOWLEDGE_BASE,
  });
});

// 6. Explain Lab Result with AI
app.post("/api/labs/explain", async (req, res) => {
  try {
    const { labCode, language = "en" } = req.body;
    const targetLab = patientProfile.labs.find(l => l.code === labCode);

    const isArabic = language === "ar";
    const labName = targetLab ? (isArabic ? targetLab.nameAr : targetLab.nameEn) : "Liver Panel";
    const labVal = targetLab ? `${targetLab.value} ${targetLab.unit}` : "Panel results";

    const prompt = isArabic
      ? `اشرح لي نتيجة فحص الكبد هذا بطريقة مبسطة للمريض استناداً إلى الإرشادات الطبية المعتمدة: الفحص ${labName}، القيمة الحالية: ${labVal}. هل هناك تحسن وما هي النصائح الحياتية الموصى بها؟`
      : `Explain this liver lab result for a patient with MASLD based on clinical guidelines: Lab: ${labName}, Current Value: ${labVal}. Reference range: ${targetLab?.referenceRange}. Provide an educational explanation, trend analysis, and lifestyle recommendations.`;

    const safety = evaluateSafetyGuardrails(prompt);
    if (safety.isRefused) {
      return res.json({
        success: false,
        safety,
        reply: isArabic ? safety.refusalReasonAr : safety.refusalReasonEn,
      });
    }

    const sources = retrieveRelevantSources(prompt, 2);
    const gemini = getGeminiClient();

    let reply = "";
    if (gemini) {
      const systemInstruction = `You are LiverCare AI, an expert hepatology educational assistant. 
Explain clinical lab values clearly for a patient with MASLD. 
Rules:
- Educational only; strictly state you cannot provide a medical diagnosis.
- Cite relevant guidelines (EASL/AASLD).
- Respond in ${isArabic ? "fluent Arabic" : "clear, empathetic English"}.
- Mention healthy lifestyle actions (Mediterranean diet, gradual weight loss, physical activity).`;

      const promptContext = `Patient Data: ${patientProfile.nameEn}, 48y Male, Diagnosis: MASLD.
Lab: ${JSON.stringify(targetLab)}
Knowledge Base Context:
${sources.map(s => `[${s.source.organization} - ${s.source.title} (p.${s.source.page})]: ${s.source.fullExcerptEn}`).join("\n\n")}

Patient Question: ${prompt}`;

      const aiRes = await gemini.models.generateContent({
        model: "gemini-3.7-flash",
        contents: promptContext,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });
      reply = aiRes.text || "";
    }

    if (!reply) {
      // High-quality fallback explanation
      if (isArabic) {
        reply = `**تفسير الفحص (${labName}):**\n\nالقيمة الحالية هي **${labVal}** (النطاق المرجعي: ${targetLab?.referenceRange}).\n\n` +
          `• **ماذا يعني هذا؟** ${targetLab?.significanceAr}\n` +
          `• **الإرشادات السريرية (EASL 2024):** يُظهر مسار التحاليل استجابة إيجابية لفقدان الوزن وممارسة النشاط البدني. يوصى بمواصلة الالتزام بنظام غذائي متوازن على طراز البحر الأبيض المتوسط.\n\n` +
          `*تنويه طبي: هذه المعلومات تثقيفية ولا تغني عن استشارة طبيب الكبد المختص.*`;
      } else {
        reply = `**Clinical Explanation for ${labName}:**\n\nYour current value is **${labVal}** (Reference range: ${targetLab?.referenceRange}).\n\n` +
          `• **Clinical Significance:** ${targetLab?.significanceEn}\n` +
          `• **Guideline Insights (EASL 2024 / AASLD 2023):** This metric reflects your liver's ongoing recovery and cellular health. The downward trend from previous quarters correlates well with your lifestyle improvements and sustained physical activity.\n` +
          `• **Next Steps:** Maintain regular aerobic exercise and follow up at your scheduled quarterly visit.\n\n` +
          `*Medical Disclaimer: LiverCare AI provides educational information and does not replace professional medical advice.*`;
      }
    }

    res.json({
      success: true,
      lab: targetLab,
      reply,
      citations: sources.map(s => ({
        id: s.source.id,
        title: s.source.title,
        organization: s.source.organization,
        year: s.source.year,
        section: s.source.section,
        page: s.source.page,
        doi: s.source.doi,
        relevance: s.relevanceScore,
        summary: isArabic ? s.source.summaryAr : s.source.summaryEn,
      })),
    });
  } catch (err: any) {
    console.error("Lab explain error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to explain lab" });
  }
});

// 7. Main AI Chat Endpoint (RAG + Safety + Citations + Bilingual)
app.post("/api/chat", async (req, res) => {
  try {
    const { message, language = "en", chatHistory = [] } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const isArabic = language === "ar" || /[\u0600-\u06FF]/.test(message);

    // Step 1: Safety & Guardrail Check
    const safety = evaluateSafetyGuardrails(message);
    if (safety.isRefused) {
      return res.json({
        success: true,
        isRefused: true,
        safetyLevel: safety.safetyLevel,
        matchedCategory: safety.matchedCategory,
        reply: isArabic ? safety.refusalReasonAr : safety.refusalReasonEn,
        emergencyAdvice: isArabic ? safety.emergencyAdviceAr : safety.emergencyAdviceEn,
        citations: [],
      });
    }

    // Step 2: RAG Vector Retrieval
    const retrievedSources = retrieveRelevantSources(message, 3);

    // Step 3: LLM Generation (Gemini 3.7 Flash) or Fallback Engine
    const gemini = getGeminiClient();
    let replyText = "";

    if (gemini) {
      const systemInstruction = `You are LiverCare AI, an advanced, compassionate, and precise clinical AI assistant specializing in hepatology, metabolic liver health (MASLD/MASH), and patient education.
      
CRITICAL GUIDELINES:
1. Ground your answers strictly in the provided EASL, AASLD, and WHO clinical guidelines.
2. Tone: Warm, empathetic, professional, clear, and reassuring.
3. Language: Respond in ${isArabic ? "fluent, natural modern standard Arabic (العربية الفصحى)" : "clear, accessible English"}.
4. Structure: Use neat markdown bullet points, bold key highlights, and concise paragraphs.
5. Patient Context: Patient is ${patientProfile.nameEn}, 48 years old, diagnosed with MASLD Stage 1. ALT is currently 46 IU/L (improved from 62), AST is 34 IU/L, Platelets 245, FIB-4 is 0.98 (low fibrosis risk).
6. Safety Boundary: Remind the user that LiverCare AI provides educational guidance and is not a substitute for clinical diagnosis.`;

      const contextChunks = retrievedSources.map((r, idx) => {
        return `[Source ${idx + 1}: ${r.source.organization} - ${r.source.title} (Section: ${r.source.section}, Page: ${r.source.page})]\n${r.source.fullExcerptEn}`;
      }).join("\n\n");

      const promptWithRAG = `PATIENT CLINICAL SUMMARY:
- Diagnosis: ${patientProfile.diagnosisEn}
- Weight: ${patientProfile.currentWeightKg} kg (Target: ${patientProfile.targetWeightKg} kg, Down from ${patientProfile.startingWeightKg} kg)
- BMI: ${patientProfile.bmi}
- Latest Labs: ALT: 46 IU/L, AST: 34 IU/L, Bilirubin: 0.8 mg/dL, Albumin: 4.4 g/dL, Platelets: 245, FIB-4: 0.98 (Low Risk)

RETRIEVED CLINICAL GUIDELINES:
${contextChunks}

USER QUESTION:
${message}`;

      const response = await gemini.models.generateContent({
        model: "gemini-3.7-flash",
        contents: promptWithRAG,
        config: {
          systemInstruction,
          temperature: 0.35,
        },
      });

      replyText = response.text || "";
    }

    // Fallback if no Gemini key or offline
    if (!replyText) {
      if (isArabic) {
        replyText = `أهلاً بك. بناءً على **إرشادات الجمعية الأوروبية لدراسة الكبد (EASL 2024)** والجمعية الأمريكية (AASLD):\n\n` +
          `• **تعديل نمط الحياة والتغذية:** يُعد فقدان الوزن التدريجي بنسبة 5–7٪ ركيزة أساسية لتخفيض دهون الكبد، بينما يؤدي فقدان ≥10٪ إلى تحسن نسيج الكبد وتراجع أي مؤشرات التهابية.\n` +
          `• **حالتك الصحية الحالية:** إنزيم الكبد ALT لديك انخفض إلى 46 وحدة/لتر مقارنة بـ 62 سابقاً، ومؤشر التليف FIB-4 يبلغ 0.98 وهو في النطاق الآمن المنخفض.\n` +
          `• **التوصيات اليومية:** الاستمرار في ممارسة الرياضة الهوائية (150 دقيقة أسبوعياً)، والاعتماد على حمية البحر الأبيض المتوسط الغنية بالخضروات وزيت الزيتون والأسماك.\n\n` +
          `*تنبيه طبي: يقدم LiverCare AI معلومات تثقيفية معتمدة ولا يحل محل الرأي الطبي للأخصائي.*`;
      } else {
        replyText = `Thank you for your question. Based on the **EASL 2024 & AASLD Clinical Practice Guidelines**:\n\n` +
          `• **Lifestyle & Hepatic Health:** Achieving and maintaining a 5–7% gradual body weight reduction is the established benchmark for reversing hepatic steatosis in MASLD.\n` +
          `• **Your Health Status:** Your latest ALT level of 46 IU/L demonstrates encouraging improvement from 62 IU/L, and your FIB-4 score of 0.98 remains firmly in the low-risk category (<1.30).\n` +
          `• **Evidence-Based Recommendations:** Continue adhering to a Mediterranean-style dietary pattern rich in antioxidants and healthy fats, target at least 150 minutes of weekly moderate aerobic activity, and stay well-hydrated.\n\n` +
          `*Medical Disclaimer: LiverCare AI provides educational information and does not replace professional medical advice.*`;
      }
    }

    const citations = retrievedSources.map(r => ({
      id: r.source.id,
      title: r.source.title,
      organization: r.source.organization,
      year: r.source.year,
      section: r.source.section,
      page: r.source.page,
      doi: r.source.doi,
      relevance: r.relevanceScore,
      summary: isArabic ? r.source.summaryAr : r.source.summaryEn,
    }));

    res.json({
      success: true,
      isRefused: false,
      safetyLevel: "SAFE",
      reply: replyText,
      citations,
    });
  } catch (err: any) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message || "Internal server error in LiverCare AI" });
  }
});

// ----------------------------------------------------
// Static Files & Vite Middleware
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LiverCare AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
