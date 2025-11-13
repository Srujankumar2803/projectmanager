"""
Test auto-registration feature - random users can login with any email/password
"""
import requests
import random
import string

BASE_URL = "http://localhost:8000/api/v1"

def random_email():
    """Generate a random email"""
    name = ''.join(random.choices(string.ascii_lowercase, k=8))
    return f"{name}@example.com"

def test_auto_registration():
    """Test that random users can login and accounts are created automatically"""
    print("\n" + "="*60)
    print("AUTO-REGISTRATION TESTING")
    print("="*60)
    
    # Test 1: Random user login (should auto-create account)
    print("\n### TEST 1: Random User Login (Auto-Create Account) ###")
    email1 = random_email()
    password1 = "mypassword123"
    
    print(f"\nAttempting login with:")
    print(f"  Email: {email1}")
    print(f"  Password: {password1}")
    
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email1,
        "password": password1
    })
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"✓ Login successful! Account created automatically.")
        
        # Get user info
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        
        if me_response.status_code == 200:
            user = me_response.json()
            print(f"\nUser Info:")
            print(f"  Username: {user['username']}")
            print(f"  Email: {user['email']}")
            print(f"  Role: {user['role']}")
            print(f"  ID: {user['id']}")
    else:
        print(f"✗ Login failed: {response.text}")
    
    # Test 2: Login again with same credentials (should work)
    print("\n\n### TEST 2: Login Again with Same Credentials ###")
    print(f"  Email: {email1}")
    print(f"  Password: {password1}")
    
    response2 = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email1,
        "password": password1
    })
    
    if response2.status_code == 200:
        print("✓ Subsequent login successful!")
    else:
        print(f"✗ Login failed: {response2.text}")
    
    # Test 3: Wrong password for existing user (should fail)
    print("\n\n### TEST 3: Wrong Password for Existing User ###")
    response3 = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email1,
        "password": "wrongpassword"
    })
    
    if response3.status_code == 401:
        print("✓ Correctly rejected wrong password")
    else:
        print(f"✗ Unexpected response: {response3.status_code}")
    
    # Test 4: Random user with manager code
    print("\n\n### TEST 4: Random User with Manager Secret Code ###")
    email2 = random_email()
    password2 = "password123"
    
    print(f"  Email: {email2}")
    print(f"  Password: {password2}")
    print(f"  Secret Code: manager")
    
    response4 = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email2,
        "password": password2,
        "secret_code": "manager"
    })
    
    if response4.status_code == 200:
        token = response4.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        
        if me_response.status_code == 200:
            user = me_response.json()
            print(f"\n✓ Account created with manager role!")
            print(f"  Username: {user['username']}")
            print(f"  Email: {user['email']}")
            print(f"  Role: {user['role']}")
            
            if user['role'] == 'manager':
                print("\n✓ Role verification PASSED: User is a manager")
            else:
                print(f"\n✗ Role verification FAILED: Expected manager, got {user['role']}")
    
    # Test 5: Multiple random users
    print("\n\n### TEST 5: Create 3 More Random Users ###")
    for i in range(3):
        email = random_email()
        password = f"pass{i+1}"
        
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            me_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
            user = me_response.json()
            print(f"✓ User {i+1}: {user['username']} ({user['email']}) - Role: {user['role']}")
        else:
            print(f"✗ Failed to create user {i+1}")
    
    print("\n\n" + "="*60)
    print("TESTING COMPLETE")
    print("="*60)
    print("\n✅ Summary:")
    print("  - Any email/password combination creates a new account")
    print("  - Existing users must use correct password")
    print("  - New users can become managers with secret code 'manager'")
    print("  - admin@example.com always gets admin role")
    print("\nFrontend: http://localhost:3000/login")

if __name__ == "__main__":
    test_auto_registration()
