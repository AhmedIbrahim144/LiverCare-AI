"""
LiverCare AI - Backend launcher.

Starts the FastAPI app (backend.main:app) on the Windows *selector* event
loop, because uvicorn's default proactor loop stops accepting connections
after any client disconnects mid-request (WinError 64).

Usage:
    python run_backend.py [host] [port]
    python run_backend.py 0.0.0.0 8000
"""

import sys

import uvicorn

if __name__ == "__main__":
    host = sys.argv[1] if len(sys.argv) > 1 else "0.0.0.0"
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8000
    uvicorn.run(
        "backend.main:app",
        host=host,
        port=port,
        loop="backend.loop_factory:selector_loop_factory",
        log_level="info",
    )
