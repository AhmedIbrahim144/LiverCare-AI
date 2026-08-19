"""
LiverCare AI - Main FastAPI Application
Entry point: registers all routers, CORS, static files, and health endpoints.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.api.chat import router as chat_router
from backend.api.profile import router as profile_router
from backend.api.tracking import router as tracking_router
from backend.api.auth import router as auth_router
from backend.api.medical_chat import router as medical_chat_router
from backend.api.lab_analyzer import router as lab_analyzer_router
from backend.api.voice import router as voice_router
from backend.config import BASE_DIR

app = FastAPI(title="LiverCare AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(chat_router)
app.include_router(profile_router)
app.include_router(tracking_router)
app.include_router(auth_router)
app.include_router(medical_chat_router)
app.include_router(lab_analyzer_router)
app.include_router(voice_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "LiverCare AI", "version": "2.0.0"}


@app.post("/api/rebuild-index")
async def rebuild_index():
    from backend.rag.ingest import run_ingestion
    stats = run_ingestion()
    return {"status": "ok", "stats": stats}


# Serve frontend files
frontend_dir = BASE_DIR / "frontend"

app.mount("/assets", StaticFiles(directory=str(frontend_dir / "assets")), name="assets")
app.mount("/frontend", StaticFiles(directory=str(frontend_dir)), name="frontend_static")


@app.get("/")
async def serve_index():
    return FileResponse(str(frontend_dir / "index.html"))


@app.get("/styles.css")
async def serve_css():
    return FileResponse(str(frontend_dir / "styles.css"), media_type="text/css")


@app.get("/app.js")
async def serve_js():
    return FileResponse(str(frontend_dir / "app.js"), media_type="application/javascript")
