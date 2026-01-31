import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

from main import app
from database import get_session
from models import User, Connection, Log
from models import User, Connection, Log
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
    
    # Disable rate limiter for testing
    if hasattr(app.state, "limiter"):
        app.state.limiter.enabled = False

    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
    
    if hasattr(app.state, "limiter"):
        app.state.limiter.enabled = True


@pytest.fixture(name="test_user")
def test_user_fixture(session):
    """Create a test user in the database."""
    user = User(
        id="test_user_id",
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


@pytest.fixture(name="mock_firebase_auth")
def mock_firebase_auth_fixture(monkeypatch):
    """Mock firebase_auth.verify_firebase_token to return a dummy user."""
    def mock_verify(token):
        if token == "valid_token":
            return {
                "uid": "test_user_id",
                "email": "test@example.com",
                "name": "Test User"
            }
        return None
    
    monkeypatch.setattr("main.verify_firebase_token", mock_verify)


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(test_user, mock_firebase_auth):
    """Generate valid auth headers for test_user using mocked firebase."""
    # Ensure test_user.id matches the mock uid if needed, or update test_user
    # Actually, main.py looks up user by uid from token.
    # So we need test_user.id to match "test_user_id"
    # But test_user fixture creates a random UUID.
    # Let's mock verify to return the test_user.id
    return {"Authorization": "Bearer valid_token"}


@pytest.fixture(name="second_auth_headers")
def second_auth_headers_fixture(second_user, monkeypatch):
    """Generate valid auth headers for second_user."""
    # We need a different token for the second user
    def mock_verify_dynamic(token):
        if token == "valid_token": # Default mock
             return {"uid": "test_user_id", "email": "test@example.com"}
        if token == "second_token":
             return {"uid": second_user.id, "email": second_user.email}
        return None
        
    monkeypatch.setattr("main.verify_firebase_token", mock_verify_dynamic)
    return {"Authorization": "Bearer second_token"}


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
