"""
MerchantMind Backend — FastAPI application entry point.

Routers:
  - /api/merchant        — merchant CRUD + onboarding
  - /api/dashboard       — fast dashboard state (no LLM, <200ms)
  - /api/chat            — A2A conversational interface
  - /api/recommendations — recommendation history + status updates
  - /api/signals         — active signals + internal ingest
"""
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from redis_client import close_redis

# Routers
from routers.merchant import router as merchant_router
from routers.dashboard import router as dashboard_router
from routers.chat import router as chat_router
from routers.recommendations import router as recommendations_router
from routers.signals import router as signals_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("MerchantMind backend starting up...")
    yield
    logger.info("MerchantMind backend shutting down...")
    await close_redis()


app = FastAPI(
    title="MerchantMind API",
    description="AI decision co-pilot for SEA SME merchants. A2A + MCP architecture.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception: %s", exc)
    return JSONResponse(status_code=500, content={"error": "Internal server error", "detail": str(exc)})


@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "service": "merchantmind-backend"}


@app.get("/", tags=["System"])
async def root():
    return {
        "service": "MerchantMind API",
        "version": "1.0.0",
        "docs": "/docs",
        "agents": ["orchestrator", "inventory_planner", "market_analyst", "location_scout", "ops_advisor"],
    }


app.include_router(merchant_router)
app.include_router(dashboard_router)
app.include_router(chat_router)
app.include_router(recommendations_router)
app.include_router(signals_router)
