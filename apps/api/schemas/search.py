"""Schemas for search endpoints."""

from pydantic import BaseModel


class SearchResultItem(BaseModel):
    """Single search item for future expansion."""

    category: str
    title: str
    reference: str


class SearchResponse(BaseModel):
    """Mock search response."""

    query: str
    results: list[SearchResultItem]
