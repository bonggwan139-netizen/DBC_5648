"""Response schema for health endpoint."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Simple health response payload."""

    status: str
