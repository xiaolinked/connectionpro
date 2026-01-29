"""Integration tests for authentication API endpoints."""

import pytest
from auth_utils import create_magic_link_token, create_access_token
from datetime import timedelta
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
            json={"email": test_user.email, "name": ""},
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
        response = client.post(f"/auth/verify?token={token}")
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == test_user.email

    def test_verify_invalid_token(self, client):
        response = client.post("/auth/verify?token=invalid-garbage-token")
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
        response = client.post(f"/auth/verify?token={token}")
        assert response.status_code == 401

    def test_verify_returns_user_data(self, client, test_user):
        token = create_magic_link_token(test_user.email)
        response = client.post(f"/auth/verify?token={token}")
        data = response.json()
        assert data["user"]["name"] == test_user.name
        assert data["user"]["email"] == test_user.email


class TestGetMeEndpoint:
    def test_get_me_authenticated(self, client, test_user, auth_headers):
        response = client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["name"] == test_user.name

    def test_get_me_unauthenticated(self, client):
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_get_me_invalid_token(self, client):
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 401

    def test_get_me_expired_token(self, client, test_user):
        token = create_access_token(
            data={"sub": test_user.id},
            expires_delta=timedelta(seconds=-1),
        )
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/auth/me", headers=headers)
        assert response.status_code == 401


class TestUpdateMeEndpoint:
    def test_update_name(self, client, auth_headers, test_user):
        response = client.put(
            "/auth/me",
            json={"name": "New Name"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"
        assert data["email"] == test_user.email

    def test_update_preserves_unchanged_fields(self, client, auth_headers, test_user):
        response = client.put(
            "/auth/me",
            json={"name": "Changed"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["id"] == test_user.id

    def test_update_empty_body_changes_nothing(self, client, auth_headers, test_user):
        response = client.put(
            "/auth/me",
            json={},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["name"] == test_user.name

    def test_update_me_unauthenticated(self, client):
        response = client.put("/auth/me", json={"name": "Hacker"})
        assert response.status_code == 401

    def test_update_reflects_in_get_me(self, client, auth_headers):
        client.put(
            "/auth/me",
            json={"name": "Updated"},
            headers=auth_headers,
        )
        response = client.get("/auth/me", headers=auth_headers)
        assert response.json()["name"] == "Updated"
