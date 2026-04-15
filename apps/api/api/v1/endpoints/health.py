"""Health check endpoint."""

from fastapi import APIRouter

from schemas.health import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return minimal service health status."""
    return HealthResponse(status="ok")
