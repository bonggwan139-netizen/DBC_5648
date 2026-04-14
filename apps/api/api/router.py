"""Top-level API router composition."""

from fastapi import APIRouter

from api.v1.endpoints.health import router as health_router
from api.v1.endpoints.search import router as search_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(search_router)
