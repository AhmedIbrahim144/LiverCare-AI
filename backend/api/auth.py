"""
Authentication routes: register, login, verify-otp, Google sign-in, profile.
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from backend.security import (
    hash_password, verify_password, create_access_token,
    decode_access_token, generate_otp,
    OTP_EXPIRY_SECONDS, OTP_RESEND_COOLDOWN_SECONDS,
)
from backend.database.auth_db import SessionLocal, User, init_auth_db
from backend.email_service import send_otp_email

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Ensure tables exist on import
init_auth_db()


def _get_user_from_request(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        return None
    db = SessionLocal()
    try:
        return db.query(User).filter(User.id == payload.get("sub")).first()
    finally:
        db.close()


@router.post("/register")
async def register(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    full_name = body.get("full_name", "").strip()
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not full_name:
        raise HTTPException(status_code=400, detail="Full name is required")
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    if not password or len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing and existing.is_verified:
            raise HTTPException(status_code=409, detail="Email already registered. Please login.")

        otp_code = generate_otp(6)
        now_dt = datetime.utcnow()
        expires_dt = now_dt + timedelta(seconds=OTP_EXPIRY_SECONDS)
        pwd_hash = hash_password(password)

        if existing:
            existing.full_name = full_name
            existing.password_hash = pwd_hash
            existing.otp_code = otp_code
            existing.otp_expires_at = expires_dt
            existing.otp_last_sent_at = now_dt
            existing.otp_attempts = 0
            user_obj = existing
        else:
            user_obj = User(
                full_name=full_name,
                email=email,
                password_hash=pwd_hash,
                is_verified=False,
                otp_code=otp_code,
                otp_expires_at=expires_dt,
                otp_last_sent_at=now_dt,
                otp_attempts=0,
            )
            db.add(user_obj)

        db.commit()
        db.refresh(user_obj)
        send_otp_email(email, full_name, otp_code)

        return {
            "status": "pending_verification",
            "message": "Verification code sent to your email",
            "email": email,
            "resend_cooldown": OTP_RESEND_COOLDOWN_SECONDS,
        }
    finally:
        db.close()


@router.post("/verify-otp")
async def verify_otp(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    email = body.get("email", "").strip().lower()
    otp_code = body.get("otp_code", "").strip()

    if not email or not otp_code:
        raise HTTPException(status_code=400, detail="Email and OTP code are required")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Account not found")

        if user.is_verified:
            token = create_access_token({"sub": user.id, "email": user.email})
            return {"status": "success", "token": token, "user": user.to_dict()}

        if not user.otp_code or user.otp_code != otp_code:
            raise HTTPException(status_code=400, detail="Invalid verification code")

        if user.otp_expires_at and datetime.utcnow() > user.otp_expires_at:
            raise HTTPException(status_code=400, detail="Verification code expired. Please request a new one.")

        user.is_verified = True
        user.otp_code = None
        user.otp_expires_at = None
        db.commit()
        db.refresh(user)

        token = create_access_token({"sub": user.id, "email": user.email})
        return {"status": "success", "message": "Account verified successfully", "token": token, "user": user.to_dict()}
    finally:
        db.close()


@router.post("/resend-otp")
async def resend_otp(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    email = body.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Account not found")
        if user.is_verified:
            raise HTTPException(status_code=400, detail="Account is already verified")

        now_dt = datetime.utcnow()
        if user.otp_last_sent_at:
            elapsed = (now_dt - user.otp_last_sent_at).total_seconds()
            if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
                remaining = int(OTP_RESEND_COOLDOWN_SECONDS - elapsed)
                return JSONResponse(
                    status_code=429,
                    content={"error": f"Please wait {remaining} seconds before resending", "remaining_seconds": remaining},
                )

        new_otp = generate_otp(6)
        user.otp_code = new_otp
        user.otp_expires_at = now_dt + timedelta(seconds=OTP_EXPIRY_SECONDS)
        user.otp_last_sent_at = now_dt
        db.commit()
        send_otp_email(user.email, user.full_name, new_otp)

        return {"status": "success", "message": "Verification code resent", "resend_cooldown": OTP_RESEND_COOLDOWN_SECONDS}
    finally:
        db.close()


@router.post("/login")
async def login(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or not user.password_hash:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not user.is_verified:
            return JSONResponse(
                status_code=403,
                content={
                    "error": "Account not verified. Please check your email.",
                    "code": "NOT_VERIFIED",
                    "email": user.email,
                    "resend_cooldown": OTP_RESEND_COOLDOWN_SECONDS,
                },
            )

        token = create_access_token({"sub": user.id, "email": user.email})
        return {"status": "success", "message": "Login successful", "token": token, "user": user.to_dict()}
    finally:
        db.close()


@router.post("/google")
async def google_auth(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    email = body.get("email", "").strip().lower()
    name = body.get("name", "").strip() or "Google User"
    google_sub = body.get("sub", "").strip() or body.get("id", "").strip()

    if not email:
        raise HTTPException(status_code=400, detail="Google email is required")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                full_name=name,
                email=email,
                is_verified=True,
                is_google_user=True,
                google_sub=google_sub or email,
                password_hash=None,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        token = create_access_token({"sub": user.id, "email": user.email})
        return {"status": "success", "token": token, "user": user.to_dict()}
    finally:
        db.close()


@router.get("/me")
async def get_me(request: Request):
    user = _get_user_from_request(request)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized or token expired")
    return {"user": user.to_dict()}
