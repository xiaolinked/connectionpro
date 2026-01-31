from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, Depends, status, Query, Request
from sqlmodel import Session, select, func
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables, get_session, engine
from models import (
    Connection, ConnectionCreate, ConnectionRead, ConnectionUpdate,
    Log, LogCreate, LogRead,
    User, UserCreate, UserRead, UserUpdate,
    PaginatedConnections, PaginatedLogs,
    TagDefinition
)
import uuid
import datetime
import asyncio
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_auth import verify_firebase_token



# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

security = HTTPBearer()


async def get_current_user(
    auth: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
):
    token = auth.credentials
    decoded_token = verify_firebase_token(token)
    
    if not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
        
    uid = decoded_token.get("uid")
    # Lookup user by firebase_uid, not primary key
    statement = select(User).where(User.firebase_uid == uid)
    user = session.exec(statement).first()
    
    # If user doesn't exist in our DB yet, but has valid Firebase token,
    # we could auto-create OR reject. 
    # For safety/explicit flow, we reject and expect /auth/login to be called first.
    if not user:
        raise HTTPException(status_code=404, detail="User not found in database")
        
    return user


# CORS Setup
import os
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Add production frontend URL from environment variable
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== TAGS MANAGEMENT =====

STANDARD_TAGS = {
    "connection": {
        "howMet": ['Conference', 'LinkedIn', 'Warm Intro', 'Cold Outreach', 'Work', 'School', 'Meetup', 'Social Event', 'Online Community', 'Alumni'],
        "relationshipType": ['Colleague', 'Client', 'Partner', 'Mentor', 'Mentee', 'Friend', 'Acquaintance', 'Advisor', 'Investor', 'Vendor'],
        "connectionStrength": ['Inner Circle', 'Close', 'Familiar', 'Dormant', 'New'],
        "goals": ['Career Growth', 'Business Lead', 'Knowledge Share', 'Collaboration', 'Referral', 'Friendship', 'Industry Intel']
    },
    "interaction": {
        "interactionType": ["Call", "Coffee Chat", "Email", "Meeting", "Social", "Text", "Video Call", "Lunch", "Dinner", "Event"]
    }
}

def seed_tags(session: Session):
    for tag_type, categories in STANDARD_TAGS.items():
        for category, names in categories.items():
            for name in names:
                stmt = select(TagDefinition).where(
                    TagDefinition.type == tag_type,
                    TagDefinition.category == category,
                    TagDefinition.name == name
                )
                existing = session.exec(stmt).first()
                if not existing:
                    tag = TagDefinition(
                        type=tag_type,
                        category=category,
                        name=name,
                        is_custom=False
                    )
                    session.add(tag)
    session.commit()

def ensure_custom_tags(session: Session, tags: List[str], tag_type: str):
    """
    Check if any of the provided tags are NOT in the standard list.
    If they are new, insert them as custom tags.
    """
    if not tags:
        return

    # Flatten standard tags for quick lookup
    standard_names = set()
    for cat, names in STANDARD_TAGS.get(tag_type, {}).items():
         standard_names.update(names)

    # Note: We also need to check existing CUSTOM tags in DB to avoid dupes
    # But since we are iterating list, we can just check existence.
    
    for tag in tags:
        if tag not in standard_names:
            # Check if already exists in DB as custom or standard (names are unique-ish?)
            # Actually, standard tags are in DB too now.
            # So simpler: just check DB.
            stmt = select(TagDefinition).where(
                TagDefinition.type == tag_type,
                TagDefinition.name == tag
            )
            existing = session.exec(stmt).first()
            if not existing:
                # Insert as custom
                new_tag = TagDefinition(
                    type=tag_type,
                    category="custom",
                    name=tag,
                    is_custom=True
                )
                session.add(new_tag)
    session.commit()

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    with Session(engine) as session:
        seed_tags(session)

# ===== AUTH ENDPOINTS =====

