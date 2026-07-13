"""
Database setup using SQLAlchemy.
Uses SQLite for easy local development/demo.
Swap SQLALCHEMY_DATABASE_URL to a Postgres URL for production:
  postgresql://user:password@localhost:5432/mass_comm_db
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./mass_comm_platform.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
