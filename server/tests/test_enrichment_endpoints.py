"""Integration tests for LinkedIn enrichment / Celery task endpoints."""

import pytest
from unittest.mock import patch, MagicMock


class TestEnrichEndpoint:
    @patch("main.enrich_linkedin_task")
    def test_enrich_starts_task(self, mock_task, client, auth_headers):
        mock_result = MagicMock()
        mock_result.id = "task-abc-123"
        mock_task.delay.return_value = mock_result

        response = client.post(
            "/enrich?linkedin_url=https://linkedin.com/in/johndoe",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["task_id"] == "task-abc-123"
        mock_task.delay.assert_called_once_with(
            "https://linkedin.com/in/johndoe"
        )

    @patch("main.enrich_linkedin_task")
    def test_enrich_with_encoded_url(self, mock_task, client, auth_headers):
        mock_result = MagicMock()
        mock_result.id = "task-456"
        mock_task.delay.return_value = mock_result

        response = client.post(
            "/enrich?linkedin_url=https%3A%2F%2Flinkedin.com%2Fin%2Fjane-doe",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["task_id"] == "task-456"


class TestTaskStatusEndpoint:
    @patch("main.AsyncResult")
    def test_task_pending(self, mock_async_result, client, auth_headers):
        mock_result = MagicMock()
        mock_result.state = "PENDING"
        mock_async_result.return_value = mock_result

        response = client.get("/tasks/task-123", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "Pending"

    @patch("main.AsyncResult")
    def test_task_success(self, mock_async_result, client, auth_headers):
        mock_result = MagicMock()
        mock_result.state = "SUCCESS"
        mock_result.result = {
            "name": "John Doe",
            "role": "Engineer",
            "company": "Acme",
            "location": "SF",
            "industry": "",
        }
        mock_async_result.return_value = mock_result

        response = client.get("/tasks/task-123", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Success"
        assert data["data"]["name"] == "John Doe"
        assert data["data"]["company"] == "Acme"

    @patch("main.AsyncResult")
    def test_task_failure(self, mock_async_result, client, auth_headers):
        mock_result = MagicMock()
        mock_result.state = "FAILURE"
        mock_result.result = Exception("Scraping failed")
        mock_async_result.return_value = mock_result

        response = client.get("/tasks/task-123", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Failure"
        assert "Scraping failed" in data["error"]

    @patch("main.AsyncResult")
    def test_task_unknown_state(self, mock_async_result, client, auth_headers):
        mock_result = MagicMock()
        mock_result.state = "STARTED"
        mock_async_result.return_value = mock_result

        response = client.get("/tasks/task-123", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "STARTED"
