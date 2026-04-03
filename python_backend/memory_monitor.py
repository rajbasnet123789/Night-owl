"""
Memory monitoring middleware for FastAPI backend.
Logs memory usage and prevents OOM crashes.
"""
import os
import gc
import psutil
from typing import Callable
from fastapi import Request
import time

process = psutil.Process(os.getpid())
last_logged = {"time": 0}

def get_memory_mb() -> float:
    """Get current process memory in MB"""
    try:
        return process.memory_info().rss / 1024 / 1024
    except Exception:
        return 0.0

def log_memory_if_needed(threshold_mb: int = 400) -> None:
    """Log and GC if memory usage is high"""
    now = time.time()
    # Only log every 10 seconds to avoid spam
    if now - last_logged["time"] < 10:
        return
    
    last_logged["time"] = now
    mem_mb = get_memory_mb()
    
    if mem_mb > threshold_mb:
        print(f"[MEMORY] {mem_mb:.0f}MB used (threshold: {threshold_mb}MB)")
        
        if mem_mb > 800:
            print("[MEMORY] Running garbage collection...")
            gc.collect()
            new_mem = get_memory_mb()
            print(f"[MEMORY] After GC: {new_mem:.0f}MB (freed {mem_mb - new_mem:.0f}MB)")

def create_memory_monitor_middleware(app_instance):
    """Create and attach memory monitoring middleware"""
    @app_instance.middleware("http")
    async def memory_middleware(request: Request, call_next: Callable):
        log_memory_if_needed()
        response = await call_next(request)
        log_memory_if_needed(300)  # Lighter check after request
        return response
    
    return app_instance
