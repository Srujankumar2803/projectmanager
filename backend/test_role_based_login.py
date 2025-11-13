"""
Test script for role-based login functionality
Tests admin login, manager login with secret code, and normal user login
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_login(email, password, secret_code=None, expected_role=None):
    """Test login and verify role assignment"""
    print(f"\n{'='*60}")
    print(f"Testing login for: {email}")
    if secret_code:
        print(f"Secret code: {secret_code}")
    print(f"Expected role: {expected_role}")
    print('='*60)
    
    # Prepare login data
    login_data = {
        "email": email,
        "password": password
    }
    
    if secret_code:
        login_data["secret_code"] = secret_code
    
    try:
        # Login
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Login status code: {response.status_code}")
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            print(f"✓ Login successful! Token received.")
            
            # Get user info
            headers = {"Authorization": f"Bearer {token}"}
            me_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
            
            if me_response.status_code == 200:
                user_data = me_response.json()
                print(f"\nUser Info:")
                print(f"  Username: {user_data['username']}")
                print(f"  Email: {user_data['email']}")
                print(f"  Role: {user_data['role']}")
                print(f"  ID: {user_data['id']}")
                
                # Verify role
                if expected_role and user_data['role'] == expected_role:
                    print(f"\n✓ Role verification PASSED: Expected {expected_role}, got {user_data['role']}")
                elif expected_role:
                    print(f"\n✗ Role verification FAILED: Expected {expected_role}, got {user_data['role']}")
                
                return True, user_data
            else:
                print(f"✗ Failed to get user info: {me_response.text}")
                return False, None
        else:
            print(f"✗ Login failed: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return False, None

def main():
    print("\n" + "="*60)
    print("ROLE-BASED LOGIN TESTING")
    print("="*60)
    
    # Test 1: Admin login (fixed email)
    print("\n\n### TEST 1: Admin Login ###")
    test_login(
        email="admin@example.com",
        password="admin123",
        expected_role="admin"
    )
    
    # Test 2: Manager login with secret code
    print("\n\n### TEST 2: Manager Login (with secret code) ###")
    test_login(
        email="user@example.com",
        password="user123",
        secret_code="manager",
        expected_role="manager"
    )
    
    # Test 3: Normal user login (no secret code)
    print("\n\n### TEST 3: Normal User Login (no secret code) ###")
    test_login(
        email="alice@example.com",
        password="alice123",
        expected_role="member"
    )
    
    # Test 4: Manager stays manager on subsequent login with code
    print("\n\n### TEST 4: Manager Login Again (verify persistence) ###")
    test_login(
        email="user@example.com",
        password="user123",
        secret_code="manager",
        expected_role="manager"
    )
    
    # Test 5: Wrong secret code (should remain member)
    print("\n\n### TEST 5: Login with Wrong Secret Code ###")
    test_login(
        email="bob@example.com",
        password="bob123",
        secret_code="wrong_code",
        expected_role="member"
    )
    
    print("\n\n" + "="*60)
    print("TESTING COMPLETE")
    print("="*60)
    
    print("\n\nFrontend Dashboard URLs:")
    print("  Admin:   http://localhost:3000/admin/dashboard")
    print("  Manager: http://localhost:3000/manager/dashboard")
    print("  User:    http://localhost:3000/user/dashboard")
    print("\nLogin page: http://localhost:3000/login")

if __name__ == "__main__":
    main()
