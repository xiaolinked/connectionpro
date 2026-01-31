import requests
import random
import datetime
import uuid
import sys
import time
import os

# Configuration
API_URL = "http://localhost:8000"

# --- Data Pools (Realistic Data) ---

FIRST_NAMES = [
    "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", 
    "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", 
    "Matthew", "Margaret", "Anthony", "Betty", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Dorothy", "Paul", "Kimberly", "Andrew", "Emily", "Joshua", "Donna",
    "Kenneth", "Michelle", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell"
]

CITIES = [
    "New York, NY", "San Francisco, CA", "Austin, TX", "London, UK", "Berlin, Germany", 
    "Tokyo, Japan", "Singapore", "Toronto, Canada", "Sydney, Australia", "Paris, France", 
    "Amsterdam, Netherlands", "Chicago, IL", "Boston, MA", "Seattle, WA", "Los Angeles, CA"
]

COMPANIES = [
    "TechCorp", "StartupInc", "DesignCo", "InnovateLtd", "FutureSystems", 
    "Global Dynamics", "Acme Corp", "Omni Consumer", "Cyberdyne", "Soylent Corp",
    "Umbrella Corp", "Stark Ind", "Wayne Ent", "Massive Dynamic", "Hooli",
    "Initech", "Pied Piper", "Aperture Science", "Black Mesa", "Tessier-Ashpool"
]

ROLES = [
    "Chief Technology Officer", "Chief Executive Officer", "Senior Software Engineer", 
    "Product Manager", "Lead Designer", "Marketing Director", "VP of Sales", 
    "Founder", "Talent Acquisition Manager", "Management Consultant", 
    "Data Scientist", "DevOps Engineer", "Project Manager", "Head of Product",
    "Creative Director", "Investment Partner", "Angel Investor"
]

INDUSTRIES = [
    "Technology", "Finance", "Healthcare", "Education", "Retail", 
    "Media", "Real Estate", "Automotive", "Energy", "Consulting"
]

# --- New Tag Categories ---

TAG_CATEGORIES = {
    "howMet": ['Conference', 'LinkedIn', 'Warm Intro', 'Cold Outreach', 'Work', 'School', 'Meetup', 'Social Event', 'Online Community', 'Alumni'],
    "relationshipType": ['Colleague', 'Client', 'Partner', 'Mentor', 'Mentee', 'Friend', 'Acquaintance', 'Advisor', 'Investor', 'Vendor'],
    "connectionStrength": ['Inner Circle', 'Close', 'Familiar', 'Dormant', 'New'],
    "goals": ['Career Growth', 'Business Lead', 'Knowledge Share', 'Collaboration', 'Referral', 'Friendship', 'Industry Intel']
}

CUSTOM_TAGS_POOL = [
    "tennis", "hiking", "crypto", "ai-enthusiast", "stanford-alum", "ex-google", 
    "angel-investor", "hiring-manager", "series-a", "coffee-lover", "book-club", "speaker"
]

LOG_TYPES = ["call", "email", "meeting", "social"]

LOG_TEMPLATES = {
    "call": [
        "Catch-up call about {topic}.",
        "Discussed {topic} over the phone.",
        "Quick sync regarding {topic}.",
        "Call to finalize {topic} details."
    ],
    "email": [
        "Sent details about {topic}.",
        "Followed up via email regarding {topic}.",
        "Received update on {topic}.",
        "Shared documents for {topic}."
    ],
    "meeting": [
        "Met for coffee to discuss {topic}.",
        "Lunch meeting: talked about {topic}.",
        "Board meeting covering {topic}.",
        "Strategy session on {topic}."
    ],
    "social": [
        "Chatted on LinkedIn about {topic}.",
        "Replied to their tweet about {topic}.",
        "Saw them at the mixer, briefly mentioned {topic}.",
        "DMed regarding {topic}."
    ]
}

TOPICS = [
    "potential partnership", "open hiring roles", "Q3 roadmap goals", "seed investment round", 
    "new project launch", "mutual referral", "market trends", "upcoming conference", 
    "tech stack migration", "team expansion", "contract renewal", "product feedback"
]

# --- Generators ---

def generate_random_date(days_back_min=0, days_back_max=365):
    days_back = random.randint(days_back_min, days_back_max)
    date = datetime.datetime.now() - datetime.timedelta(days=days_back)
    # Add random time
    return date.replace(
        hour=random.randint(9, 18), 
        minute=random.randint(0, 59), 
        second=random.randint(0, 59)
    ).isoformat() + "Z"

