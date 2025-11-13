"""
Create test users for role-based login testing
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.user import User, UserRole
from app.core.auth import get_password_hash
import uuid

def create_test_users():
    """Create test users for each role"""
    db = SessionLocal()
    
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            # Create admin user
            admin = User(
                id=uuid.uuid4(),
                username="admin",
                email="admin@example.com",
                password_hash=get_password_hash("admin123"),
                role=UserRole.admin
            )
            db.add(admin)
            print("✓ Created admin user: admin@example.com / admin123")
        else:
            # Update password just in case
            admin.password_hash = get_password_hash("admin123")
            admin.role = UserRole.admin
            print("✓ Updated admin user: admin@example.com / admin123")
        
        # Create/update normal user (will become manager with secret code)
        user = db.query(User).filter(User.email == "user@example.com").first()
        if not user:
            user = User(
                id=uuid.uuid4(),
                username="normaluser",
                email="user@example.com",
                password_hash=get_password_hash("user123"),
                role=UserRole.member
            )
            db.add(user)
            print("✓ Created normal user: user@example.com / user123")
        else:
            user.password_hash = get_password_hash("user123")
            user.role = UserRole.member
            print("✓ Updated normal user: user@example.com / user123")
        
        # Create another test user
        user2 = db.query(User).filter(User.email == "alice@example.com").first()
        if not user2:
            user2 = User(
                id=uuid.uuid4(),
                username="alice",
                email="alice@example.com",
                password_hash=get_password_hash("alice123"),
                role=UserRole.member
            )
            db.add(user2)
            print("✓ Created test user: alice@example.com / alice123")
        else:
            user2.password_hash = get_password_hash("alice123")
            user2.role = UserRole.member
            print("✓ Updated test user: alice@example.com / alice123")
        
        # Create another test user
        user3 = db.query(User).filter(User.email == "bob@example.com").first()
        if not user3:
            user3 = User(
                id=uuid.uuid4(),
                username="bob",
                email="bob@example.com",
                password_hash=get_password_hash("bob123"),
                role=UserRole.member
            )
            db.add(user3)
            print("✓ Created test user: bob@example.com / bob123")
        else:
            user3.password_hash = get_password_hash("bob123")
            user3.role = UserRole.member
            print("✓ Updated test user: bob@example.com / bob123")
        
        db.commit()
        print("\n✓ All test users created/updated successfully!")
        
        print("\n" + "="*60)
        print("TEST CREDENTIALS:")
        print("="*60)
        print("Admin:  admin@example.com / admin123")
        print("User 1: user@example.com / user123")
        print("User 2: alice@example.com / alice123")
        print("User 3: bob@example.com / bob123")
        print("\nTo login as manager, use any user email + password + secret code 'manager'")
        print("="*60)
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()
