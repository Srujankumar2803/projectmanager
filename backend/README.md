# Project Manager Backend

A FastAPI-based backend with SQLAlchemy, Alembic migrations, and JWT authentication support.

## Features

- FastAPI web framework
- CORS enabled for `http://localhost:3000`
- SQLAlchemy ORM with async support
- Alembic database migrations
- Environment-based configuration
- User model with UUID primary keys and role-based access
- Health check endpoint

## Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment variables**:
   Edit the `.env` file to set your configuration:
   - `PORT`: Server port (default: 8000)
   - `DATABASE_URL`: Database connection string
   - `SECRET_KEY`: Secret key for JWT tokens
   - `ALGORITHM`: JWT algorithm (default: HS256)
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time (default: 60)

3. **Run database migrations**:
   ```bash
   # Create initial migration
   alembic revision --autogenerate -m "Initial migration"
   
   # Apply migrations
   alembic upgrade head
   ```

4. **Start the server**:
   ```bash
   python run.py
   ```

   The server will start at `http://localhost:8000` (or the port specified in `.env`)

## API Endpoints

### Health Check
- **GET** `/health`
  - Returns: `{"status": "ok"}`

### Authentication (API v1)

#### Register a New User
- **POST** `/api/v1/auth/register`
  - Request body:
    ```json
    {
      "username": "johndoe",
      "email": "john@example.com",
      "password": "securepassword123",
      "role": "member"
    }
    ```
  - Returns: User object (without password)

#### Login
- **POST** `/api/v1/auth/login`
  - Request body:
    ```json
    {
      "email": "john@example.com",
      "password": "securepassword123"
    }
    ```
  - Returns:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "bearer"
    }
    ```

#### Get Current User
- **GET** `/api/v1/auth/me`
  - Headers: `Authorization: Bearer <access_token>`
  - Returns: Current user object

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── auth.py      # Authentication endpoints
│   ├── core/
│   │   ├── __init__.py
│   │   ├── auth.py          # Auth utilities (JWT, password hashing)
│   │   ├── config.py        # Configuration management
│   │   └── database.py      # Database setup and session
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py          # User model
│   └── schemas/
│       ├── __init__.py
│       ├── auth.py          # Auth request/response schemas
│       └── user.py          # User schemas
├── alembic/                 # Database migrations
│   ├── versions/
│   └── env.py
├── alembic.ini              # Alembic configuration
├── run.py                   # Server entry point
├── requirements.txt         # Python dependencies
└── .env                     # Environment variables
```

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

## User Model

The User model includes:
- `id`: UUID primary key (auto-generated)
- `username`: Unique username
- `email`: Unique email address
- `password_hash`: Hashed password
- `role`: User role (admin, manager, member)
- `created_at`: Timestamp (auto-generated)

## Development

The server runs with hot-reload enabled by default when started with `run.py`.
