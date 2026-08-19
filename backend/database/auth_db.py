"""
SQLAlchemy models for user authentication and chat sessions.
"""
import os
from pathlib import Path
from datetime import datetime

from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session, relationship

_BASE_DIR = Path(__file__).resolve().parent.parent.parent
_DB_PATH = _BASE_DIR / "data" / "store" / "livercare.db"
_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_DB_PATH}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False,
)
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    is_google_user = Column(Boolean, default=False)
    google_sub = Column(String(255), nullable=True)
    otp_code = Column(String(10), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    otp_last_sent_at = Column(DateTime, nullable=True)
    otp_attempts = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "is_verified": self.is_verified,
            "is_google_user": self.is_google_user,
        }


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(255), default="New Chat")
    mode = Column(String(50), default="rag")
    lang = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(100), ForeignKey("chat_sessions.session_id"), nullable=False)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    citations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_auth_db():
    Base.metadata.create_all(bind=engine)


def get_auth_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
