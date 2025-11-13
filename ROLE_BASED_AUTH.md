# Role-Based Authentication System

## Overview

The Project Tracker & Team Collaboration System now implements a comprehensive role-based authentication system with three distinct user roles: **Admin**, **Manager**, and **Normal User (Member)**.

## User Roles

### 1. **Admin** 
- **Identifier**: Fixed email `admin@example.com`
- **Access Level**: Full system access
- **Permissions**:
  - View and manage all users, teams, projects, and tasks
  - Create and assign managers to projects
  - Assign users under each manager
  - Complete CRUD operations on all entities
- **Dashboard**: `/admin/dashboard`

### 2. **Manager**
- **Identifier**: Any user who enters the secret code `"manager"` during login
- **Access Level**: Limited to assigned resources
- **Permissions**:
  - Manage teams and projects assigned to them by admin
  - Assign tasks to users within their projects
  - View and update tasks in their projects
  - Cannot access admin functions
- **Dashboard**: `/manager/dashboard`
- **Special Feature**: Role is dynamically assigned during login based on secret code

### 3. **Normal User (Member)**
- **Identifier**: Default role for all users without admin email or manager secret code
- **Access Level**: Personal tasks only
- **Permissions**:
  - View and update their own assigned tasks
  - View projects they are part of
  - Cannot create or assign tasks
  - Cannot manage teams or projects
- **Dashboard**: `/user/dashboard`

## Login Flow

### Frontend Login Page (`/login`)

The login page now includes three fields:
1. **Email**: User's email address
2. **Password**: User's password
3. **Secret Code** (Optional): For manager role elevation

```
┌─────────────────────────────────────┐
│  Login Form                         │
├─────────────────────────────────────┤
│  Email:         [            ]      │
│  Password:      [            ]      │
│  Secret Code:   [            ]      │
│  (Optional - for Manager access)    │
│                                     │
│  [Sign in]                          │
└─────────────────────────────────────┘
```

### Backend Role Assignment Logic

```python
if email == "admin@example.com":
    role = "admin"
elif secret_code == "manager":
    role = "manager"
else:
    role = "member"
```

### Role-Based Redirects

After successful login, users are automatically redirected:
- `admin@example.com` → `/admin/dashboard`
- User with "manager" code → `/manager/dashboard`
- Regular users → `/user/dashboard`

## Implementation Details

### Backend Changes

#### 1. **Auth Schema** (`app/schemas/auth.py`)
```python
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    secret_code: Optional[str] = None  # NEW
```

#### 2. **Login Endpoint** (`app/api/v1/auth.py`)
- Accepts optional `secret_code` field
- Dynamic role assignment during login
- Updates user role in database
- Includes role in JWT token payload

#### 3. **JWT Token Payload**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "admin|manager|member"
}
```

### Frontend Changes

#### 1. **Login Page** (`app/login/page.tsx`)
- Added secret code input field
- Updated to send secret_code to backend
- Improved error handling

#### 2. **Auth Context** (`context/AuthContext.tsx`)
- Updated `LoginCredentials` interface to include `secretCode`
- Implemented role-based redirects after login
- Added `requireRole()` HOC for route protection

#### 3. **Dashboard Pages**
Created three role-specific dashboards:

**Admin Dashboard** (`app/admin/dashboard/page.tsx`)
- Full system statistics
- Administrative actions
- Manage all resources

**Manager Dashboard** (`app/manager/dashboard/page.tsx`)
- Assigned projects and teams
- Task assignment capabilities
- Limited to manager's scope

**User Dashboard** (`app/user/dashboard/page.tsx`)
- Personal task view
- Project participation
- Self-service task updates

## Route Protection

### `requireAuth()` HOC
Ensures user is authenticated before accessing any page.

### `requireRole()` HOC
Protects routes based on user role:
```typescript
export function requireRole(
  Component: React.ComponentType,
  allowedRoles: string[]
)
```

Usage example:
```typescript
export default requireRole(AdminDashboard, ['admin']);
```

## Test Credentials

Use these credentials for testing:

### Admin User
```
Email: admin@example.com
Password: admin123
Access: Full admin dashboard
```

### Manager (via secret code)
```
Email: user@example.com
Password: user123
Secret Code: manager
Access: Manager dashboard
```

### Normal Users
```
1. Email: alice@example.com
   Password: alice123

2. Email: bob@example.com
   Password: bob123

Access: User dashboard (member level)
```

## Testing

Run the automated test script:
```bash
cd backend
python test_role_based_login.py
```

This tests:
- ✅ Admin login with fixed email
- ✅ Manager role elevation with secret code
- ✅ Normal user login without code
- ✅ Role persistence across logins
- ✅ Invalid secret code handling

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt
2. **JWT Tokens**: Secure token-based authentication
3. **Role Verification**: Backend validates role on every request
4. **Route Protection**: Frontend guards routes based on role
5. **Dynamic Role Assignment**: Role can change based on login credentials
6. **Auto-Redirect**: Prevents unauthorized access by redirecting to appropriate dashboard

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login with email, password, optional secret_code
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/register` - Register new user

### Role-Based Access
All existing endpoints (`/teams`, `/projects`, `/tasks`) now respect user roles:
- **Admin**: Full access to all resources
- **Manager**: Access to assigned projects and tasks
- **Member**: Access to own tasks only

## Frontend URLs

- **Login Page**: `http://localhost:3000/login`
- **Admin Dashboard**: `http://localhost:3000/admin/dashboard`
- **Manager Dashboard**: `http://localhost:3000/manager/dashboard`
- **User Dashboard**: `http://localhost:3000/user/dashboard`

## Database Changes

No new migrations required. The existing `users` table with `role` enum supports all three roles:
- `admin`
- `manager`
- `member`

Roles are updated dynamically during login based on credentials.

## Future Enhancements

Potential improvements:
1. **Manager Assignments**: UI for admins to assign managers to specific projects
2. **Team Memberships**: Explicit user-team relationships
3. **Permission Granularity**: Fine-grained permissions beyond roles
4. **Audit Logs**: Track role changes and privileged actions
5. **Session Management**: Multiple device support with session tracking
6. **Two-Factor Authentication**: Enhanced security for admin accounts

## Troubleshooting

### Issue: "Access Denied" message after login
**Solution**: Clear browser localStorage and login again with correct credentials

### Issue: Role not persisting
**Solution**: Check that secret code is exactly "manager" (case-sensitive)

### Issue: Wrong dashboard shown
**Solution**: Verify JWT token includes correct role claim

### Issue: Stats not showing on dashboard
**Solution**: Ensure backend server is running on port 8000 and stats endpoint is accessible

---

**Implementation Date**: November 13, 2025  
**Status**: ✅ Fully Implemented and Tested  
**Backend Tests**: All Passing ✓  
**Frontend**: Ready for Testing
