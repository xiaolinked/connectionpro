"""Unit tests for auth_utils.py - JWT token creation and verification."""

import pytest
import jwt
import time
from datetime import datetime, timedelta
from unittest.mock import patch

from auth_utils import (
    create_access_token,
    decode_access_token,
    create_magic_link_token,
    verify_magic_link_token,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    MAGIC_LINK_EXPIRE_MINUTES,
)


class TestCreateAccessToken:
    def test_creates_valid_jwt(self):
        token = create_access_token(data={"sub": "user-123"})
        assert isinstance(token, str)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "user-123"

    def test_includes_expiration(self):
        token = create_access_token(data={"sub": "user-123"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in payload

    def test_default_expiration_is_7_days(self):
        before = datetime.utcnow()
        token = create_access_token(data={"sub": "user-123"})
        after = datetime.utcnow()

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = datetime.utcfromtimestamp(payload["exp"])

        # Expiration should be ~7 days from now
        expected_min = before + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES - 1)
        expected_max = after + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES + 1)
        assert expected_min <= exp <= expected_max

    def test_custom_expiration_delta(self):
        delta = timedelta(hours=2)
        before = datetime.utcnow()
        token = create_access_token(data={"sub": "user-123"}, expires_delta=delta)

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = datetime.utcfromtimestamp(payload["exp"])

        expected = before + delta
        # Allow 5 seconds of tolerance
        assert abs((exp - expected).total_seconds()) < 5

    def test_preserves_payload_data(self):
        data = {"sub": "user-456", "role": "admin", "extra": "value"}
        token = create_access_token(data=data)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "user-456"
        assert payload["role"] == "admin"
        assert payload["extra"] == "value"

    def test_does_not_mutate_input_data(self):
        data = {"sub": "user-123"}
        create_access_token(data=data)
        assert data == {"sub": "user-123"}  # No "exp" key added


class TestDecodeAccessToken:
    def test_decodes_valid_token(self):
        token = create_access_token(data={"sub": "user-789"})
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "user-789"

    def test_returns_none_for_invalid_token(self):
        result = decode_access_token("not-a-valid-token")
        assert result is None

    def test_returns_none_for_expired_token(self):
        token = create_access_token(
            data={"sub": "user-123"},
            expires_delta=timedelta(seconds=-1),
        )
        result = decode_access_token(token)
        assert result is None

    def test_returns_none_for_wrong_secret(self):
        token = jwt.encode(
            {"sub": "user-123", "exp": datetime.utcnow() + timedelta(hours=1)},
            "wrong-secret",
            algorithm=ALGORITHM,
        )
        result = decode_access_token(token)
        assert result is None

    def test_returns_none_for_tampered_token(self):
        token = create_access_token(data={"sub": "user-123"})
        # Tamper with the token
        tampered = token[:-5] + "XXXXX"
        result = decode_access_token(tampered)
        assert result is None


class TestCreateMagicLinkToken:
    def test_creates_token_with_email(self):
        token = create_magic_link_token("user@example.com")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "user@example.com"

    def test_includes_magic_link_type(self):
        token = create_magic_link_token("user@example.com")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["type"] == "magic_link"

    def test_includes_expiration(self):
        before = datetime.utcnow()
        token = create_magic_link_token("user@example.com")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = datetime.utcfromtimestamp(payload["exp"])

        expected_min = before + timedelta(minutes=MAGIC_LINK_EXPIRE_MINUTES - 1)
        expected_max = before + timedelta(minutes=MAGIC_LINK_EXPIRE_MINUTES + 1)
        assert expected_min <= exp <= expected_max


class TestVerifyMagicLinkToken:
    def test_verifies_valid_token(self):
        token = create_magic_link_token("user@example.com")
        email = verify_magic_link_token(token)
        assert email == "user@example.com"

    def test_returns_none_for_invalid_token(self):
        result = verify_magic_link_token("garbage-token")
        assert result is None

    def test_returns_none_for_expired_token(self):
        payload = {
            "sub": "user@example.com",
            "type": "magic_link",
            "exp": datetime.utcnow() - timedelta(minutes=1),
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        result = verify_magic_link_token(token)
        assert result is None

    def test_returns_none_for_non_magic_link_type(self):
        """A regular access token should not pass magic link verification."""
        token = create_access_token(data={"sub": "user@example.com"})
        result = verify_magic_link_token(token)
        assert result is None

    def test_returns_none_for_missing_type_field(self):
        payload = {
            "sub": "user@example.com",
            "exp": datetime.utcnow() + timedelta(minutes=15),
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        result = verify_magic_link_token(token)
        assert result is None

    def test_roundtrip_create_and_verify(self):
        """End-to-end: create a magic link token, then verify it."""
        email = "roundtrip@example.com"
        token = create_magic_link_token(email)
        result = verify_magic_link_token(token)
        assert result == email
