"""
Test script for authentication endpoints.

This script demonstrates how to:
1. Register a new user
2. Login to get an access token
3. Access protected endpoints with the token

Usage:
    python test_auth.py
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test the health check endpoint."""
    print("🔍 Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")


def test_register():
    """Test user registration."""
    print("📝 Testing user registration...")
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "securepassword123",
        "role": "member"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/register",
        json=user_data
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print(f"Response: {json.dumps(response.json(), indent=2)}\n")
        return True
    else:
        try:
            print(f"Error: {response.json()}\n")
        except requests.exceptions.JSONDecodeError:
            print(f"Error: {response.text}\n")
        return False


def test_login():
    """Test user login."""
    print("🔐 Testing user login...")
    login_data = {
        "email": "test@example.com",
        "password": "securepassword123"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json=login_data
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Access Token: {data['access_token'][:50]}...\n")
        return data['access_token']
    else:
        try:
            print(f"Error: {response.json()}\n")
        except requests.exceptions.JSONDecodeError:
            print(f"Error: {response.text}\n")
        return None


def test_get_me(access_token):
    """Test getting current user info."""
    print("👤 Testing get current user...")
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.get(
        f"{BASE_URL}/api/v1/auth/me",
        headers=headers
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}\n")
    else:
        try:
            print(f"Error: {response.json()}\n")
        except requests.exceptions.JSONDecodeError:
            print(f"Error: {response.text}\n")
        print(f"Error: {response.text}\n")



def main():
    """Run all tests."""
    print("=" * 60)
    print("🚀 Starting Authentication API Tests")
    print("=" * 60 + "\n")
    
    try:
        # Test health check
        test_health()
        
        # Test registration (might fail if user already exists)
        test_register()
        
        # Test login
        access_token = test_login()
        
        if access_token:
            # Test protected endpoint
            test_get_me(access_token)
        
        print("=" * 60)
        print("✅ All tests completed!")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the server.")
        print("Make sure the server is running on http://localhost:8000")
        print("Run: python run.py")


if __name__ == "__main__":
    main()
