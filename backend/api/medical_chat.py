"""
Medical AI Chat endpoint using HuggingFace Inference API.
General liver/medical Q&A without RAG, supports Arabic/English/Egyptian Arabic.
Must not diagnose or prescribe.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import re

router = APIRouter(prefix="/api", tags=["medical_chat"])

# Fallback LLM (Gemini / Ollama) used when HuggingFace Inference is unavailable.
from backend.ai.llm import generate_text

HF_TOKEN = os.getenv("HF_TOKEN", "")
HF_MEDICAL_MODEL = os.getenv("HF_MEDICAL_MODEL", "Qwen/Qwen2.5-7B-Instruct")


class MedicalChatRequest(BaseModel):
    question: str
    lang: str = "en"
    history: Optional[list] = []


SYSTEM_PROMPT_EN = """You are a medical information assistant specializing in liver health and general medical topics. You MUST respond in the SAME language the user writes in.

CRITICAL LANGUAGE RULES:
- If user writes in Egyptian Arabic (mixed Arabic/French/English like "عايز", "ازاي", "ايه", "كده", "تمام") → respond in EGYPTIAN ARABIC (عامية مصرية)
- If user writes in standard Arabic (فصحى) → respond in standard Arabic
- If user writes in English → respond in English
- NEVER mix languages in one response
- NEVER respond in Chinese, French, or any other language unless the user writes in it
- NEVER say "I cannot" or "I'm unable" due to language — you MUST respond in the user's language

MEDICAL RULES:
- Provide helpful, accurate general medical information
- NEVER diagnose. NEVER prescribe. NEVER tell patients to change medication
- Always recommend consulting a healthcare professional
- Keep answers concise: 2-4 sentences for simple questions
- If unsure, say so honestly"""

SYSTEM_PROMPT_AR = """أنت مساعد معلومات طبي متخصص في صحة الكبد والمعلومات الطبية العامة. يجب أن ترد بنفس اللغة التي يكتب بها المستخدم.

قواعد اللغة الأهم من أي شيء:
- إذا كتب المستخدم بالعامية المصرية (زي "عايز"، "ازاي"، "ايه"، "كده"، "تمام"، "بتاع") → رد بالعامية المصرية
- إذا كتب بالفصحى → رد بالفصحى
- إذا كتب بالإنجليزي → رد بالإنجليزي
- لا تخلط بين اللغات في رد واحد
- لا ترد بالصيني أو أي لغة أخرى إلا إذا المستخدم كتب بيها
- لا تقل "لا أستطيع" بسبب اللغة — يجب أن ترد بلغة المستخدم

قواعد طبية:
- قدم معلومات طبية عامة مفيدة
- لا تشخص أبداً. لا تصف أدوية أبداً. لا تغير أي علاج
- انصح دائماً باستشارة طبيب
- جاوب باختصار: 2-4 جمل للأسئلة البسيطة"""


def _build_prompt(messages: list) -> str:
    """Build a chat-style prompt from messages list."""
    prompt = ""
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            prompt += f"System: {content}\n\n"
        elif role == "user":
            prompt += f"User: {content}\n\n"
        elif role == "assistant":
            prompt += f"Assistant: {content}\n\n"
    prompt += "Assistant:"
    return prompt


def _call_hf_inference(messages: list, max_tokens: int = 1024) -> str:
    """Call HuggingFace Inference API using huggingface_hub InferenceClient."""
    if not HF_TOKEN:
        raise ValueError("HF_TOKEN not configured")

    from huggingface_hub import InferenceClient

    client = InferenceClient(token=HF_TOKEN)

    try:
        output = client.chat_completion(
            model=HF_MEDICAL_MODEL,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.6,
            top_p=0.9,
        )
        return output.choices[0].message.content
    except Exception as e:
        raise ValueError(str(e))


def _clean_medical_output(text: str) -> str:
    """Clean medical AI output from artifacts."""
    if not text:
        return text
    text = re.sub(r'<\|.*?\|>', '', text)
    text = re.sub(r'^(Assistant|المساعد|الإجابة)[:\s]+', '', text, flags=re.IGNORECASE).strip()
    text = re.sub(r'\n{3,}', '\n\n', text).strip()
    return text


@router.post("/medical-chat")
async def medical_chat(request: MedicalChatRequest):
    question = request.question.strip()
    lang = request.lang

    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    system_prompt = SYSTEM_PROMPT_AR if lang == "ar" else SYSTEM_PROMPT_EN

    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history
    for msg in (request.history or [])[-6:]:
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

    messages.append({"role": "user", "content": question})

    prompt = _build_prompt(messages)

    try:
        # Primary: configured LLM provider (Gemini / Ollama).
        # Fallback: HuggingFace Inference API.
        answer, llm_err = generate_text(prompt, max_tokens=1024)
        if not answer:
            try:
                answer = _call_hf_inference(messages)
            except Exception as hf_err:
                raise ValueError(f"Fallback LLM: {llm_err} | HuggingFace: {hf_err}")
        answer = _clean_medical_output(answer)

        if not answer:
            answer = (
                "عذراً، لم أتمكن من الإجابة على سؤالك في الوقت الحالي. حاول مرة أخرى أو استشر طبيبك."
                if lang == "ar"
                else "Sorry, I couldn't answer your question at the moment. Please try again or consult your doctor."
            )

        return {
            "answer": answer,
            "confidence": "general",
            "notice": "This is general medical information and does not constitute diagnosis or prescription.",
        }
    except ValueError as e:
        error_msg = (
            f"خطأ في الاتصال بنموذج الذكاء الاصطناعي: {str(e)}"
            if lang == "ar"
            else f"Error connecting to AI model: {str(e)}"
        )
        raise HTTPException(status_code=503, detail=error_msg)
    except Exception as e:
        error_msg = (
            f"خطأ غير متوقع: {str(e)}"
            if lang == "ar"
            else f"Unexpected error: {str(e)}"
        )
        raise HTTPException(status_code=500, detail=error_msg)
