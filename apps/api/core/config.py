"""Application configuration for API service."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings loaded from environment variables."""

    app_name: str = "Urban Planning Analysis API"
    api_prefix: str = "/api/v1"

    model_config = SettingsConfigDict(env_prefix="UPA_", extra="ignore")


settings = Settings()
