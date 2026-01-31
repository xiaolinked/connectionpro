from typing import Optional, List
from sqlmodel import Field, SQLModel
from pydantic import field_validator
from datetime import datetime
import json
import re

# ===== Max field lengths =====
MAX_NAME_LENGTH = 200
MAX_SHORT_FIELD = 500
MAX_LONG_FIELD = 5000
MAX_URL_LENGTH = 2048
MAX_TAGS = 50
MAX_TAG_LENGTH = 100



class TagDefinition(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    category: str      # e.g., 'howMet', 'relationshipType', 'interactionType', 'custom'
    name: str          # e.g., 'Conference', 'Coffee Chat'
    type: str          # 'connection' or 'interaction'
    is_custom: bool = Field(default=False)


import uuid
from sqlalchemy.dialects.postgresql import UUID

class User(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(
        default_factory=uuid.uuid4, 
        primary_key=True,
        index=True,
        nullable=False
    )
    firebase_uid: str = Field(index=True, unique=True)
    email: Optional[str] = Field(default=None, index=True, unique=True)
    phone_number: Optional[str] = Field(default=None, index=True, unique=True)
    name: str
    is_active: bool = Field(default=True)
    is_onboarded: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ... (skip Connection)

class UserRead(SQLModel):
    id: str
    email: str
    name: str
    is_active: bool
    is_onboarded: bool
    created_at: datetime

class Connection(SQLModel, table=True):
    id: Optional[str] = Field(default=None, primary_key=True)
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id", index=True)
    name: str
    role: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    howMet: Optional[str] = None
    frequency: int = Field(default=90)
    lastContact: Optional[datetime] = None
    notes: Optional[str] = None
    linkedin: Optional[str] = None
    email: Optional[str] = None
    goals: Optional[str] = None
    tags_json: str = Field(default="[]") # Store tags as JSON string for SQLite simplicity
    created_at: datetime = Field(default_factory=datetime.utcnow)


    @property
    def tags(self) -> List[str]:
        return json.loads(self.tags_json)

    @tags.setter
    def tags(self, value: List[str]):
        self.tags_json = json.dumps(value)


# ===== Shared validators =====

def _validate_name(v: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError("Name cannot be empty")
    if len(v) > MAX_NAME_LENGTH:
        raise ValueError(f"Name must be {MAX_NAME_LENGTH} characters or fewer")
    return v

def _validate_short_field(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    v = v.strip()
    if len(v) > MAX_SHORT_FIELD:
        raise ValueError(f"Field must be {MAX_SHORT_FIELD} characters or fewer")
    return v if v else None

def _validate_long_field(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    v = v.strip()
    if len(v) > MAX_LONG_FIELD:
        raise ValueError(f"Field must be {MAX_LONG_FIELD} characters or fewer")
    return v if v else None

def _validate_url(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    v = v.strip()
    if not v:
        return None
    if len(v) > MAX_URL_LENGTH:
        raise ValueError(f"URL must be {MAX_URL_LENGTH} characters or fewer")
    if not re.match(r'^https?://', v):
        raise ValueError("URL must start with http:// or https://")
    return v

def _validate_email_field(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    v = v.strip().lower()
    if not v:
        return None
    if len(v) > MAX_SHORT_FIELD:
        raise ValueError(f"Email must be {MAX_SHORT_FIELD} characters or fewer")
    if '@' not in v:
        raise ValueError("Invalid email format")
    return v

def _validate_frequency(v: int) -> int:
    if v < 1:
        raise ValueError("Frequency must be at least 1 day")
    if v > 3650:
        raise ValueError("Frequency must be 3650 days (10 years) or fewer")
    return v

def _validate_tags(v: List[str]) -> List[str]:
    if len(v) > MAX_TAGS:
        raise ValueError(f"Maximum {MAX_TAGS} tags allowed")
    cleaned = []
    for tag in v:
        tag = tag.strip()
        if tag:
            if len(tag) > MAX_TAG_LENGTH:
                raise ValueError(f"Each tag must be {MAX_TAG_LENGTH} characters or fewer")
            cleaned.append(tag)
    return cleaned


class ConnectionCreate(SQLModel):
    name: str
    role: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    howMet: Optional[str] = None
    frequency: int = 90
    lastContact: Optional[datetime] = None
    notes: Optional[str] = None
    linkedin: Optional[str] = None
    email: Optional[str] = None
    goals: Optional[str] = None
    tags: List[str] = []

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        return _validate_name(v)

    @field_validator('role', 'company', 'location', 'industry', 'howMet')
    @classmethod
    def validate_short_fields(cls, v):
        return _validate_short_field(v)

    @field_validator('notes', 'goals')
    @classmethod
    def validate_long_fields(cls, v):
        return _validate_long_field(v)

    @field_validator('linkedin')
    @classmethod
    def validate_linkedin(cls, v):
        return _validate_url(v)

    @field_validator('email')
    @classmethod
    def validate_email_field(cls, v):
        return _validate_email_field(v)

    @field_validator('frequency')
    @classmethod
    def validate_frequency(cls, v):
        return _validate_frequency(v)

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        return _validate_tags(v)


class ConnectionRead(ConnectionCreate):
    id: str
    tags: List[str] = []
    created_at: datetime


class ConnectionUpdate(SQLModel):
    name: Optional[str] = None
    role: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    howMet: Optional[str] = None
    frequency: Optional[int] = None
    lastContact: Optional[datetime] = None
    notes: Optional[str] = None
    linkedin: Optional[str] = None
    email: Optional[str] = None
    goals: Optional[str] = None
    tags: Optional[List[str]] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v is None:
            return v
        return _validate_name(v)

    @field_validator('role', 'company', 'location', 'industry', 'howMet')
    @classmethod
    def validate_short_fields(cls, v):
        return _validate_short_field(v)

    @field_validator('notes', 'goals')
    @classmethod
    def validate_long_fields(cls, v):
        return _validate_long_field(v)

    @field_validator('linkedin')
    @classmethod
    def validate_linkedin(cls, v):
        return _validate_url(v)

    @field_validator('email')
    @classmethod
    def validate_email_field(cls, v):
        return _validate_email_field(v)

    @field_validator('frequency')
    @classmethod
    def validate_frequency(cls, v):
        if v is None:
            return v
        return _validate_frequency(v)

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        if v is None:
            return v
        return _validate_tags(v)


class UserCreate(SQLModel):
    email: Optional[str] = None
    phone_number: Optional[str] = None
    name: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v is None:
            return v
        v = v.strip().lower()
        if not v or '@' not in v or len(v) > MAX_SHORT_FIELD:
            raise ValueError("Invalid email address")
        return v

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        return _validate_name(v)


class UserRead(SQLModel):
    id: uuid.UUID
    firebase_uid: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    name: str
    is_active: bool
    is_onboarded: bool
    created_at: datetime


class UserUpdate(SQLModel):
    name: Optional[str] = None
    is_onboarded: Optional[bool] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v is None:
            return v
        return _validate_name(v)



# Log Model for tracking interactions
class Log(SQLModel, table=True):
    id: Optional[str] = Field(default=None, primary_key=True)
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id", index=True)
    connection_id: Optional[str] = Field(default=None, foreign_key="connection.id")
    type: str = Field(default="interaction")
    notes: str
    tags_json: str = Field(default="[]")
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    @property
    def tags(self) -> List[str]:
        return json.loads(self.tags_json)

    @tags.setter
    def tags(self, value: List[str]):
        self.tags_json = json.dumps(value)





class LogCreate(SQLModel):
    connection_id: Optional[str] = None
    type: str = "interaction"
    notes: str
    tags: List[str] = []
    created_at: Optional[datetime] = None  # Optional for backdating test data

    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Type cannot be empty")
        if len(v) > MAX_SHORT_FIELD:
            raise ValueError(f"Type must be {MAX_SHORT_FIELD} characters or fewer")
        return v

    @field_validator('notes')
    @classmethod
    def validate_notes(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Notes cannot be empty")
        if len(v) > MAX_LONG_FIELD:
            raise ValueError(f"Notes must be {MAX_LONG_FIELD} characters or fewer")
        return v

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        return _validate_tags(v)


class LogRead(SQLModel):
    id: str
    connection_id: Optional[str] = None
    type: str
    notes: str
    tags: List[str] = []
    created_at: datetime


# ===== Pagination response models =====

class PaginatedConnections(SQLModel):
    items: List[ConnectionRead] = []
    total: int
    limit: int
    offset: int

class PaginatedLogs(SQLModel):
    items: List[LogRead] = []
    total: int
    limit: int
    offset: int
