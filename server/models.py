from typing import Optional, List
from sqlmodel import Field, SQLModel
from datetime import datetime
import json

class User(SQLModel, table=True):
    id: Optional[str] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    name: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Connection(SQLModel, table=True):
    id: Optional[str] = Field(default=None, primary_key=True)
    user_id: Optional[str] = Field(default=None, foreign_key="user.id")
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

class UserCreate(SQLModel):
    email: str
    name: str

class UserRead(SQLModel):
    id: str
    email: str
    name: str
    is_active: bool
    created_at: datetime

class UserUpdate(SQLModel):
    name: Optional[str] = None


# Log Model for tracking interactions
class Log(SQLModel, table=True):
    id: Optional[str] = Field(default=None, primary_key=True)
    user_id: Optional[str] = Field(default=None, foreign_key="user.id")
    connection_id: Optional[str] = Field(default=None, foreign_key="connection.id")
    type: str = Field(default="interaction")
    notes: str
    tags_json: str = Field(default="[]")
    created_at: datetime = Field(default_factory=datetime.utcnow)

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


class LogRead(SQLModel):
    id: str
    connection_id: Optional[str] = None
    type: str
    notes: str
    tags: List[str] = []
    created_at: datetime

