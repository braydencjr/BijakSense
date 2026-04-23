"""Merchant router — stub for merchant CRUD + onboarding."""
from fastapi import APIRouter

router = APIRouter(prefix="/api/merchant", tags=["Merchant"])


@router.get("")
async def list_merchants():
    return []
