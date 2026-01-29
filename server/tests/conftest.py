import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

from main import app
from database import get_session
from models import User, Connection, Log
from auth_utils import create_access_token, create_magic_link_token
import uuid
import datetime


@pytest.fixture(name="engine")
def engine_fixture():
    """Create a fresh in-memory SQLite engine for each test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="session")
def session_fixture(engine):
    """Create a new database session for each test."""
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session):
    """Create a FastAPI test client with overridden DB session."""
    def get_session_override():
        yield session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="test_user")
def test_user_fixture(session):
    """Create a test user in the database."""
    user = User(
        id=str(uuid.uuid4()),
        email="test@example.com",
        name="Test User",
        is_active=True,
        created_at=datetime.datetime.utcnow(),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="second_user")
def second_user_fixture(session):
    """Create a second test user for isolation tests."""
    user = User(
        id=str(uuid.uuid4()),
        email="other@example.com",
        name="Other User",
        is_active=True,
        created_at=datetime.datetime.utcnow(),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(test_user):
    """Generate valid auth headers for test_user."""
    token = create_access_token(data={"sub": test_user.id})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="second_auth_headers")
def second_auth_headers_fixture(second_user):
    """Generate valid auth headers for second_user."""
    token = create_access_token(data={"sub": second_user.id})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="test_connection")
def test_connection_fixture(session, test_user):
    """Create a test connection owned by test_user."""
    conn = Connection(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        name="Jane Doe",
        role="Engineer",
        company="Acme Corp",
        location="San Francisco",
        industry="Technology",
        howMet="Conference",
        frequency=30,
        lastContact=datetime.datetime(2024, 1, 15),
        notes="Met at PyCon",
        linkedin="https://linkedin.com/in/janedoe",
        email="jane@acme.com",
        goals="Collaborate on open source",
        tags_json='["work", "python"]',
        created_at=datetime.datetime.utcnow(),
    )
    session.add(conn)
    session.commit()
    session.refresh(conn)
    return conn


@pytest.fixture(name="test_log")
def test_log_fixture(session, test_user, test_connection):
    """Create a test interaction log."""
    log = Log(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        connection_id=test_connection.id,
        type="meeting",
        notes="Had coffee to discuss project",
        tags_json='["catchup"]',
        created_at=datetime.datetime.utcnow(),
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    return log
