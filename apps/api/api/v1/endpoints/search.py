"""Search endpoint (mock)."""

from fastapi import APIRouter, Query

from schemas.search import SearchResponse
from services.search_service import search_service

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResponse)
def search_places(query: str = Query(..., min_length=1, description="Search keyword")) -> SearchResponse:
    """Return mock search result for the given query string."""
    return search_service.search(query=query)
