from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass


def ensure_user_language_preference_column() -> None:
    if engine.dialect.name != "sqlite":
        return

    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    if "language_preference" in columns:
        return

    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE users ADD COLUMN language_preference VARCHAR NOT NULL DEFAULT 'en'")
        )

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
