import firebase_admin
from firebase_admin import credentials, auth
import os
from fastapi import HTTPException, status

# Initialize Firebase Admin SDK
# Expects service account json file at the path specified by FIREBASE_CREDENTIALS
# or checks default location "service-account.json" in server root
cred_path = os.getenv("FIREBASE_CREDENTIALS", "service-account.json")

if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
else:
    print(f"WARNING: Firebase service account file not found at {cred_path}. Auth will fail.")

def verify_firebase_token(token: str):
    try:
        decoded_token = auth.verify_id_token(token)
        
        # Enforce environment isolation
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        if not project_id:
             print("WARNING: FIREBASE_PROJECT_ID not set. Skipping audience check.")
        elif decoded_token.get("aud") != project_id:
             print(f"Error: Token audience {decoded_token.get('aud')} does not match expected Project ID {project_id}")
             return None
             
        return decoded_token
    except Exception as e:
        print(f"Error verifying token: {e}")
        return None
