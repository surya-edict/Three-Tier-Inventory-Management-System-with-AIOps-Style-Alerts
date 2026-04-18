import os
from pydantic import ConfigDict
from pydantic_settings import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./local_inventory.db")
    model_config = ConfigDict(env_file=".env")

settings = Settings()

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
