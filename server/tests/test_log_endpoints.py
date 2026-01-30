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
        assert response.json()["items"] == []

    def test_list_logs_with_data(self, client, auth_headers, test_log):
        response = client.get("/logs", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["notes"] == test_log.notes

    def test_list_logs_user_isolation(
        self, client, second_auth_headers, test_log
    ):
        """Second user should not see first user's logs."""
        response = client.get("/logs", headers=second_auth_headers)
        assert response.status_code == 200
        assert response.json()["items"] == []

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
        assert len(data["items"]) == 3
        # Most recent should be first
        assert data["items"][0]["notes"] == "Third log"
        assert data["items"][2]["notes"] == "First log"


class TestDeleteLog:
    def test_delete_log(self, client, auth_headers, test_log):
        response = client.delete(f"/logs/{test_log.id}", headers=auth_headers)
        assert response.status_code == 204

        # Verify it's gone
        logs_response = client.get("/logs", headers=auth_headers)
        assert len(logs_response.json()["items"]) == 0

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


class TestLastContactSync:
    """Tests for automatic lastContact synchronization with logs."""

    def test_create_log_updates_connection_last_contact(
        self, client, auth_headers, session, test_user
    ):
        """Creating a log should update the connection's lastContact."""
        import datetime
        from models import Connection
        
        # Create a connection with no lastContact
        conn = Connection(
            id="sync-test-conn-1",
            user_id=test_user.id,
            name="Sync Test",
            lastContact=None,
        )
        session.add(conn)
        session.commit()

        # Create a log for this connection
        response = client.post(
            "/logs",
            json={
                "connection_id": conn.id,
                "notes": "First interaction",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        log_data = response.json()

        # Refresh and check the connection's lastContact was updated
        session.refresh(conn)
        assert conn.lastContact is not None
        # Should be close to the log's created_at
        log_created = datetime.datetime.fromisoformat(log_data["created_at"].replace("Z", "+00:00"))
        assert abs((conn.lastContact.replace(tzinfo=None) - log_created.replace(tzinfo=None)).total_seconds()) < 2

    def test_create_older_log_does_not_overwrite_last_contact(
        self, client, auth_headers, session, test_user
    ):
        """Creating a log with an older date should not overwrite a more recent lastContact."""
        import datetime
        from models import Connection

        # Create connection with a recent lastContact
        recent_date = datetime.datetime(2025, 6, 15, 12, 0, 0)
        conn = Connection(
            id="sync-test-conn-2",
            user_id=test_user.id,
            name="Sync Test 2",
            lastContact=recent_date,
        )
        session.add(conn)
        session.commit()

        # Create a log with an older date
        old_date = "2025-01-01T10:00:00Z"
        response = client.post(
            "/logs",
            json={
                "connection_id": conn.id,
                "notes": "Old interaction",
                "created_at": old_date,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201

        # lastContact should still be the recent date
        session.refresh(conn)
        assert conn.lastContact == recent_date

    def test_delete_log_recalculates_last_contact(
        self, client, auth_headers, session, test_user
    ):
        """Deleting a log should recalculate lastContact from remaining logs."""
        import datetime
        from models import Connection, Log

        # Create connection
        conn = Connection(
            id="sync-test-conn-3",
            user_id=test_user.id,
            name="Sync Test 3",
            lastContact=None,
        )
        session.add(conn)
        session.commit()

        # Create two logs with different dates
        older_log = Log(
            id="older-log-id",
            user_id=test_user.id,
            connection_id=conn.id,
            type="meeting",
            notes="Older meeting",
            created_at=datetime.datetime(2025, 3, 1, 10, 0, 0),
        )
        newer_log = Log(
            id="newer-log-id",
            user_id=test_user.id,
            connection_id=conn.id,
            type="call",
            notes="Recent call",
            created_at=datetime.datetime(2025, 6, 1, 10, 0, 0),
        )
        conn.lastContact = newer_log.created_at
        session.add(older_log)
        session.add(newer_log)
        session.add(conn)
        session.commit()

        # Delete the newer log
        response = client.delete("/logs/newer-log-id", headers=auth_headers)
        assert response.status_code == 204

        # lastContact should now be the older log's date
        session.refresh(conn)
        assert conn.lastContact == datetime.datetime(2025, 3, 1, 10, 0, 0)

    def test_delete_all_logs_clears_last_contact(
        self, client, auth_headers, session, test_user
    ):
        """Deleting all logs should set lastContact to None."""
        import datetime
        from models import Connection, Log

        # Create connection with a log
        conn = Connection(
            id="sync-test-conn-4",
            user_id=test_user.id,
            name="Sync Test 4",
            lastContact=datetime.datetime(2025, 5, 1, 10, 0, 0),
        )
        only_log = Log(
            id="only-log-id",
            user_id=test_user.id,
            connection_id=conn.id,
            type="email",
            notes="Only interaction",
            created_at=datetime.datetime(2025, 5, 1, 10, 0, 0),
        )
        session.add(conn)
        session.add(only_log)
        session.commit()

        # Delete the only log
        response = client.delete("/logs/only-log-id", headers=auth_headers)
        assert response.status_code == 204

        # lastContact should now be None
        session.refresh(conn)
        assert conn.lastContact is None

