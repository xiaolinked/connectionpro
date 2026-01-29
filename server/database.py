from sqlmodel import SQLModel, create_engine, Session
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///database.db")

# Handle typical issue where some Postgres providers use 'postgres://' instead of 'postgresql://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    # In production with Alembic, we don't usually run this blindly, 
    # but for local dev with Docker, it's fine for initial setup.
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
