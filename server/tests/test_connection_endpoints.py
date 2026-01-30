"""Integration tests for connection CRUD API endpoints."""

import pytest


class TestCreateConnection:
    def test_create_minimal_connection(self, client, auth_headers):
        response = client.post(
            "/connections",
            json={"name": "Alice"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Alice"
        assert data["id"] is not None
        assert data["frequency"] == 90  # default
        assert data["tags"] == []

    def test_create_full_connection(self, client, auth_headers):
        response = client.post(
            "/connections",
            json={
                "name": "Bob Smith",
                "role": "VP Engineering",
                "company": "TechCo",
                "location": "New York",
                "industry": "Technology",
                "howMet": "Conference",
                "frequency": 30,
                "notes": "Great contact",
                "linkedin": "https://linkedin.com/in/bob",
                "email": "bob@techco.com",
                "goals": "Partnership",
                "tags": ["vip", "tech"],
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Bob Smith"
        assert data["role"] == "VP Engineering"
        assert data["company"] == "TechCo"
        assert data["frequency"] == 30
        assert data["tags"] == ["vip", "tech"]
        assert data["linkedin"] == "https://linkedin.com/in/bob"

    def test_create_connection_with_tags(self, client, auth_headers):
        response = client.post(
            "/connections",
            json={"name": "Tagged Person", "tags": ["mentor", "python", "ml"]},
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert response.json()["tags"] == ["mentor", "python", "ml"]

    def test_create_connection_unauthenticated(self, client):
        response = client.post(
            "/connections",
            json={"name": "Alice"},
        )
        assert response.status_code == 401

    def test_create_connection_has_created_at(self, client, auth_headers):
        response = client.post(
            "/connections",
            json={"name": "Alice"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert "created_at" in response.json()


class TestGetConnections:
    def test_list_connections_empty(self, client, auth_headers):
        response = client.get("/connections", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["items"] == []

    def test_list_connections_with_data(self, client, auth_headers, test_connection):
        response = client.get("/connections", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["name"] == test_connection.name

    def test_list_connections_user_isolation(
        self, client, auth_headers, second_auth_headers, test_connection
    ):
        """Second user should not see first user's connections."""
        response = client.get("/connections", headers=second_auth_headers)
        assert response.status_code == 200
        assert response.json()["items"] == []

    def test_list_connections_unauthenticated(self, client):
        response = client.get("/connections")
        assert response.status_code == 401

    def test_list_multiple_connections(self, client, auth_headers):
        for i in range(5):
            client.post(
                "/connections",
                json={"name": f"Person {i}"},
                headers=auth_headers,
            )
        response = client.get("/connections", headers=auth_headers)
        assert len(response.json()["items"]) == 5


class TestGetSingleConnection:
    def test_get_connection_by_id(self, client, auth_headers, test_connection):
        response = client.get(
            f"/connections/{test_connection.id}", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == test_connection.name
        assert data["company"] == test_connection.company

    def test_get_nonexistent_connection(self, client, auth_headers):
        response = client.get(
            "/connections/nonexistent-id", headers=auth_headers
        )
        assert response.status_code == 404

    def test_get_connection_user_isolation(
        self, client, second_auth_headers, test_connection
    ):
        """Second user should not access first user's connection."""
        response = client.get(
            f"/connections/{test_connection.id}", headers=second_auth_headers
        )
        assert response.status_code == 404

    def test_get_connection_includes_tags(self, client, auth_headers, test_connection):
        response = client.get(
            f"/connections/{test_connection.id}", headers=auth_headers
        )
        data = response.json()
        assert data["tags"] == ["work", "python"]


class TestUpdateConnection:
    def test_update_name(self, client, auth_headers, test_connection):
        response = client.put(
            f"/connections/{test_connection.id}",
            json={"name": "Jane Updated"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Jane Updated"

    def test_update_multiple_fields(self, client, auth_headers, test_connection):
        response = client.put(
            f"/connections/{test_connection.id}",
            json={
                "company": "New Corp",
                "role": "CTO",
                "frequency": 14,
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["company"] == "New Corp"
        assert data["role"] == "CTO"
        assert data["frequency"] == 14
        # Unchanged fields should remain
        assert data["name"] == test_connection.name

    def test_update_tags(self, client, auth_headers, test_connection):
        response = client.put(
            f"/connections/{test_connection.id}",
            json={"tags": ["new-tag", "updated"]},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["tags"] == ["new-tag", "updated"]

    def test_update_nonexistent_connection(self, client, auth_headers):
        response = client.put(
            "/connections/nonexistent-id",
            json={"name": "Ghost"},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_update_connection_user_isolation(
        self, client, second_auth_headers, test_connection
    ):
        """Second user should not update first user's connection."""
        response = client.put(
            f"/connections/{test_connection.id}",
            json={"name": "Hacked"},
            headers=second_auth_headers,
        )
        assert response.status_code == 404

    def test_update_last_contact(self, client, auth_headers, test_connection):
        response = client.put(
            f"/connections/{test_connection.id}",
            json={"lastContact": "2024-12-25T00:00:00"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert "2024-12-25" in response.json()["lastContact"]


class TestDeleteConnection:
    def test_delete_connection(self, client, auth_headers, test_connection):
        response = client.delete(
            f"/connections/{test_connection.id}", headers=auth_headers
        )
        assert response.status_code == 204

        # Verify it's gone
        get_response = client.get(
            f"/connections/{test_connection.id}", headers=auth_headers
        )
        assert get_response.status_code == 404

    def test_delete_nonexistent_connection(self, client, auth_headers):
        response = client.delete(
            "/connections/nonexistent-id", headers=auth_headers
        )
        assert response.status_code == 404

    def test_delete_connection_user_isolation(
        self, client, second_auth_headers, test_connection
    ):
        """Second user should not delete first user's connection."""
        response = client.delete(
            f"/connections/{test_connection.id}", headers=second_auth_headers
        )
        assert response.status_code == 404

    def test_delete_removes_from_list(self, client, auth_headers, test_connection):
        client.delete(f"/connections/{test_connection.id}", headers=auth_headers)
        response = client.get("/connections", headers=auth_headers)
        assert len(response.json()["items"]) == 0
