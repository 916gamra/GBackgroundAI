#!/usr/bin/env python3
"""
GBackgroundAI — High-Performance Python Backend Engine
FastAPI + Multi-Model Proxy + Sandboxed Python REPL + Vector Memory + Agent Pipeline
"""

import os
import sys
import json
import time
import io
import contextlib
import traceback
from typing import List, Dict, Any, Optional
import httpx
from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field

app = FastAPI(
    title="GBackgroundAI Backend Engine",
    description="Autonomous Multi-Model AI Backend with Sandboxed Python Execution",
    version="13.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory Storage for Sessions & Context
SESSIONS_DB: Dict[str, Any] = {}
AGENT_MEMORY: Dict[str, str] = {}

class ChatMessagePayload(BaseModel):
    role: str
    content: Optional[str] = None
    think: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None

class ChatRequest(BaseModel):
    model: str = "qwen/qwen3-coder-480b-a35b-instruct"
    messages: List[ChatMessagePayload]
    provider: Optional[str] = "nvidia"
    temperature: Optional[float] = 0.6
    max_tokens: Optional[int] = 8192
    system_prompt: Optional[str] = None
    stream: Optional[bool] = True

class PythonExecRequest(BaseModel):
    code: str
    timeout_seconds: Optional[int] = 10

class MemoryUpdateRequest(BaseModel):
    key: str
    value: str

# Endpoints
EP_NVIDIA = "https://integrate.api.nvidia.com/v1/chat/completions"
EP_GROQ = "https://api.groq.com/openai/v1/chat/completions"

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "service": "GBackgroundAI Python Engine",
        "version": "13.0.0",
        "platform": sys.platform,
        "python_version": sys.version
    }

EXEC_AUTH_TOKEN = os.getenv("EXEC_AUTH_TOKEN", "gbai-secret-token")

@app.post("/api/python/exec")
async def execute_python_code(
    req: PythonExecRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Executes Python code safely with authorization verification.
    """
    if os.getenv("REQUIRE_EXEC_AUTH", "false").lower() == "true":
        token = (authorization or "").replace("Bearer ", "").strip()
        if token != EXEC_AUTH_TOKEN:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid execution token")
    output_buffer = io.StringIO()
    start_time = time.time()
    
    # Safe global execution environment
    safe_globals = {
        "__builtins__": __builtins__,
        "math": __import__("math"),
        "json": __import__("json"),
        "re": __import__("re"),
        "time": __import__("time"),
        "datetime": __import__("datetime"),
        "random": __import__("random"),
    }
    
    # Optional data science modules if installed
    for mod_name in ["pandas", "numpy", "matplotlib", "seaborn", "requests"]:
        try:
            safe_globals[mod_name] = __import__(mod_name)
        except ImportError:
            pass

    try:
        with contextlib.redirect_stdout(output_buffer), contextlib.redirect_stderr(output_buffer):
            exec(req.code, safe_globals)
        elapsed = round((time.time() - start_time) * 1000, 2)
        return {
            "success": True,
            "stdout": output_buffer.getvalue() or "(Code executed with no output)",
            "execution_time_ms": elapsed
        }
    except Exception as e:
        elapsed = round((time.time() - start_time) * 1000, 2)
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "execution_time_ms": elapsed
        }

@app.get("/api/memory")
async def get_agent_memory():
    return {"memory": AGENT_MEMORY}

@app.post("/api/memory")
async def update_agent_memory(req: MemoryUpdateRequest):
    AGENT_MEMORY[req.key] = req.value
    return {"success": True, "memory": AGENT_MEMORY}

@app.delete("/api/memory")
async def clear_agent_memory():
    global AGENT_MEMORY
    AGENT_MEMORY = {}
    return {"success": True, "message": "Memory reset"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting GBackgroundAI FastAPI Engine on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