@app.post("/auth/login")
@limiter.limit("5/minute")
def login(request: Request, body: dict, session: Session = Depends(get_session)):
    """
    Verifies Firebase token and syncs user to local database.
    Call this after Firebase login on the client.
    """
    token = body.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")
    
    decoded_token = verify_firebase_token(token)
    if not decoded_token:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    uid = decoded_token.get("uid")
    email = decoded_token.get("email")
    phone_number = decoded_token.get("phone_number")
    
    # Fallback name if missing (e.g. phone auth)
    name = decoded_token.get("name")
    if not name:
        if email:
            name = email.split("@")[0]
        elif phone_number:
            name = phone_number
        else:
            name = "User"
    
    
    # Check if user exists by firebase_uid
    statement = select(User).where(User.firebase_uid == uid)
    user = session.exec(statement).first()
    
    if user:
        # Update fields if changed
        if email and user.email != email:
            user.email = email
        if phone_number and user.phone_number != phone_number:
            user.phone_number = phone_number
        if name and user.name != name and user.name == "User": 
             # Only auto-update name if it was generic "User"
             # Or maybe we rely on frontend Onboarding to set real name?
             pass
        session.add(user)
    else:
        # Create new user
        # New users are not onboarded by default (model default=False)
        user = User(
            firebase_uid=uid,
            email=email,
            phone_number=phone_number,
            name=name
        )
        session.add(user)
        
    session.commit()
    session.refresh(user)
    
    return {"message": "Login successful", "user": user}



