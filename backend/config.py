"""
Application settings — loaded from environment variables / .env file.
Copy .env.example → .env and fill in your values.
"""
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Ilmu GLM — Anthropic-compatible endpoint
    zai_api_key: str = ""
    zai_base_url: str = "https://api.ilmu.ai/anthropic"
    zai_model: str = "ilmu-glm-5.1"

    # Google Gemini — fallback for chatbot
    gemini_api_key: str = ""

    # Search & Map Integrations
    tavily_api_key: str = ""
    google_maps_api_key: str = ""
    commodity_price_api_key: str = ""

    # Database
    database_url: str = "postgresql+asyncpg://merchantmind:password@localhost:5432/merchantmind"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # CORS — comma-separated origins
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = str(Path(__file__).resolve().parent / ".env")
        extra = "ignore"


settings = Settings()
