"""Unit tests for models.py - SQLModel database schemas and tag serialization."""

import pytest
import json
from datetime import datetime

from models import (
    User,
    Connection,
    ConnectionCreate,
    ConnectionRead,
    ConnectionUpdate,
    Log,
    LogCreate,
    LogRead,
    UserCreate,
    UserRead,
    UserUpdate,
)


class TestUserModel:
    def test_create_user(self):
        user = User(id="u1", email="a@b.com", name="Alice")
        assert user.id == "u1"
        assert user.email == "a@b.com"
        assert user.name == "Alice"
        assert user.is_active is True

    def test_default_is_active(self):
        user = User(id="u1", email="a@b.com", name="Alice")
        assert user.is_active is True

    def test_created_at_default(self):
        user = User(id="u1", email="a@b.com", name="Alice")
        assert isinstance(user.created_at, datetime)


class TestConnectionModel:
    def test_create_connection_minimal(self):
        conn = Connection(id="c1", name="Bob")
        assert conn.name == "Bob"
        assert conn.frequency == 90  # default
        assert conn.tags_json == "[]"

    def test_default_frequency_is_90(self):
        conn = Connection(id="c1", name="Bob")
        assert conn.frequency == 90

    def test_tags_property_getter(self):
        conn = Connection(id="c1", name="Bob", tags_json='["work", "friend"]')
        assert conn.tags == ["work", "friend"]

    def test_tags_property_setter(self):
        conn = Connection(id="c1", name="Bob")
        conn.tags = ["mentor", "peer"]
        assert conn.tags_json == '["mentor", "peer"]'
        assert conn.tags == ["mentor", "peer"]

    def test_tags_empty_list(self):
        conn = Connection(id="c1", name="Bob", tags_json="[]")
        assert conn.tags == []

    def test_all_optional_fields_default_none(self):
        conn = Connection(id="c1", name="Bob")
        assert conn.user_id is None
        assert conn.role is None
        assert conn.company is None
        assert conn.location is None
        assert conn.industry is None
        assert conn.howMet is None
        assert conn.lastContact is None
        assert conn.notes is None
        assert conn.linkedin is None
        assert conn.email is None
        assert conn.goals is None

    def test_full_connection(self):
        conn = Connection(
            id="c1",
            user_id="u1",
            name="Alice Smith",
            role="CTO",
            company="TechCorp",
            location="NYC",
            industry="Technology",
            howMet="LinkedIn",
            frequency=30,
            lastContact=datetime(2024, 6, 1),
            notes="Important contact",
            linkedin="https://linkedin.com/in/alice",
            email="alice@tech.com",
            goals="Partnership",
            tags_json='["vip"]',
        )
        assert conn.name == "Alice Smith"
        assert conn.frequency == 30
        assert conn.tags == ["vip"]


class TestConnectionCreateSchema:
    def test_minimal_creation(self):
        schema = ConnectionCreate(name="Bob")
        assert schema.name == "Bob"
        assert schema.frequency == 90
        assert schema.tags == []

    def test_full_creation(self):
        schema = ConnectionCreate(
            name="Alice",
            role="Engineer",
            company="Acme",
            location="SF",
            industry="Tech",
            howMet="Conference",
            frequency=30,
            notes="Met at PyCon",
            linkedin="https://linkedin.com/in/alice",
            email="alice@acme.com",
            goals="Collaborate",
            tags=["work", "python"],
        )
        assert schema.name == "Alice"
        assert schema.tags == ["work", "python"]


class TestConnectionUpdateSchema:
    def test_all_fields_optional(self):
        schema = ConnectionUpdate()
        assert schema.name is None
        assert schema.role is None
        assert schema.tags is None

    def test_partial_update(self):
        schema = ConnectionUpdate(name="New Name", company="New Corp")
        assert schema.name == "New Name"
        assert schema.company == "New Corp"
        assert schema.role is None


class TestLogModel:
    def test_create_log(self):
        log = Log(id="l1", notes="Had a call")
        assert log.notes == "Had a call"
        assert log.type == "interaction"  # default
        assert log.tags_json == "[]"

    def test_tags_property_getter(self):
        log = Log(id="l1", notes="call", tags_json='["followup"]')
        assert log.tags == ["followup"]

    def test_tags_property_setter(self):
        log = Log(id="l1", notes="call")
        log.tags = ["meeting", "important"]
        assert log.tags_json == '["meeting", "important"]'

    def test_default_type_is_interaction(self):
        log = Log(id="l1", notes="test")
        assert log.type == "interaction"

    def test_optional_connection_id(self):
        log = Log(id="l1", notes="general note")
        assert log.connection_id is None


class TestLogCreateSchema:
    def test_minimal_creation(self):
        schema = LogCreate(notes="Quick note")
        assert schema.notes == "Quick note"
        assert schema.type == "interaction"
        assert schema.tags == []
        assert schema.connection_id is None

    def test_full_creation(self):
        schema = LogCreate(
            connection_id="c1",
            type="meeting",
            notes="Discussed project",
            tags=["important"],
        )
        assert schema.connection_id == "c1"
        assert schema.type == "meeting"
        assert schema.tags == ["important"]


class TestUserSchemas:
    def test_user_create(self):
        schema = UserCreate(email="a@b.com", name="Alice")
        assert schema.email == "a@b.com"
        assert schema.name == "Alice"

    def test_user_read(self):
        schema = UserRead(
            id="u1",
            email="a@b.com",
            name="Alice",
            is_active=True,
            is_onboarded=False,
            created_at=datetime(2024, 1, 1),
        )
        assert schema.id == "u1"
        assert schema.is_active is True
        assert schema.is_onboarded is False

    def test_user_update_with_name(self):
        schema = UserUpdate(name="New Name")
        assert schema.name == "New Name"

    def test_user_update_empty(self):
        schema = UserUpdate()
        assert schema.name is None
