import requests
import random
import datetime
import uuid
import sys
import time

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
    "Umbrella Corp", "Stark Ind", "Wayne Ent", "Massive Dynamic", "Hooli"
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

HOW_MET = [
    "Tech Conference 2024", "LinkedIn", "Mutual Friend (Sarah)", "Former Colleague", 
    "College Roommate", "Twitter/X", "Cold Email", "Industry Meetup", "Y Combinator Demo Day",
    "Local Coffee Shop", "Hackathon"
]

TAGS_POOL = [
    "vip", "hiring", "mentor", "investor", "friend", "lead", "partner", "urgent", 
    "warm", "tech", "founder", "local", "alumni", "recruiter", "gatekeeper"
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
    
    # Email generation
    email = f"{first.lower()}.{last.lower()}@{company.lower().replace(' ', '')}.com"
    
    # Tags (1-3 random tags)
    num_tags = random.randint(0, 3)
    tags = random.sample(TAGS_POOL, num_tags)
    
    return {
        "name": f"{first} {last}",
        "email": email,
        "company": company,
        "role": random.choice(ROLES),
        "location": random.choice(CITIES),
        "industry": random.choice(INDUSTRIES),
        "howMet": random.choice(HOW_MET),
        "frequency": random.choice([7, 14, 30, 60, 90]),
        "notes": f"Generated testing connection. Key interest: {random.choice(TOPICS)}.",
        "linkedin": f"https://linkedin.com/in/{first.lower()}-{last.lower()}-{random.randint(100, 999)}",
        "goals": f"Explore {random.choice(TOPICS)} opportunities.",
        "tags": tags
        # lastContact will be updated if logs are added, or set randomly later
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
        "tags": random.sample(TAGS_POOL, random.randint(0, 2)),
        "created_at": date_str  # Pass the date for backdating
    }

# --- Main Logic ---

def register_and_login(name, email):
    print(f"Registering {email}...")
    try:
        # 1. Register
        reg_payload = {"email": email, "name": name}
        res = requests.post(f"{API_URL}/auth/register", json=reg_payload)
        res.raise_for_status()
        data = res.json()
        magic_link = data["magic_link"]
        print(f"  Got magic link: {magic_link}")
        
        # 2. Extract Token
        # Link format: ...verify?token=XYZ
        token = magic_link.split("token=")[1]
        
        # 3. Verify
        verify_payload = {"token": token} # Actually verify endpoint takes query param? No, body? 
        # Checking server/main.py: @app.post("/auth/verify") def verify_token(token: str ...
        # It takes `token` as a QUERY PARAMETER based on `token: str` default binding in FastAPI 
        # usually defaults to query if simple type, OR body if Pydantic model.
        # Wait, `token: str` matches query param `?token=...`.
        # Let's try query param.
        
        verify_res = requests.post(f"{API_URL}/auth/verify?token={token}")
        verify_res.raise_for_status()
        verify_data = verify_res.json()
        return verify_data["access_token"]
        
    except Exception as e:
        print(f"Error registering: {e}")
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
    # Shuffle and pick 60
    selected_conns = random.sample(created_connections, k=60)
    print(f"Generating logs for {len(selected_conns)} connections...")
    
    for i, conn in enumerate(selected_conns):
        # Normal distribution for num logs: mean 10, sigma 5, clamped 1-30
        num_logs = int(random.gauss(10, 5))
        num_logs = max(1, min(30, num_logs))
        
        # Generate dates spread over last 180 days, sorted chronologically
        log_dates = []
        for _ in range(num_logs):
            days_back = random.randint(0, 180)
            log_date = datetime.datetime.now() - datetime.timedelta(days=days_back)
            # Add random time
            log_date = log_date.replace(
                hour=random.randint(9, 18), 
                minute=random.randint(0, 59), 
                second=random.randint(0, 59)
            )
            log_dates.append(log_date)
        
        # Sort chronologically (oldest first)
        log_dates.sort()
        
        # Create logs with their respective dates
        most_recent_date = None
        for log_date in log_dates:
            log_date_str = log_date.isoformat() + "Z"
            log_data = generate_log(conn["id"], log_date_str)
            try:
                requests.post(f"{API_URL}/logs", json=log_data, headers=headers)
                most_recent_date = log_date
            except Exception as e:
                print(f"Error adding log: {e}")
        
        # Update connection lastContact to the most recent log date
        if most_recent_date:
            update_payload = {
                "lastContact": most_recent_date.isoformat() + "Z"
            }
        else:
            # Fallback: set random last contact
            frequency = conn["frequency"]
            status_roll = random.random()
            
            if status_roll < 0.2: 
                # 20% Overdue (days back > frequency)
                days_back = random.randint(frequency + 1, frequency + 60)
            elif status_roll < 0.4:
                # 20% Due Soon (days back close to frequency)
                days_back = random.randint(max(1, frequency - 7), frequency - 1)
            else:
                # 60% Healthy (days back < frequency - 7)
                days_back = random.randint(0, max(1, frequency - 8))
                
            last_contact_date = datetime.datetime.now() - datetime.timedelta(days=days_back)
            update_payload = {
                "lastContact": last_contact_date.isoformat() + "Z"
            }
        
        try:
            requests.put(f"{API_URL}/connections/{conn['id']}", json=update_payload, headers=headers)
        except Exception as e:
            print(f"Error updating lastContact: {e}")
            
        if i % 10 == 0:
            print(f"  Processed logs for {i+1}/{len(selected_conns)} connections...")

    print("=== Seeding Complete ===")
    print(f"Account Email: {email}")
    print("You can verify using the magic link printed above (if you grabbed the token logic correctly) or just check dashboard.")

if __name__ == "__main__":
    main()
