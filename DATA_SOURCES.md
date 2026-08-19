# DATA_SOURCES.md

## LiverCare AI - Data Source Inventory

### Source Location

`C:\Users\MSI2\Desktop\LIVER` (READ-ONLY)

### Copied To

`D:\LiverCare-AI\data\raw\`

---

## Processed Documents (12 files)

| # | Filename | Pages | Topic | Relevance | Notes |
|---|----------|-------|-------|-----------|-------|
| 1 | aasld-practice-guidance-on-the-clinical-assessment-and.pdf | 39 | AASLD Practice Guidance on clinical assessment of MASLD | High | Main fatty liver clinical guidance |
| 2 | EASL-EASD-EASO-Clinical-Practice-Guidelines-on-the.pdf | 51 | EASL/EASD/EASO Clinical Practice Guidelines on MASLD | High | European fatty liver guidelines |
| 3 | Sex-specific-associations-of-steatotic-liver-disea.pdf | 3 | Sex-specific associations of steatotic liver disease | High | Fatty liver and sex differences |
| 4 | EMC10-modulates-hepatic-ER-stress-and-steatosis-in.pdf | 14 | EMC10 modulates hepatic ER stress and steatosis | High | NAFLD research |
| 5 | Individuals-with-cardiometabolic-risk-factors-are-.pdf | 3 | Cardiometabolic risk factors and fatty liver | High | Metabolic risk and fatty liver |
| 6 | Genetic-risk-accentuates-dietary-effects-on-hepati.pdf | 11 | Genetic risk and dietary effects on hepatic steatosis | Medium | Genetics and diet in NAFLD |
| 7 | FGF21-agonists--An-emerging-therapeutic-for-metabo.pdf | 15 | FGF21 agonists as emerging therapy for metabolic diseases | Medium | Emerging NAFLD therapy |
| 8 | A-closer-look-at-the-innovative-PAGED-B-score_2024.pdf | 2 | PAGED-B score for liver assessment | Medium | Liver scoring systems |
| 9 | An-overweight-female-with-a-history-of-allergies-a.pdf | 3 | Case study: overweight female with allergies | Medium | Case study (metabolic) |
| 10 | Prospective-validation-of-the-EASL-management-algo.pdf | 11 | EASL management algorithm validation | Medium | Clinical validation |
| 11 | nihms-1948413.pdf | 76 | NIH manuscript on MASLD management | Medium | Comprehensive MASLD review |
| 12 | Primary-hypobetalipoproteinemia-as-a-risk-factor-f.pdf | 1 | Hypobetalipoproteinemia as risk factor | Low | Rare lipid disorder |

---

## Ignored Documents (28 files from source)

| Category | Files | Reason |
|----------|-------|--------|
| Viral hepatitis | B-cell-characteristics-define-HCV-reinfection-outc.pdf, Changes-of-hepatic-myeloid-cells-in-chronic-viral-.pdf, JNJ-73763989-and-bersacapavir-treatment-in-nucleos.pdf | Not directly related to fatty liver |
| Liver transplantation | Application-of-digital-pathology-in-liver-transpla.pdf, Transplant-benefit-based-offering-of-deceased-dono.pdf, Tailoring-allocation-policies-and-improving-access.pdf | Not within fatty liver scope |
| Liver cancer | Hepatocellular-carcinoma-in-patients-with-autoimmu.pdf, Improving-HCC-surveillance-with-abbreviated-MRI--A.pdf | Cancer focus not within scope |
| Journal metadata | Contents_jhepat.pdf, Editorial-Board_jhepat.pdf, JHEP-at-a-glance-(September-2024)_jhepat.pdf, JGH3-7-231.pdf | Journal administrative files |
| Correspondence/Replies | Correspondence-on-"Incidence-and-predictors-of-hep.pdf, Reply-to--"Application-of-digital-pathology-in-liv.pdf, Reply-to--"Association-between-antiviral-treatment.pdf, Reply-to--"Post-TIPS-OHE--Are-we-really-making-a-m.pdf, Reply-to--"Tailoring-allocation-policies-and-impro.pdf | Correspondence, not primary sources |
| Editorial/Other | From-the-Editor's-Desk..._jhepat.pdf, Colonel-Stephen-A.-Harrison,-M.D.-–-The-passing-of.pdf | Editorials, obituary |
| Antiviral treatment | Association-between-antiviral-treatments-and-fract.pdf | Hepatitis treatment, not fatty liver |
| Other liver topics | Angiocrine-signaling-in-sinusoidal-homeostasis-and.pdf, cp-2013-2-e17.pdf, crg-0006-0538.pdf, Expanding-the-dialogue--A-closer-look-at-AIH-manag.pdf, Hepatic-phenotypes-of-EFL1-related-Shwachman-Diamo.pdf, Normothermic-perfusion-of-a-human-tumoral-liver-fo.pdf, Post-TIPS-OHE--Are-we-really-making-a-mountain-out.pdf, The-liver-in-haematologic-oncologic-disorders_2024.pdf | Not directly relevant to fatty liver |

---

## Ingestion Statistics

- **Documents processed**: 12
- **Pages processed**: 229
- **Chunks created**: 890
- **Embedding model**: BAAI/bge-small-en-v1.5 (local, free)
- **Vector database**: ChromaDB
- **Collection name**: livercare_medical_kb
- **Chunk size**: 1600 characters
- **Chunk overlap**: 200 characters

## License/Usage Notes

- Most documents appear to be published journal articles or clinical guidelines
- AASLD and EASL guidelines are published for clinical use
- License/usage terms for individual papers require verification
- No copyright infringement intended - this is a research prototype
