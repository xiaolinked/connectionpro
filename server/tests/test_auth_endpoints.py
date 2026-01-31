"""Integration tests for authentication API endpoints."""

import pytest
from models import User
from sqlmodel import select
import uuid
import datetime

class TestLoginEndpoint:
    """Tests for the new Firebase-based login/sync endpoint."""

    def test_login_existing_user(self, client, test_user, mock_firebase_auth):
        """Login with valid token for existing user returns user data."""
        response = client.post(
            "/auth/login",
            json={"token": "valid_token"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Login successful"
        assert data["user"]["email"] == test_user.email
        assert data["user"]["id"] == "test_user_id" # Matches mocked UID

    def test_login_creates_new_user(self, client, session, mock_firebase_auth):
        """Login with valid token for NEW user creates the user."""
        # Ensure user doesn't exist
        session.exec(select(User).where(User.email == "test@example.com")).first()
        # Clean up test_user if fixture created it (session is rolled back per test usually, but let's be safe)
        # Actually logic is: mock returns "test_user_id". If that ID not in DB, create it.
        # But `test_user` fixture creates user with "test_user_id" now.
        # So to test creation, we need a token that returns a UID NOT in DB.
        
        # We can't easily change the mock fixture behavior inside a test without monkeypatching again.
        # But we can just DELETE the user from the DB first.
        existing = session.get(User, "test_user_id")
        if existing:
            session.delete(existing)
            session.commit()

        response = client.post(
            "/auth/login",
            json={"token": "valid_token"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["is_onboarded"] is False
        
        # Verify in DB
        db_user = session.get(User, "test_user_id")
        assert db_user is not None
        assert db_user.email == "test@example.com"

    def test_login_invalid_token(self, client):
        """Login with invalid token returns 401."""
        response = client.post(
            "/auth/login",
            json={"token": "invalid_token"}
        )
        assert response.status_code == 401
    
    def test_login_missing_token(self, client):
        response = client.post(
            "/auth/login",
            json={}
        )
        assert response.status_code == 400


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

    def test_update_onboarding_status(self, client, auth_headers, test_user):
        """Test updating the new is_onboarded field."""
        assert test_user.is_onboarded is False # Default
        
        response = client.put(
            "/users/me",
            json={"is_onboarded": True},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_onboarded"] is True

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


class TestDeleteMeEndpoint:
    """Tests for DELETE /users/me - account deletion."""

    def test_delete_account_succeeds(self, client, auth_headers, test_user):
        """Deleting account returns 204 No Content."""
        response = client.delete("/users/me", headers=auth_headers)
        assert response.status_code == 204

    def test_delete_account_removes_user(self, client, auth_headers, test_user, session):
        """After deletion, the user no longer exists in the database."""
        client.delete("/users/me", headers=auth_headers)
        # We need to expire/refresh session or just query directly
        user = session.get(User, test_user.id)
        assert user is None
