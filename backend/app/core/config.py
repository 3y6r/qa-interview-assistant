import os
from pathlib import Path


def _read_dotenv_value(name: str) -> str | None:
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.exists():
        return None
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key.strip() == name:
            return value.strip().strip('"').strip("'")
    return None


class Settings:
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY") or _read_dotenv_value("GEMINI_API_KEY")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    gemini_timeout_seconds: int = int(os.getenv("GEMINI_TIMEOUT_SECONDS", "60"))


settings = Settings()
