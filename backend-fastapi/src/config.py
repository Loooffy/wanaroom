import os
from pydantic import PostgresDsn, AnyHttpUrl
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

current_env = os.getenv('ENVIRONMENT', 'dev')
env_file = f".env.{current_env}"

class Settings(BaseSettings):

    DATABASE_URL: PostgresDsn
    SECRET_KEY: str  # JWT signing key - use strong random string in production
    ALGORITHM: str = "HS256"
    APP_TITLE: str = "Wanaroom API (Dev)"
    ENVIRONMENT: str = "dev"
    PROD_SERVER_URL: Optional[AnyHttpUrl] = None

    _env = os.getenv("ENVIRONMENT", "dev")

    model_config = SettingsConfigDict(
        env_file=(
            f".env.{_env}",
            ".env.secrets"
        ),
        env_file_encoding="utf-8"
    )

    @property
    def fast_api_servers(self) -> list[dict[str, str]]:
        servers = [{"url": "http://localhost:8000", "description": "Development"}]
        
        if self.ENVIRONMENT == "prod" and self.PROD_SERVER_URL:
            # 插入到最前面
            servers.insert(0, {
                "url": str(self.PROD_SERVER_URL), 
                "description": "Production"
            })
        return servers
    

settings = Settings()
