from logging.config import fileConfig
from sqlmodel import SQLModel
from alembic import context
import os
import sys

# Add parent directory to path to import models
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import models so SQLModel knows about them
from models import Connection

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata

# Overwrite URL from env
url = os.getenv("DATABASE_URL")
if url:
    config.set_main_option("sqlalchemy.url", url)

def run_migrations_offline() -> None:
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    from sqlalchemy import create_engine
    
    # Get URL and fix Postgres dialect name
    connection_url = url or config.get_main_option("sqlalchemy.url")
    if connection_url and connection_url.startswith("postgres://"):
        connection_url = connection_url.replace("postgres://", "postgresql://", 1)
    
    connectable = config.attributes.get("connection", None)
    if connectable is None:
        connectable = create_engine(connection_url)

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
