"""Integration tests for interaction log API endpoints."""

import pytest


class TestCreateLog:
    def test_create_log_with_connection(self, client, auth_headers, test_connection):
        response = client.post(
            "/logs",
            json={
                "connection_id": test_connection.id,
                "type": "meeting",
                "notes": "Discussed project roadmap",
                "tags": ["planning"],
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["notes"] == "Discussed project roadmap"
        assert data["type"] == "meeting"
        assert data["connection_id"] == test_connection.id
        assert data["tags"] == ["planning"]

    def test_create_log_without_connection(self, client, auth_headers):
        response = client.post(
            "/logs",
            json={
                "notes": "General networking note",
                "tags": ["general"],
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["connection_id"] is None
        assert data["type"] == "interaction"  # default

    def test_create_log_default_type(self, client, auth_headers):
        response = client.post(
            "/logs",
            json={"notes": "Quick note"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert response.json()["type"] == "interaction"

    def test_create_log_with_custom_type(self, client, auth_headers):
        response = client.post(
            "/logs",
            json={"notes": "Had a call", "type": "call"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert response.json()["type"] == "call"

    def test_create_log_unauthenticated(self, client):
        response = client.post(
            "/logs",
            json={"notes": "Should fail"},
        )
        assert response.status_code == 401

    def test_create_log_for_other_users_connection(
        self, client, second_auth_headers, test_connection
    ):
        """Should not allow logging against another user's connection."""
        response = client.post(
            "/logs",
            json={
                "connection_id": test_connection.id,
                "notes": "Sneaky log",
            },
            headers=second_auth_headers,
        )
        assert response.status_code == 403

    def test_create_log_has_created_at(self, client, auth_headers):
        response = client.post(
            "/logs",
            json={"notes": "Timestamped"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert "created_at" in response.json()

    def test_create_log_empty_tags_default(self, client, auth_headers):
        response = client.post(
            "/logs",
            json={"notes": "No tags"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert response.json()["tags"] == []


class TestGetLogs:
    def test_list_logs_empty(self, client, auth_headers):
        response = client.get("/logs", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_list_logs_with_data(self, client, auth_headers, test_log):
        response = client.get("/logs", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["notes"] == test_log.notes

    def test_list_logs_user_isolation(
        self, client, second_auth_headers, test_log
    ):
        """Second user should not see first user's logs."""
        response = client.get("/logs", headers=second_auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_list_logs_unauthenticated(self, client):
        response = client.get("/logs")
        assert response.status_code == 401

    def test_list_logs_ordered_by_created_at_desc(self, client, auth_headers):
        """Logs should be returned newest first."""
        client.post("/logs", json={"notes": "First log"}, headers=auth_headers)
        client.post("/logs", json={"notes": "Second log"}, headers=auth_headers)
        client.post("/logs", json={"notes": "Third log"}, headers=auth_headers)

        response = client.get("/logs", headers=auth_headers)
        data = response.json()
        assert len(data) == 3
        # Most recent should be first
        assert data[0]["notes"] == "Third log"
        assert data[2]["notes"] == "First log"


class TestDeleteLog:
    def test_delete_log(self, client, auth_headers, test_log):
        response = client.delete(f"/logs/{test_log.id}", headers=auth_headers)
        assert response.status_code == 204

        # Verify it's gone
        logs_response = client.get("/logs", headers=auth_headers)
        assert len(logs_response.json()) == 0

    def test_delete_nonexistent_log(self, client, auth_headers):
        response = client.delete("/logs/nonexistent-id", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_log_user_isolation(
        self, client, second_auth_headers, test_log
    ):
        """Second user should not delete first user's log
        (log is linked to first user's connection)."""
        response = client.delete(
            f"/logs/{test_log.id}", headers=second_auth_headers
        )
        assert response.status_code == 403

    def test_delete_log_unauthenticated(self, client, test_log):
        response = client.delete(f"/logs/{test_log.id}")
        assert response.status_code == 401
