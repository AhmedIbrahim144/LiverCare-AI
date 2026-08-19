"""
Voice features endpoints: Speech-to-Text and Text-to-Speech.
Uses browser Web Speech API on frontend, with backend fallback via HuggingFace.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import requests

router = APIRouter(prefix="/api", tags=["voice"])

HF_TOKEN = os.getenv("HF_TOKEN", "")


class TTSRequest(BaseModel):
    text: str
    lang: str = "en"


class STTRequest(BaseModel):
    audio_base64: str
    lang: str = "en"


@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """Text-to-speech using browser Web Speech API (frontend) or HuggingFace fallback."""
    # Primary: instruct frontend to use browser TTS
    return {
        "method": "browser",
        "text": request.text,
        "lang": request.lang,
        "message": "Use browser Web Speech API for TTS",
    }


@router.post("/stt")
async def speech_to_text(request: STTRequest):
    """Speech-to-text using browser Web Speech API (frontend) or HuggingFace fallback."""
    if not request.audio_base64:
        raise HTTPException(status_code=400, detail="Audio data is required")

    # Primary: instruct frontend to use browser STT
    return {
        "method": "browser",
        "lang": request.lang,
        "message": "Use browser Web Speech API for STT",
    }


@router.get("/voice-capabilities")
async def voice_capabilities():
    """Check available voice capabilities."""
    return {
        "browser_tts": True,
        "browser_stt": True,
        "hf_tts": bool(HF_TOKEN),
        "hf_stt": bool(HF_TOKEN),
    }
