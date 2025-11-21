import os
import requests
import json
from dotenv import load_dotenv

# Load environment
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key present: {bool(api_key)}")
print(f"API Key (first 10 chars): {api_key[:10] if api_key else 'None'}...")

if not api_key:
    print("ERROR: GEMINI_API_KEY not found in environment")
    exit(1)

# Test API call
url = f"https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key={api_key}"

payload = {
    "contents": [{
        "parts": [{
            "text": "Say 'Hello from Gemini!' in JSON format: {\"message\": \"...\"}"
        }]
    }]
}

print("\nTesting Gemini API...")
response = requests.post(
    url,
    headers={"Content-Type": "application/json"},
    json=payload,
    timeout=30
)

print(f"Status Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
