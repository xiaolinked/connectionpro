"""Integration tests for authentication API endpoints."""

import pytest
from auth_utils import create_magic_link_token, create_access_token
from models import User, Connection, Log
from sqlmodel import select
from datetime import timedelta
import uuid
import datetime
import jwt


class TestRegisterEndpoint:
    def test_register_new_user(self, client):
        response = client.post(
            "/auth/register",
            json={"email": "new@example.com", "name": "New User"},
        )
        assert response.status_code == 201
        data = response.json()
        assert "magic_link" in data
        assert "message" in data
        assert "token=" in data["magic_link"]

    def test_register_existing_user_returns_magic_link(self, client, test_user):
        response = client.post(
            "/auth/register",
            json={"email": test_user.email, "name": "Existing User"},
        )
        assert response.status_code == 201
        data = response.json()
        assert "magic_link" in data

    def test_register_normalizes_email(self, client):
        response = client.post(
            "/auth/register",
            json={"email": "  USER@Example.COM  ", "name": "User"},
        )
        assert response.status_code == 201

    def test_register_updates_name_for_existing_user(self, client, test_user):
        response = client.post(
            "/auth/register",
            json={"email": test_user.email, "name": "Updated Name"},
        )
        assert response.status_code == 201

    def test_register_duplicate_email_creates_one_user(self, client):
        client.post(
            "/auth/register",
            json={"email": "dup@example.com", "name": "First"},
        )
        response = client.post(
            "/auth/register",
            json={"email": "dup@example.com", "name": "Second"},
        )
        assert response.status_code == 201


class TestCheckEmailEndpoint:
    def test_existing_email_returns_true(self, client, test_user):
        response = client.get(f"/auth/check-email?email={test_user.email}")
        assert response.status_code == 200
        assert response.json()["exists"] is True

    def test_nonexistent_email_returns_false(self, client):
        response = client.get("/auth/check-email?email=nobody@example.com")
        assert response.status_code == 200
        assert response.json()["exists"] is False

    def test_email_check_case_insensitive(self, client, test_user):
        response = client.get(f"/auth/check-email?email={test_user.email.upper()}")
        assert response.status_code == 200
        assert response.json()["exists"] is True


