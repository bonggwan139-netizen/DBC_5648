"""FastAPI application entrypoint."""

from fastapi import FastAPI

from api.router import api_router
from core.config import settings

app = FastAPI(title=settings.app_name)
app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/", tags=["root"])
def read_root() -> dict[str, str]:
    """Basic root endpoint to confirm service boot."""
    return {"service": settings.app_name, "status": "running"}