def generate_connection():
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    company = random.choice(COMPANIES)
    
    email = f"{first.lower()}.{last.lower()}@{company.lower().replace(' ', '')}.com"
    
    # Generate Tags intelligently
    tags = []
    
    # 1. How Met (Pick 1)
    how_met = random.choice(TAG_CATEGORIES["howMet"])
    tags.append(how_met)
    
    # 2. Relationship Type (Pick 1-2)
    rel_type = random.sample(TAG_CATEGORIES["relationshipType"], random.randint(1, 2))
    tags.extend(rel_type)
    
    # 3. Connection Strength (Pick 1)
    strength = random.choice(TAG_CATEGORIES["connectionStrength"])
    tags.append(strength)
    
    # 4. Goals (Pick 0-2)
    goals_tags = random.sample(TAG_CATEGORIES["goals"], random.randint(0, 2))
    tags.extend(goals_tags)
    
    # 5. Custom Tags (Pick 0-1)
    if random.random() > 0.7:
        tags.append(random.choice(CUSTOM_TAGS_POOL))
    
    return {
        "name": f"{first} {last}",
        "email": email,
        "company": company,
        "role": random.choice(ROLES),
        "location": random.choice(CITIES),
        "industry": random.choice(INDUSTRIES),
        "howMet": how_met, # For backward compatibility or if backend uses it separately
        "frequency": random.choice([7, 14, 30, 60, 90]),
        "notes": f"Generated testing connection. Key interest: {random.choice(TOPICS)}.",
        "linkedin": f"https://linkedin.com/in/{first.lower()}-{last.lower()}-{random.randint(100, 999)}",
        "goals": f"Explore {random.choice(TOPICS)} opportunities.",
        "tags": tags
    }

def generate_log(connection_id, date_str):
    log_type = random.choice(LOG_TYPES)
    topic = random.choice(TOPICS)
    template = random.choice(LOG_TEMPLATES[log_type])
    note = template.format(topic=topic)
    
    return {
        "connection_id": connection_id,
        "type": log_type,
        "notes": note,
        "tags": [], # Simplified for logs
        "created_at": date_str
    }

# --- Main Logic ---

def register_and_login(name, email):
    print(f"Registering {email}...")
    api_key = os.getenv("FIREBASE_API_KEY")
    if not api_key:
        print("Error: FIREBASE_API_KEY environment variable not set.")
        print("Please run with: FIREBASE_API_KEY=... python scripts/seed_data.py")
        sys.exit(1)

    try:
        # 1. Create User in Firebase directly via REST API
        # This requires the Web API Key
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={api_key}"
        payload = {
            "email": email,
            "password": "TemporaryPassword123!",
            "returnSecureToken": True
        }
        
        res = requests.post(url, json=payload)
        res.raise_for_status()
        
        firebase_data = res.json()
        id_token = firebase_data["idToken"]
        local_id = firebase_data["localId"]
        
        print(f"  Created Firebase User: {local_id}")
        
        # 2. Login to Backend to sync user
        login_payload = {"token": id_token}
        login_res = requests.post(f"{API_URL}/auth/login", json=login_payload)
        login_res.raise_for_status()
        
        print(f"  Synced with Backend.")
        
        return id_token
        
    except Exception as e:
        print(f"Error registering: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Response: {e.response.text}")
        sys.exit(1)

def main():
    print("=== ConnectionPro Data Seeder ===")
    
    # 1. Create Account
    rand_id = random.randint(1000, 9999)
    email = f"testUser{rand_id}@example.com"
    name = f"Test User {rand_id}"
    
    token = register_and_login(name, email)
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Logged in. Token: {token[:20]}...")
    
    # 2. Create connections
    print("Generating 100 connections...")
    
    created_connections = []
    
    for i in range(100):
        c_data = generate_connection()
        try:
            res = requests.post(f"{API_URL}/connections", json=c_data, headers=headers)
            res.raise_for_status()
            conn = res.json()
            created_connections.append(conn)
            if i % 10 == 0:
                print(f"  Created {i+1}/100 connections...")
        except Exception as e:
            print(f"  Failed to create connection {i}: {e}")
            
    print(f"Successfully created {len(created_connections)} connections.")
    
    # 3. Add logs to 50+ connections
    selected_conns = random.sample(created_connections, k=60)
    print(f"Generating logs for {len(selected_conns)} connections...")
    
    for i, conn in enumerate(selected_conns):
        num_logs = int(random.gauss(10, 5))
        num_logs = max(1, min(30, num_logs))
        
        log_dates = []
        for _ in range(num_logs):
            days_back = random.randint(0, 180)
            log_date = datetime.datetime.now() - datetime.timedelta(days=days_back)
            log_date = log_date.replace(
                hour=random.randint(9, 18), 
                minute=random.randint(0, 59), 
                second=random.randint(0, 59)
            )
            log_dates.append(log_date)
        
        log_dates.sort()
        
        most_recent_date = None
        for log_date in log_dates:
            log_date_str = log_date.isoformat() + "Z"
            log_data = generate_log(conn["id"], log_date_str)
            try:
                res = requests.post(f"{API_URL}/logs", json=log_data, headers=headers)
                res.raise_for_status()
                most_recent_date = log_date
            except Exception as e:
                print(f"Error adding log for {conn['name']}: {e}")
        
        if most_recent_date:
            update_payload = {
                "lastContact": most_recent_date.isoformat() + "Z"
            }
            try:
                requests.put(f"{API_URL}/connections/{conn['id']}", json=update_payload, headers=headers)
            except Exception as e:
                print(f"Error updating lastContact: {e}")
            
        if i % 10 == 0:
            print(f"  Processed logs for {i+1}/{len(selected_conns)} connections...")

    print("=== Seeding Complete ===")
    print(f"Account Email: {email}")
    print("You can verify using the magic link printed above or just check dashboard.")

if __name__ == "__main__":
    main()
