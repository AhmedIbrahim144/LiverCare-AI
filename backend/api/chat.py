"""
Chat endpoint: implements the hybrid RAG + LLM decision logic.

Flow:
  Question → Safety Check → Retrieve → Evaluate Evidence Strength →
  IF strong/moderate: LLM answers from context, show citations
  IF weak/insufficient: LLM answers from general knowledge, no citations
"""

from fastapi import APIRouter, HTTPException

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.database.models import ChatRequest, ChatResponse
from backend.rag.retriever import retrieve, format_retrieved_context
from backend.rag.citations import filter_citations_by_answer, format_citations_text
from backend.ai.safety import check_safety
from backend.ai.llm import generate_answer
from backend.database.database import get_profile

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint with hybrid RAG + LLM logic.
    """
    question = request.question.strip()
    lang = request.lang

    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    # ═══════════════════════════════════════════════════════
    # Step 1: Safety check
    # ═══════════════════════════════════════════════════════
    safety = check_safety(question, lang)
    if not safety["safe"]:
        msg = safety["message_ar"] if lang == "ar" else safety["message_en"]
        return ChatResponse(
            answer=msg,
            citations=[],
            citations_text="",
            retrieved_chunks=[],
            safety_notice=msg,
            confidence="insufficient",
        )

    # ═══════════════════════════════════════════════════════
    # Step 2: Retrieve from ChromaDB
    # ═══════════════════════════════════════════════════════
    results, evidence_strength, top_score = retrieve(
        question, k=request.top_k
    )

    # For Arabic queries, the English embedding model returns lower scores.
    # Use a higher moderate threshold (0.60) for Arabic to avoid false positives.
    if lang != "en" and top_score < 0.60:
        if evidence_strength in ("strong", "moderate"):
            evidence_strength = "weak"

    # ═══════════════════════════════════════════════════════
    # Step 3: Branch based on evidence strength
    # ═══════════════════════════════════════════════════════
    profile = get_profile()
    profile_context = ""
    if profile:
        profile_context = (
            f"\n\nPatient Context (for personalization only, do not diagnose): "
            f"Age: {profile.get('age', 'N/A')}, Sex: {profile.get('sex', 'N/A')}, "
            f"BMI: {profile.get('bmi', 'N/A')}, "
            f"Diabetes: {profile.get('diabetes', 'N/A')}, "
            f"Hypertension: {profile.get('hypertension', 'N/A')}"
        )

    if evidence_strength in ("strong", "moderate"):
        # ═══════════════════════════════════════════════════
        # STRONG/MODERATE EVIDENCE: answer from context + citations
        # ═══════════════════════════════════════════════════
        context_str, raw_citations = format_retrieved_context(results)
        full_context = context_str + profile_context

        try:
            answer = generate_answer(question, full_context, lang, evidence_strength)
        except Exception as e:
            llm_error_msg = (
                f"خطأ في الاتصال بنموذج الذكاء الاصطناعي: {str(e)}"
                if lang == "ar"
                else f"Error connecting to AI model: {str(e)}"
            )
            return ChatResponse(
                answer=llm_error_msg,
                citations=[],
                citations_text="",
                retrieved_chunks=[],
                safety_notice=llm_error_msg,
                confidence="insufficient",
            )

        citations = filter_citations_by_answer(raw_citations, answer, evidence_strength)
        citations_text = format_citations_text(citations, lang)

        # If the LLM indicates it couldn't find specific information, suppress citations
        no_evidence_phrases = [
            "I'm not familiar", "I don't have specific", "not contain specific",
            "I cannot find", "I could not find", "not aware of",
            "don't have enough", "do not have enough",
            "مش متأكد", "مش لاقي", "مفيش معلومات", "مش موجود",
            "مش عارف", "اللي اعرفه", "مقدرش",
        ]
        answer_lower = answer.lower()
        if any(phrase.lower() in answer_lower for phrase in no_evidence_phrases):
            citations = []
            citations_text = ""
            confidence = "low"
        else:
            confidence = "high" if evidence_strength == "strong" else "moderate"

        return ChatResponse(
            answer=answer,
            citations=citations,
            citations_text=citations_text,
            retrieved_chunks=[],
            confidence=confidence,
        )

    else:
        # ═══════════════════════════════════════════════════
        # WEAK/INSUFFICIENT EVIDENCE: answer from general knowledge, no citations
        # ═══════════════════════════════════════════════════
        try:
            answer = generate_answer(question, "", lang, evidence_strength)
        except Exception as e:
            llm_error_msg = (
                f"خطأ في الاتصال بنموذج الذكاء الاصطناعي: {str(e)}"
                if lang == "ar"
                else f"Error connecting to AI model: {str(e)}"
            )
            return ChatResponse(
                answer=llm_error_msg,
                citations=[],
                citations_text="",
                retrieved_chunks=[],
                safety_notice=llm_error_msg,
                confidence="insufficient",
            )

        return ChatResponse(
            answer=answer,
            citations=[],
            citations_text="",
            retrieved_chunks=[],
            confidence="low",
        )
