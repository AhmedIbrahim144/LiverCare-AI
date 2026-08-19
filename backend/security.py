"""
Security module: JWT tokens, bcrypt password hashing, OTP generation.
Adapted from colleague project for FastAPI.
"""
import time
import json
import base64
import hmac
import hashlib
import secrets
import os
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

import bcrypt

JWT_SECRET = os.getenv("JWT_SECRET", "")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is required. Set it in your .env file.")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_SECONDS = int(os.getenv("JWT_EXPIRATION_SECONDS", "604800"))
OTP_EXPIRY_SECONDS = 600
OTP_RESEND_COOLDOWN_SECONDS = 20


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64_decode(s: str) -> bytes:
    rem = len(s) % 4
    if rem > 0:
        s += "=" * (4 - rem)
    return base64.urlsafe_b64decode(s.encode("utf-8"))


def create_access_token(payload: Dict[str, Any], expires_in: int = JWT_EXPIRATION_SECONDS) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    token_payload = {**payload, "iat": now, "exp": now + expires_in}

    header_b64 = _b64_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64_encode(json.dumps(token_payload, separators=(",", ":")).encode("utf-8"))

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = _b64_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    if not token or token.count(".") != 2:
        return None
    try:
        header_b64, payload_b64, sig_b64 = token.split(".")
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()

        if not hmac.compare_digest(_b64_decode(sig_b64), expected_sig):
            return None

        payload = json.loads(_b64_decode(payload_b64).decode("utf-8"))
        now = int(time.time())
        if payload.get("exp") and payload["exp"] < now:
            return None

        return payload
    except Exception:
        return None


def generate_otp(length: int = 6) -> str:
    code = secrets.randbelow(10 ** length)
    return str(code).zfill(length)
