"""
Application settings — loaded from environment variables / .env file.
Copy .env.example → .env and fill in your values.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Z.AI (GLM) — OpenAI-compatible
    zai_api_key: str = ""
    zai_base_url: str = "https://open.bigmodel.cn/api/paas/v4/"
    zai_model: str = "glm-4"

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
        env_file = ".env"
        extra = "ignore"


settings = Settings()
