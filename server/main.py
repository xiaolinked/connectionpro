from typing import List
from fastapi import FastAPI, HTTPException, Depends, status
from sqlmodel import Session, select
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables, get_session
from models import Connection, ConnectionCreate, ConnectionRead, ConnectionUpdate, Log, LogCreate, LogRead, User, UserCreate, UserRead, UserUpdate
import uuid
import datetime
import asyncio
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth_utils import create_access_token, create_magic_link_token, verify_magic_link_token, decode_access_token

app = FastAPI()

security = HTTPBearer()

async def get_current_user(
    auth: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
):
    payload = decode_access_token(auth.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user_id = payload.get("sub")
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
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

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# ===== AUTH ENDPOINTS =====

@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, session: Session = Depends(get_session)):
    email = user_data.email.lower().strip()
    # Check if user already exists
    statement = select(User).where(User.email == email)
    existing_user = session.exec(statement).first()
    
    if existing_user:
        user = existing_user
        # Update name if it was provided (optional but good for syncing)
        if user_data.name and user_data.name != user.name:
            user.name = user_data.name
            session.add(user)
            session.commit()
            session.refresh(user)
    else:
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            name=user_data.name
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    
    # Create magic link token
    token = create_magic_link_token(user.email)
    
    # Get frontend URL from environment (fallback to localhost for development)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    magic_link = f"{frontend_url}/verify?token={token}"
    print(f"MAGIC LINK FOR {user.email}: {magic_link}")
    
    return {"message": "Magic link generated", "magic_link": magic_link}

@app.get("/auth/check-email")
def check_email(email: str, session: Session = Depends(get_session)):
    statement = select(User).where(User.email == email.lower().strip())
    user = session.exec(statement).first()
    return {"exists": user is not None}

@app.post("/auth/verify")
def verify_token(token: str, session: Session = Depends(get_session)):
    email = verify_magic_link_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid or expired magic link")
    
    statement = select(User).where(User.email == email)
    user = session.exec(statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.get("/auth/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.put("/auth/me", response_model=UserRead)
def update_me(
    user_data: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    update_data = user_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

# ===== CONNECTION ENDPOINTS =====

@app.post("/connections", response_model=ConnectionRead, status_code=status.HTTP_201_CREATED)
def create_connection(
    connection: ConnectionCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
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

@app.get("/connections", response_model=List[ConnectionRead])
def get_connections(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Connection).where(Connection.user_id == current_user.id)
    connections = session.exec(statement).all()
    return connections

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
    if log.connection_id:
        statement = select(Connection).where(
            Connection.id == log.connection_id, 
            Connection.user_id == current_user.id
        )
        if not session.exec(statement).first():
            raise HTTPException(status_code=403, detail="Not authorized for this connection")

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
    session.commit()
    session.refresh(db_log)
    return db_log

@app.get("/logs", response_model=List[LogRead])
def get_logs(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Log).where(Log.user_id == current_user.id).order_by(Log.created_at.desc())
    logs = session.exec(statement).all()
    return logs

@app.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(
    log_id: str, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    log = session.get(Log, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    # If log is linked to a connection, verify ownership
    if log.connection_id:
        statement = select(Connection).where(
            Connection.id == log.connection_id, 
            Connection.user_id == current_user.id
        )
        if not session.exec(statement).first():
            raise HTTPException(status_code=403, detail="Not authorized for this log")
            
    session.delete(log)
    session.commit()


# ===== ENRICHMENT ENDPOINTS =====

from worker import enrich_linkedin_task
from celery.result import AsyncResult

@app.post("/enrich")
async def enrich_linkedin(linkedin_url: str):
    task = enrich_linkedin_task.delay(linkedin_url)
    return {"task_id": task.id}

@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    task_result = AsyncResult(task_id, app=enrich_linkedin_task.app)
    if task_result.state == 'PENDING':
         return {"status": "Pending"}
    elif task_result.state == 'SUCCESS':
         return {"status": "Success", "data": task_result.result}
    elif task_result.state == 'FAILURE':
         return {"status": "Failure", "error": str(task_result.result)}
    else:
         return {"status": task_result.state}
