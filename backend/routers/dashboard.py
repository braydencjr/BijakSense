"""Dashboard router — stub for fast dashboard state."""
from fastapi import APIRouter

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("")
async def get_dashboard():
    return {"status": "ok"}
