"""Service layer for search endpoints."""

from schemas.search import SearchResponse, SearchResultItem


class SearchService:
    """Search use-case orchestration (mock only in current phase)."""

    def search(self, query: str) -> SearchResponse:
        """Return a mock response without external integrations."""
        return SearchResponse(
            query=query,
            results=[
                SearchResultItem(
                    category="address",
                    title=f"Mock result for '{query}'",
                    reference="MOCK-001",
                )
            ],
        )


search_service = SearchService()
