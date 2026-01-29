"""Unit tests for worker.py - Celery LinkedIn enrichment task."""

import pytest
import json
from unittest.mock import patch, MagicMock

from worker import enrich_linkedin_task


def _make_response(status_code, text):
    """Helper to create a mock requests.Response."""
    mock_resp = MagicMock()
    mock_resp.status_code = status_code
    mock_resp.text = text
    return mock_resp


class TestEnrichLinkedinTask:
    @patch("worker.requests.get")
    @patch("worker.UserAgent")
    def test_parses_json_ld_person_data(self, mock_ua, mock_get):
        mock_ua.return_value.random = "TestAgent/1.0"

        json_ld = json.dumps({
            "@graph": [
                {
                    "@type": "Person",
                    "name": "John Doe",
                    "address": {"addressLocality": "San Francisco"},
                    "worksFor": [{"name": "Acme Corp", "location": ""}],
                    "jobTitle": ["Software Engineer"],
                }
            ]
        })
        html = f"""
        <html>
        <head><script type="application/ld+json">{json_ld}</script></head>
        <body></body>
        </html>
        """
        mock_get.return_value = _make_response(200, html)

        result = enrich_linkedin_task("https://linkedin.com/in/johndoe")
        assert result["name"] == "John Doe"
        assert result["role"] == "Software Engineer"
        assert result["company"] == "Acme Corp"
        assert result["location"] == "San Francisco"

    @patch("worker.requests.get")
    @patch("worker.UserAgent")
    def test_fallback_to_og_title(self, mock_ua, mock_get):
        mock_ua.return_value.random = "TestAgent/1.0"

        html = """
        <html>
        <head>
            <meta property="og:title" content="Jane Smith - CTO at TechCo | LinkedIn">
        </head>
        <body></body>
        </html>
        """
        mock_get.return_value = _make_response(200, html)

        result = enrich_linkedin_task("https://linkedin.com/in/janesmith")
        assert result["name"] == "Jane Smith"
        assert result["role"] == "CTO"
        assert result["company"] == "TechCo"

    @patch("worker.requests.get")
    @patch("worker.UserAgent")
    def test_fallback_to_url_slug(self, mock_ua, mock_get):
        mock_ua.return_value.random = "TestAgent/1.0"

        html = """
        <html>
        <head><title>Join LinkedIn</title></head>
        <body></body>
        </html>
        """
        mock_get.return_value = _make_response(200, html)

        result = enrich_linkedin_task("https://linkedin.com/in/bob-jones")
        assert result["name"] == "Bob Jones"

    @patch("worker.requests.get")
    @patch("worker.UserAgent")
    def test_handles_non_200_response(self, mock_ua, mock_get):
        mock_ua.return_value.random = "TestAgent/1.0"
        mock_get.return_value = _make_response(403, "Forbidden")

        result = enrich_linkedin_task("https://linkedin.com/in/blocked")
        assert "error" in result
        assert "403" in result["error"]

    @patch("worker.requests.get")
    @patch("worker.UserAgent")
    def test_handles_request_exception(self, mock_ua, mock_get):
        mock_ua.return_value.random = "TestAgent/1.0"
        mock_get.side_effect = Exception("Connection timeout")

        result = enrich_linkedin_task("https://linkedin.com/in/timeout-user")
        # Should fallback to URL slug
        assert result["name"] == "Timeout User"
        assert result["role"] == ""
        assert result["company"] == ""

    @patch("worker.requests.get")
    @patch("worker.UserAgent")
    def test_filters_obfuscated_job_titles(self, mock_ua, mock_get):
        mock_ua.return_value.random = "TestAgent/1.0"

        json_ld = json.dumps({
            "@graph": [
                {
                    "@type": "Person",
                    "name": "Alice",
                    "jobTitle": ["*** at ***", "Software Engineer"],
                    "worksFor": [],
                }
            ]
        })
        html = f"""
        <html>
        <head><script type="application/ld+json">{json_ld}</script></head>
        <body></body>
        </html>
        """
        mock_get.return_value = _make_response(200, html)

        result = enrich_linkedin_task("https://linkedin.com/in/alice")
        assert result["role"] == "Software Engineer"

    @patch("worker.requests.get")
    @patch("worker.UserAgent")
    def test_og_title_without_role(self, mock_ua, mock_get):
        """og:title with just a company name (short, capitalized)."""
        mock_ua.return_value.random = "TestAgent/1.0"

        html = """
        <html>
        <head>
            <meta property="og:title" content="Sam Lee - Google | LinkedIn">
        </head>
        <body></body>
        </html>
        """
        mock_get.return_value = _make_response(200, html)

        result = enrich_linkedin_task("https://linkedin.com/in/samlee")
        assert result["name"] == "Sam Lee"

    @patch("worker.requests.get")
    @patch("worker.UserAgent")
    def test_json_ld_with_location_fallback_from_worksFor(self, mock_ua, mock_get):
        mock_ua.return_value.random = "TestAgent/1.0"

        json_ld = json.dumps({
            "@graph": [
                {
                    "@type": "Person",
                    "name": "Tom",
                    "address": {},
                    "worksFor": [{"name": "Corp", "location": "Boston"}],
                    "jobTitle": ["Manager"],
                }
            ]
        })
        html = f"""
        <html>
        <head><script type="application/ld+json">{json_ld}</script></head>
        <body></body>
        </html>
        """
        mock_get.return_value = _make_response(200, html)

        result = enrich_linkedin_task("https://linkedin.com/in/tom")
        assert result["location"] == "Boston"

    @patch("worker.requests.get")
    @patch("worker.UserAgent")
    def test_result_always_has_required_keys(self, mock_ua, mock_get):
        mock_ua.return_value.random = "TestAgent/1.0"
        mock_get.return_value = _make_response(200, "<html></html>")

        result = enrich_linkedin_task("https://linkedin.com/in/empty-page")
        assert "name" in result
        assert "role" in result
        assert "company" in result
        assert "location" in result
        assert "industry" in result

    @patch("worker.requests.get")
    @patch("worker.UserAgent")
    def test_uses_random_user_agent(self, mock_ua, mock_get):
        mock_ua.return_value.random = "CustomAgent/2.0"
        mock_get.return_value = _make_response(200, "<html></html>")

        enrich_linkedin_task("https://linkedin.com/in/test")
        mock_get.assert_called_once()
        call_args = mock_get.call_args
        assert call_args[1]["headers"]["User-Agent"] == "CustomAgent/2.0"
