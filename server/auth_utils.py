import os
from datetime import datetime, timedelta
from typing import Optional, Union
import jwt
from jwt.exceptions import InvalidTokenError

# Use a consistent secret for the environment
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-it-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week
MAGIC_LINK_EXPIRE_MINUTES = 15

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload if payload.get("exp") >= datetime.utcnow().timestamp() else None
    except InvalidTokenError:
        return None

def create_magic_link_token(email: str):
    expire = datetime.utcnow() + timedelta(minutes=MAGIC_LINK_EXPIRE_MINUTES)
    to_encode = {"sub": email, "exp": expire, "type": "magic_link"}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_magic_link_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "magic_link":
            return None
        return payload.get("sub")
    except InvalidTokenError:
        return None
