import os

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ecm.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "ecm-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 8

settings = Settings()