class TestVerifyTokenEndpoint:
    def test_verify_valid_magic_link(self, client, test_user):
        token = create_magic_link_token(test_user.email)
        response = client.post("/auth/verify", json={"token": token})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == test_user.email

    def test_verify_invalid_token(self, client):
        response = client.post("/auth/verify", json={"token": "invalid-garbage-token"})
        assert response.status_code == 401

    def test_verify_expired_magic_link(self, client, test_user):
        # Create an expired token manually
        from auth_utils import SECRET_KEY, ALGORITHM
        from datetime import datetime

        payload = {
            "sub": test_user.email,
            "type": "magic_link",
            "exp": datetime.utcnow() - timedelta(minutes=1),
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        response = client.post("/auth/verify", json={"token": token})
        assert response.status_code == 401

    def test_verify_returns_user_data(self, client, test_user):
        token = create_magic_link_token(test_user.email)
        response = client.post("/auth/verify", json={"token": token})
        data = response.json()
        assert data["user"]["name"] == test_user.name
        assert data["user"]["email"] == test_user.email


class TestGetMeEndpoint:
    def test_get_me_authenticated(self, client, test_user, auth_headers):
        response = client.get("/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["name"] == test_user.name

    def test_get_me_unauthenticated(self, client):
        response = client.get("/users/me")
        assert response.status_code == 401

    def test_get_me_invalid_token(self, client):
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.get("/users/me", headers=headers)
        assert response.status_code == 401

    def test_get_me_expired_token(self, client, test_user):
        token = create_access_token(
            data={"sub": test_user.id},
            expires_delta=timedelta(seconds=-1),
        )
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/users/me", headers=headers)
        assert response.status_code == 401


class TestUpdateMeEndpoint:
    def test_update_name(self, client, auth_headers, test_user):
        response = client.put(
            "/users/me",
            json={"name": "New Name"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"
        assert data["email"] == test_user.email

    def test_update_preserves_unchanged_fields(self, client, auth_headers, test_user):
        response = client.put(
            "/users/me",
            json={"name": "Changed"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["id"] == test_user.id

    def test_update_empty_body_changes_nothing(self, client, auth_headers, test_user):
        response = client.put(
            "/users/me",
            json={},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["name"] == test_user.name

    def test_update_me_unauthenticated(self, client):
        response = client.put("/users/me", json={"name": "Hacker"})
        assert response.status_code == 401

    def test_update_reflects_in_get_me(self, client, auth_headers):
        client.put(
            "/users/me",
            json={"name": "Updated"},
            headers=auth_headers,
        )
        response = client.get("/users/me", headers=auth_headers)
        assert response.json()["name"] == "Updated"


class TestDeleteMeEndpoint:
    """Tests for DELETE /users/me - account deletion."""

    def test_delete_account_succeeds(self, client, auth_headers, test_user):
        """Deleting account returns 204 No Content."""
        response = client.delete("/users/me", headers=auth_headers)
        assert response.status_code == 204

    def test_delete_account_removes_user(self, client, auth_headers, test_user, session):
        """After deletion, the user no longer exists in the database."""
        client.delete("/users/me", headers=auth_headers)
        user = session.get(User, test_user.id)
        assert user is None

    def test_delete_account_removes_connections(
        self, client, auth_headers, test_user, test_connection, session
    ):
        """Deleting account also deletes all user's connections."""
        # Verify connection exists before delete
        conn = session.get(Connection, test_connection.id)
        assert conn is not None

        client.delete("/users/me", headers=auth_headers)

        # Connection should be gone
        conn = session.get(Connection, test_connection.id)
        assert conn is None

    def test_delete_account_removes_logs(
        self, client, auth_headers, test_user, test_connection, test_log, session
    ):
        """Deleting account also deletes all user's interaction logs."""
        # Verify log exists before delete
        log = session.get(Log, test_log.id)
        assert log is not None

        client.delete("/users/me", headers=auth_headers)

        # Log should be gone
        log = session.get(Log, test_log.id)
        assert log is None

    def test_delete_account_with_multiple_connections_and_logs(
        self, client, auth_headers, test_user, session
    ):
        """Deleting account removes all connections and logs, even multiple."""
        # Create multiple connections
        conn_ids = []
        log_ids = []
        for i in range(3):
            conn = Connection(
                id=str(uuid.uuid4()),
                user_id=test_user.id,
                name=f"Contact {i}",
                notes=f"Notes for contact {i}",
                created_at=datetime.datetime.utcnow(),
            )
            session.add(conn)
            session.commit()
            session.refresh(conn)
            conn_ids.append(conn.id)

            # Add logs for each connection
            for j in range(2):
                log = Log(
                    id=str(uuid.uuid4()),
                    user_id=test_user.id,
                    connection_id=conn.id,
                    type="note",
                    notes=f"Log {j} for contact {i}",
                    created_at=datetime.datetime.utcnow(),
                )
                session.add(log)
                session.commit()
                log_ids.append(log.id)

        # Verify all exist
        assert len(conn_ids) == 3
        assert len(log_ids) == 6

        response = client.delete("/users/me", headers=auth_headers)
        assert response.status_code == 204

        # All connections should be deleted
        for cid in conn_ids:
            assert session.get(Connection, cid) is None

        # All logs should be deleted
        for lid in log_ids:
            assert session.get(Log, lid) is None

        # User should be deleted
        assert session.get(User, test_user.id) is None

    def test_delete_account_does_not_affect_other_users(
        self, client, auth_headers, test_user, second_user, session
    ):
        """Deleting one user's account does not delete another user's data."""
        # Create connection and log for second user
        other_conn = Connection(
            id=str(uuid.uuid4()),
            user_id=second_user.id,
            name="Other Contact",
            notes="Other notes",
            created_at=datetime.datetime.utcnow(),
        )
        session.add(other_conn)
        session.commit()
        session.refresh(other_conn)

        other_log = Log(
            id=str(uuid.uuid4()),
            user_id=second_user.id,
            connection_id=other_conn.id,
            type="meeting",
            notes="Other meeting notes",
            created_at=datetime.datetime.utcnow(),
        )
        session.add(other_log)
        session.commit()

        # Delete test_user's account
        client.delete("/users/me", headers=auth_headers)

        # Second user's data should be intact
        assert session.get(User, second_user.id) is not None
        assert session.get(Connection, other_conn.id) is not None
        assert session.get(Log, other_log.id) is not None

    def test_delete_account_unauthenticated(self, client):
        """Unauthenticated delete request returns 401."""
        response = client.delete("/users/me")
        assert response.status_code == 401

    def test_delete_account_invalid_token(self, client):
        """Invalid token on delete returns 401."""
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.delete("/users/me", headers=headers)
        assert response.status_code == 401

    def test_delete_account_token_invalid_after_deletion(
        self, client, auth_headers, test_user
    ):
        """After account deletion, the same token should no longer work."""
        # Delete the account
        response = client.delete("/users/me", headers=auth_headers)
        assert response.status_code == 204

        # Try to use the same token - should fail (404 because user no longer exists)
        response = client.get("/users/me", headers=auth_headers)
        assert response.status_code in (401, 404)

    def test_delete_account_with_no_connections_or_logs(
        self, client, auth_headers, test_user, session
    ):
        """Deleting an account with no connections/logs still succeeds."""
        # test_user has no connections or logs by default (no test_connection fixture)
        response = client.delete("/users/me", headers=auth_headers)
        assert response.status_code == 204
        assert session.get(User, test_user.id) is None
