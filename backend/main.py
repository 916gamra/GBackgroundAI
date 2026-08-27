"""
Lightweight CORS-bypass proxy for the GBackgroundAI frontend.

The browser cannot call external APIs (Wikipedia, Serper, generic fetches,
etc.) directly because those endpoints don't send CORS headers. This proxy
forwards the request server-side, where CORS does not apply.

Routes:
  POST /api/web-search        -> Serper Google search
  GET  /api/wiki?query=&lang= -> Wikipedia REST summary
  GET  /api/fetch?url=        -> Generic URL fetch (returns text or json)
  POST /api/validate-key      -> Validate NVIDIA NIM key (no CORS)
  GET  /api/nvidia/models     -> List NVIDIA NIM models (no CORS)

Run with:
  pip install -r requirements.txt
  uvicorn main:app --host 0.0.0.0 --port 8000

Then point the frontend at this origin (see CORS_ORIGIN below).
"""
import os
import json
import logging
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("gbai-proxy")

CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "http://localhost:3000")

app = FastAPI(title="GBackgroundAI Proxy", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NVIDIA_BASE = "https://integrate.api.nvidia.com/v1"
WIKIPEDIA_BASE = "https://{lang}.wikipedia.org/api/rest_v1"
SERPER_URL = "https://google.serper.dev/search"


class WebSearchBody(BaseModel):
    query: str
    serper_key: Optional[str] = None


class ValidateKeyBody(BaseModel):
    api_key: str


async def _safe_get(url: str, headers: dict, timeout: float = 10.0) -> httpx.Response:
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        return await client.get(url, headers=headers)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/web-search")
async def web_search(body: WebSearchBody):
    if not body.serper_key:
        raise HTTPException(status_code=400, detail="serper_key required")
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="query required")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                SERPER_URL,
                headers={"X-API-KEY": body.serper_key, "Content-Type": "application/json"},
                json={"q": body.query, "num": 6},
            )
            r.raise_for_status()
            return r.json()
    except httpx.HTTPError as e:
        log.exception("web_search failed")
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/wiki")
async def wiki(query: str, lang: str = "en"):
    if not query.strip():
        raise HTTPException(status_code=400, detail="query required")
    title = query.strip().replace(" ", "_")
    url = f"{WIKIPEDIA_BASE.format(lang=lang)}/page/summary/{title}"
    try:
        r = await _safe_get(url, headers={"Accept": "application/json"})
        if r.status_code == 404:
            # Fallback to search
            search_url = f"{WIKIPEDIA_BASE.format(lang=lang)}/page/summary/{title}"
            r = await _safe_get(search_url, headers={"Accept": "application/json"})
        if r.status_code >= 400:
            raise HTTPException(status_code=r.status_code, detail=r.text[:500])
        data = r.json()
        return {
            "title": data.get("title"),
            "extract": data.get("extract"),
            "url": data.get("content_urls", {}).get("desktop", {}).get("page"),
        }
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/fetch")
async def fetch_url(url: str):
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="url must be http(s)")
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            r = await client.get(url, headers={"User-Agent": "GBackgroundAI/1.0"})
            content_type = r.headers.get("content-type", "")
            if "text" in content_type or "json" in content_type or "xml" in content_type:
                body = r.text
            else:
                body = f"[Binary content, {len(r.content)} bytes, type={content_type}]"
            return {
                "status": r.status_code,
                "content_type": content_type,
                "final_url": str(r.url),
                "body": body[:200_000],
            }
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.post("/api/validate-key")
async def validate_key(body: ValidateKeyBody):
    key = (body.api_key or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="api_key required")
    if not key.startswith("nvapi-") or len(key) < 20:
        raise HTTPException(status_code=400, detail="Key must start with 'nvapi-' and be at least 20 chars")
    try:
        async with httpx.AsyncClient(timeout=7) as client:
            r = await client.get(
                f"{NVIDIA_BASE}/models",
                headers={"Authorization": f"Bearer {key}", "Accept": "application/json"},
            )
            return {"ok": r.ok, "status": r.status_code}
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/nvidia/models")
async def nvidia_models(api_key: str):
    if not api_key.strip():
        raise HTTPException(status_code=400, detail="api_key required")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{NVIDIA_BASE}/models",
                headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"},
            )
            r.raise_for_status()
            return r.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=True)
