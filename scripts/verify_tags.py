import requests
import json
import sys

API_URL = "http://localhost:8000"

def test_tags():
    session = requests.Session()
    
    # Register/Get Token
    email = "tagtester@example.com"
    print(f"   Registering {email}...")
    reg_res = requests.post(f"{API_URL}/auth/register", json={"email": email, "name": "Tag Tester"})
    if reg_res.status_code == 201:
        token = reg_res.json()["token"]
        # Verify
        ver_res = requests.post(f"{API_URL}/auth/verify", json={"token": token})
        access_token = ver_res.json()["access_token"]
        session.headers.update({"Authorization": f"Bearer {access_token}"})
        print("   Logged in.")
    else:
        print("   Login failed.")
        return

    print("1. Fetching initial tags...")
    try:
        response = session.get(f"{API_URL}/tags/connection")
        response.raise_for_status()
        tags = response.json()
        print("   Success. Categories found:", list(tags.keys()))
    except Exception as e:
        print(f"   Failed to fetch tags: {e}")
        return

    print("\n2. Creating connection with custom tag 'Space Travel'...")
    new_connection = {
        "name": "Elon Musk",
        "tags": ["Space Travel", "Entrepreneur"], 
        "email": "elon@spacex.com"
    }

    try:
        res = session.post(f"{API_URL}/connections", json=new_connection)
        res.raise_for_status()
        print("   Connection created.")
    except Exception as e:
        print(f"   Failed to create connection: {e}")
        # print(f"   Response: {res.text}") # res might be undefined if exception
        return

    print("\n3. Fetching tags again to verify persistence...")
    try:
        response = session.get(f"{API_URL}/tags/connection")
        tags = response.json()
        
        # Check if 'Space Travel' is present.
        # It should be in 'custom' category or just present somewhere.
        found = False
        for cat, data in tags.items():
            if "Space Travel" in data["options"]:
                print(f"   FOUND 'Space Travel' in category '{cat}'")
                found = True
        
        if not found:
             print("   FAILED: 'Space Travel' not found in tags response.")
             print(json.dumps(tags, indent=2))
        else:
             print("   SUCCESS.")

    except Exception as e:
        print(f"   Failed to fetch tags: {e}")

if __name__ == "__main__":
    test_tags()