@app.get("/users/me", response_model=UserRead)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.put("/users/me", response_model=UserRead)
def update_user_me(
    user_update: UserUpdate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.is_onboarded is not None:
        current_user.is_onboarded = user_update.is_onboarded
    
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

@app.delete("/users/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_me(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Permanently delete the current user's account and all associated data."""
    # Delete all user's logs first (query by user_id directly)
    logs = session.exec(
        select(Log).where(Log.user_id == current_user.id)
    ).all()
    for log in logs:
        session.delete(log)
    
    # Delete all user's connections
    connections = session.exec(
        select(Connection).where(Connection.user_id == current_user.id)
    ).all()
    for connection in connections:
        session.delete(connection)
    
    # Delete the user
    session.delete(current_user)
    session.commit()
    
    return None


# ===== CONNECTION ENDPOINTS =====

@app.post("/connections", response_model=ConnectionRead, status_code=status.HTTP_201_CREATED)
def create_connection(
    connection: ConnectionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Ensure custom tags are saved
    ensure_custom_tags(session, connection.tags, 'connection')

    db_connection = Connection.from_orm(connection)
    db_connection.id = str(uuid.uuid4())
    db_connection.user_id = current_user.id
    db_connection.created_at = datetime.datetime.utcnow()
    # Handle tags manual serialization
    db_connection.tags = connection.tags

    session.add(db_connection)
    session.commit()
    session.refresh(db_connection)
    return db_connection

@app.get("/connections")
def get_connections(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    # Count total
    count_statement = select(func.count()).select_from(Connection).where(Connection.user_id == current_user.id)
    total = session.exec(count_statement).one()

    # Fetch page
    statement = (
        select(Connection)
        .where(Connection.user_id == current_user.id)
        .offset(offset)
        .limit(limit)
    )
    connections = session.exec(statement).all()

    return PaginatedConnections(
        items=connections,
        total=total,
        limit=limit,
        offset=offset,
    )

@app.get("/connections/{connection_id}", response_model=ConnectionRead)
def get_connection(
    connection_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Connection).where(
        Connection.id == connection_id,
        Connection.user_id == current_user.id
    )
    connection = session.exec(statement).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    return connection

@app.put("/connections/{connection_id}", response_model=ConnectionRead)
def update_connection(
    connection_id: str,
    connection: ConnectionUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Connection).where(
        Connection.id == connection_id,
        Connection.user_id == current_user.id
    )
    db_connection = session.exec(statement).first()
    if not db_connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    connection_data = connection.dict(exclude_unset=True)
    
    # Handle custom tags
    if 'tags' in connection_data:
        ensure_custom_tags(session, connection_data['tags'], 'connection')

    for key, value in connection_data.items():
        if key == 'tags':
             db_connection.tags = value
        else:
             setattr(db_connection, key, value)

    session.add(db_connection)
    session.commit()
    session.refresh(db_connection)
    return db_connection

@app.delete("/connections/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_connection(
    connection_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Connection).where(
        Connection.id == connection_id,
        Connection.user_id == current_user.id
    )
    connection = session.exec(statement).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    session.delete(connection)
    session.commit()


# ===== LOG ENDPOINTS =====

@app.post("/logs", response_model=LogRead, status_code=status.HTTP_201_CREATED)
def create_log(
    log: LogCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify connection belongs to user if provided
    connection = None
    if log.connection_id:
        statement = select(Connection).where(
            Connection.id == log.connection_id,
            Connection.user_id == current_user.id
        )
        connection = session.exec(statement).first()
        if not connection:
            raise HTTPException(status_code=403, detail="Not authorized for this connection")

    # Ensure custom tags (interaction type)
    ensure_custom_tags(session, log.tags, 'interaction')

    db_log = Log(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        connection_id=log.connection_id,
        type=log.type,
        notes=log.notes,
        created_at=log.created_at if log.created_at else datetime.datetime.utcnow()
    )
    db_log.tags = log.tags

    session.add(db_log)
    
    # Update connection's lastContact if this log is more recent
    if connection:
        # Normalize datetimes for comparison (strip timezone info)
        log_created = db_log.created_at.replace(tzinfo=None) if db_log.created_at else None
        last_contact = connection.lastContact.replace(tzinfo=None) if connection.lastContact else None
        
        if not last_contact or (log_created and log_created > last_contact):
            connection.lastContact = db_log.created_at
            session.add(connection)
    
    session.commit()
    session.refresh(db_log)
    return db_log

@app.get("/logs")
def get_logs(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    connection_id: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    # Build base query with user filter
    base_filter = Log.user_id == current_user.id
    if connection_id:
        base_filter = base_filter & (Log.connection_id == connection_id)
    
    # Count total
    count_statement = select(func.count()).select_from(Log).where(base_filter)
    total = session.exec(count_statement).one()

    # Fetch page
    statement = (
        select(Log)
        .where(base_filter)
        .order_by(Log.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    logs = session.exec(statement).all()

    return PaginatedLogs(
        items=logs,
        total=total,
        limit=limit,
        offset=offset,
    )

@app.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(
    log_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    log = session.get(Log, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    # If log is linked to a connection, verify ownership and get connection for lastContact update
    connection = None
    if log.connection_id:
        statement = select(Connection).where(
            Connection.id == log.connection_id,
            Connection.user_id == current_user.id
        )
        connection = session.exec(statement).first()
        if not connection:
            raise HTTPException(status_code=403, detail="Not authorized for this log")

    # Store connection_id before deleting
    connection_id = log.connection_id
    
    session.delete(log)
    
    # Recalculate lastContact from remaining logs
    if connection and connection_id:
        # Find the most recent log for this connection (excluding the one we just deleted)
        max_date_result = session.exec(
            select(func.max(Log.created_at))
            .where(Log.connection_id == connection_id)
        ).first()
        
        connection.lastContact = max_date_result  # Will be None if no logs remain
        session.add(connection)
    
    session.commit()


# ===== TAGS ENDPOINTS =====

@app.get("/tags/{tag_type}")
def get_tags(
    tag_type: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get all tags for a specific type (connection or interaction).
    Returns a dictionary of categories with their tags.
    """
    if tag_type not in ["connection", "interaction"]:
        raise HTTPException(status_code=400, detail="Invalid tag type")
    
    # Get standard tags + custom tags
    # Actually, all tags are in the DB now. 
    # Just query by type.
    
    stmt = select(TagDefinition).where(TagDefinition.type == tag_type)
    tags = session.exec(stmt).all()
    
    # Organize by category
    result = {}
    
    # Initialize standard categories to ensure they exist in response structure if needed,
    # or just let the DB drive it. 
    # Frontend likely expects specific keys for the UI structure.
    # So we should group them.
    
    for tag in tags:
        cat = tag.category
        if cat not in result:
            config = _get_category_config(cat)
            result[cat] = {
                "label": config["label"],
                "singleSelect": config["singleSelect"],
                "options": []
            }
        result[cat]["options"].append(tag.name)
        
    return result

def _get_category_config(category: str) -> Dict:
    # simple mapping for display labels and behavior
    configs = {
        "howMet": {"label": "🤝 How did you meet?", "singleSelect": True},
        "relationshipType": {"label": "👥 Relationship type", "singleSelect": False},
        "connectionStrength": {"label": "⭐ Connection strength", "singleSelect": True},
        "goals": {"label": "🎯 Goals for this connection", "singleSelect": False},
        "interactionType": {"label": "📞 Interaction Type", "singleSelect": True},
        "custom": {"label": "⚡ Custom / Other", "singleSelect": False}
    }
    return configs.get(category, {"label": category.title(), "singleSelect": False})

# ===== ENRICHMENT ENDPOINTS =====

from worker import enrich_linkedin_task
from celery.result import AsyncResult

@app.post("/enrich")
async def enrich_linkedin(
    linkedin_url: str,
    current_user: User = Depends(get_current_user),
):
    task = enrich_linkedin_task.delay(linkedin_url)
    return {"task_id": task.id}

@app.get("/tasks/{task_id}")
async def get_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    task_result = AsyncResult(task_id, app=enrich_linkedin_task.app)
    if task_result.state == 'PENDING':
         return {"status": "Pending"}
    elif task_result.state == 'SUCCESS':
         return {"status": "Success", "data": task_result.result}
    elif task_result.state == 'FAILURE':
         return {"status": "Failure", "error": str(task_result.result)}
    else:
         return {"status": task_result.state}
