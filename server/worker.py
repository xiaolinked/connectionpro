from celery import Celery
import os
import re
import json
import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery("worker", broker=REDIS_URL, backend=REDIS_URL)

@celery_app.task
def enrich_linkedin_task(url: str):
    ua = UserAgent()
    headers = {'User-Agent': ua.random}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return {"error": f"Failed to fetch profile: {response.status_code}"}
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        name = "Unknown"
        role = ""
        company = ""
        location = ""
        
        # Try to parse JSON-LD structured data (schema.org)
        json_ld_scripts = soup.find_all("script", type="application/ld+json")
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string)
                graph = data.get("@graph", [data])
                
                for item in graph:
                    if item.get("@type") == "Person":
                        # Name
                        name = item.get("name", name)
                        
                        # Location from address
                        address = item.get("address", {})
                        if isinstance(address, dict):
                            location = address.get("addressLocality", "")
                        
                        # Current job from worksFor (first entry is usually current)
                        works_for = item.get("worksFor", [])
                        if works_for and len(works_for) > 0:
                            current_job = works_for[0]
                            company = current_job.get("name", "")
                            job_location = current_job.get("location", "")
                            if job_location and not location:
                                location = job_location
                        
                        # Job titles (first is usually current)
                        job_titles = item.get("jobTitle", [])
                        if job_titles and len(job_titles) > 0:
                            # Filter out obfuscated titles (contain ***)
                            for title in job_titles:
                                if "***" not in title:
                                    role = title
                                    break
                        
                        break  # Found Person, done
            except (json.JSONDecodeError, TypeError):
                continue
        
        # Fallback to og:title if JSON-LD parsing failed
        if name == "Unknown":
            og_title = soup.find("meta", property="og:title")
            if og_title:
                content = og_title.get("content", "")
                main_part = content.split("|")[0].strip()
                parts = main_part.split(" - ", 1)
                name = parts[0].strip()
                
                if len(parts) > 1:
                    headline = parts[1].strip()
                    if " at " in headline:
                        role_company = headline.split(" at ", 1)
                        role = role_company[0].strip()
                        company = role_company[1].strip()
                    elif headline[0].isupper() and len(headline.split()) <= 4:
                        company = headline
                    else:
                        role = headline
        
        # Final fallback to URL parsing
        if name == "Unknown" or "Join LinkedIn" in name:
            slug = url.split('/')[-1] or url.split('/')[-2]
            name = slug.replace('-', ' ').title()
        
        return {
            "name": name,
            "role": role,
            "company": company,
            "location": location,
            "industry": ""
        }
        
    except Exception as e:
        print(f"Scraping error: {e}")
        slug = url.split('/')[-1] or url.split('/')[-2]
        name = slug.replace('-', ' ').title()
        return {
            "name": name,
            "role": "",
            "company": "",
            "location": "",
            "industry": ""
        }
