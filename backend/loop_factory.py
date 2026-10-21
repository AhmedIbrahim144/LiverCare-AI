"""
Custom uvicorn event-loop factory for Windows.

uvicorn's built-in "asyncio" factory always returns a ProactorEventLoop on
Windows, and that loop permanently stops accepting new connections after a
client disconnects mid-accept (WinError 64): the process stays alive but
http://localhost:8000 stops responding.

The selector loop logs those errors and keeps serving.

Referenced from run_backend.py as: loop="backend.loop_factory:selector_loop_factory"
Uvicorn calls this factory with no arguments and expects a loop instance.
"""

import asyncio
import sys


def selector_loop_factory(*args, **kwargs):
    if sys.platform != "win32":
        return asyncio.SelectorEventLoop()
    try:
        # Real Windows selector loop (_WindowsSelectorEventLoop), which
        # handles accept() errors instead of dying.
        return asyncio.WindowsSelectorEventLoopPolicy().new_event_loop()
    except Exception:
        return asyncio.SelectorEventLoop()
