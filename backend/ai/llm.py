"""
LLM module: generates answers using Ollama (qwen3:8b).
Supports two modes: RAG-grounded and general knowledge.
Optimized for Qwen3 with thinking mode disabled and proper output cleaning.
"""

import sys
import re
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config

import requests
from .prompts import (
    SYSTEM_PROMPT_RAG_EN, SYSTEM_PROMPT_GENERAL_EN,
    SYSTEM_PROMPT_RAG_AR, SYSTEM_PROMPT_GENERAL_AR,
)


def _call_ollama(prompt, max_tokens=1024):
    """Call Ollama API and return response text or error."""
    try:
        url = f"{config.OLLAMA_BASE_URL}/api/generate"
        payload = {
            "model": config.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.6,
                "top_p": 0.9,
                "top_k": 40,
                "num_predict": max_tokens,
                "repeat_penalty": 1.1,
                "num_ctx": 4096,
            },
        }
        response = requests.post(url, json=payload, timeout=180)
        response.raise_for_status()
        data = response.json()
        return data.get("response", ""), None
    except Exception as e:
        return None, str(e)


def _clean_output(text, lang="en"):
    """Clean LLM output from Qwen3 thinking tags, prompt leakage, and artifacts."""
    if not text:
        return text

    # Remove Qwen3 thinking tags and their content
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    text = text.strip()

    # Remove "Answer:" or "الإجابة:" prefixes
    text = re.sub(r'^(الإجابة|Answer|المجابة|الرد)[:\s：]+', '', text, flags=re.IGNORECASE).strip()

    # Remove self-introduction lines
    preamble_keywords = [
        'LiverCare AI', 'مساعد ذكي شخصي', 'مساعد ذكي',
        'I am LiverCare AI', 'I am a personal AI', 'personal AI assistant',
    ]
    lines = text.split('\n')
    cleaned_lines = []
    skip_preamble = True
    for line in lines:
        if skip_preamble:
            stripped = line.strip()
            if any(kw in stripped for kw in preamble_keywords):
                continue
            skip_preamble = False
        cleaned_lines.append(line)
    text = '\n'.join(cleaned_lines).strip()

    # Remove artifact prefixes
    artifact_prefixes = [
        r'^(الأسطورة|الحقيقة|الإجابة الصحيحة|النص الأصلي|الإجابة|السياق)[:\s]+',
        r'^(Myth|Fact|The correct answer|The original text|The answer|The context)[:\s]+',
    ]
    for prefix_pattern in artifact_prefixes:
        text = re.sub(prefix_pattern, '', text, flags=re.IGNORECASE).strip()

    # Remove safety notes at the end
    text = re.sub(
        r'\n*\s*(ملاحظة سلامة|ملاحظة|Safety note|ملحوظة|تنبيه)[:\s].*$',
        '', text, flags=re.IGNORECASE | re.DOTALL,
    ).strip()

    # Remove leaked context headers
    text = re.sub(r'\[Source \d+.*?\]', '', text).strip()
    text = re.sub(r'\(Relevance:\s*[\d.]+\)', '', text).strip()

    # Remove prompt-leak phrases
    leak_phrases = [
        'وفقاً للقواعد', 'بناءً على التعليمات', 'وفقاً للتعليمات', 'بناءً على القواعد',
        'according to the rules', 'based on the instructions', 'as per the rules',
        'السياق المقدم', 'المعلومات المقدمة', 'الأدلة المقدمة', 'the provided context',
        'قبل الإجابة', 'أريد أن أؤكد',
    ]
    for phrase in leak_phrases:
        text = re.sub(re.escape(phrase), '', text, flags=re.IGNORECASE).strip()

    # Clean up excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text).strip()
    return text


def generate_answer(question, context, lang="en", evidence_strength="strong"):
    """
    Generate answer using Ollama (qwen3:8b).
    evidence_strength determines which prompt template to use:
      - "strong" / "moderate": RAG-grounded prompt (uses retrieved context)
      - "weak" / "insufficient": general knowledge prompt (no context)
    """
    if evidence_strength in ("strong", "moderate"):
        if lang == "ar":
            system_prompt = SYSTEM_PROMPT_RAG_AR
        else:
            system_prompt = SYSTEM_PROMPT_RAG_EN
        full_prompt = system_prompt.format(context=context, question=question)
    else:
        if lang == "ar":
            system_prompt = SYSTEM_PROMPT_GENERAL_AR
        else:
            system_prompt = SYSTEM_PROMPT_GENERAL_EN
        full_prompt = system_prompt.format(question=question)

    text, err = _call_ollama(full_prompt, max_tokens=1024)
    if text:
        return _clean_output(text, lang)

    print(f"ERROR: Ollama generation failed: {err}")
    return _fallback_answer(context, lang)


def _fallback_answer(context, lang="en"):
    """Fallback answer when LLM is unavailable."""
    if not context:
        if lang == "ar":
            return (
                "المصادر الطبية المتوفرة مش كفاية عشان نجاوب على السؤال ده بشكل موثوق. "
                "تواصل مع طبيبك عشان تحصل على معلومات مخصصة لحالتك."
            )
        return (
            "The available medical sources do not contain enough information "
            "to answer this question reliably. "
            "Please consult your healthcare professional for personalized information."
        )

    if lang == "ar":
        return (
            "بناءً على المعلومات الطبية المتوفرة:\n\n"
            f"{context}\n\n"
            "تواصل مع طبيبك عشان يقيّم حالتك الشخصية."
        )
    return (
        "Based on the available medical evidence:\n\n"
        f"{context}\n\n"
        "Please consult your healthcare professional for personal evaluation."
    )
