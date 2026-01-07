# Backend - Vehicle Management API

A FastAPI-based REST API for managing vehicle information. Built with Python, PostgreSQL (via Supabase), SQLAlchemy, and Alembic for database migrations.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Local Development](#local-development)
- [Database Migrations](#database-migrations)
- [Seeding Data](#seeding-data)
- [API Documentation](#api-documentation)
- [Deployment to Render](#deployment-to-render)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python** (version 3.10 or higher)
- **pip** (Python package manager)
- **PostgreSQL** (via Supabase cloud service or local installation)
- A Supabase account (free tier available at [supabase.com](https://supabase.com))

## Installation

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment (recommended):

```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

## Environment Variables

The application requires environment variables to configure the database connection and CORS settings.

### Creating Environment Files

1. Copy the example environment file:

```bash
cp env.example .env
```

2. Edit the `.env` file with your actual values (this file is gitignored).

### Environment Variables Reference

| Variable       | Description                                | Required | Default          |
| -------------- | ------------------------------------------ | -------- | ---------------- |
| `DATABASE_URL` | PostgreSQL connection string from Supabase | Yes      | -                |
| `CORS_ORIGINS` | Comma-separated list of allowed origins    | No       | `*` (allows all) |

### Example `.env` File

```env
# Database Configuration
# Get your connection string from Supabase → Project Settings → Database
# Format: postgresql://user:password@host:port/database?sslmode=require
DATABASE_URL=postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres?sslmode=require

# CORS Configuration (optional)
# Comma-separated list of allowed origins (e.g., http://localhost:3000,https://your-frontend.vercel.app)
# Leave empty or omit to allow all origins (*)
CORS_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
```

**Important Notes:**

- The `DATABASE_URL` must include `?sslmode=require` for Supabase connections
- The connection string format should be: `postgresql://user:password@host:port/database?sslmode=require`
- Never commit your `.env` file to version control (it's already in `.gitignore`)

## Supabase Setup (Updated – IPv4 & Render Compatible)

Supabase provides a managed PostgreSQL database. When deploying to **Render**, you **must** use Supabase's **Session Pooler (IPv4)**, because Render does not support outbound IPv6 connections.

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create an account
2. Click **New Project**
3. Provide:

   - **Project name**
   - **Strong database password** (save this securely)
   - **Region**

4. Wait for provisioning to complete

---

### Step 2: Get the Correct Database Connection String (IMPORTANT)

1. Open your Supabase project
2. Navigate to **Settings → Database**
3. Scroll to **Connection strings**
4. Select **Session pooler**
5. Copy the URI that looks like:

```
postgresql://postgres.<project_ref>:YOUR_PASSWORD@aws-0-<region>.pooler.supabase.com:5432/postgres
```

⚠️ **Do NOT use "Direct connection" on Render**

Supabase explicitly marks it as:

> **Not IPv4 compatible**

Render is IPv4-only.

---

### Step 3: Format `DATABASE_URL` for async SQLAlchemy

Update the connection string for async usage and SSL:

```
postgresql+asyncpg://postgres.<project_ref>:YOUR_PASSWORD@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
```

Example:

```
postgresql+asyncpg://postgres.myprojectref:password@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require
```

Add this to:

- `.env` (local)
- Render Environment Variables (production)

---

### Step 4: Async SQLAlchemy + PgBouncer Configuration (Required)

Supabase Session Pooler uses **PgBouncer**, which requires disabling prepared statement caching.

Ensure your engine is created like this:

```python
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    },
)
```

Skipping this may cause intermittent connection failures in production.

## Local Development

### Starting the Development Server

1. Make sure your `.env` file is configured with the correct `DATABASE_URL`

2. Run database migrations (if not already done):

```bash
alembic upgrade head
```

3. Start the development server:

```bash
uvicorn app.main:app --reload
```

The API will be available at [http://localhost:8000](http://localhost:8000)

### Development Server Options

- **With auto-reload** (default): `uvicorn app.main:app --reload`
- **Specific host/port**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **From backend directory**: If running from project root, use `--app-dir backend`:
  ```bash
  uvicorn app.main:app --reload --app-dir backend
  ```

### API Documentation

Once the server is running, you can access:

- **Interactive API docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative docs (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Health Check

Test if the API is running:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{ "status": "ok" }
```

## Database Migrations

This project uses [Alembic](https://alembic.sqlalchemy.org/) for database schema migrations.

### Running Migrations

To apply all pending migrations:

```bash
alembic upgrade head
```

### Creating a New Migration

If you modify database models, create a new migration:

```bash
alembic revision --autogenerate -m "Description of changes"
```

### Viewing Migration History

To see migration history:

```bash
alembic history
```

### Rolling Back Migrations

To rollback to a previous migration:

```bash
# Rollback one migration
alembic downgrade -1

# Rollback to a specific revision
alembic downgrade <revision_id>
```

### Checking Current Migration Status

```bash
alembic current
```

## Seeding Data

You can populate the database with sample vehicle data from the provided CSV file.

### Basic Seeding

Seed 5 sample vehicles (default):

```bash
python -m app.seed
```

### Advanced Seeding Options

Seed a specific number of vehicles:

```bash
python -m app.seed --limit 10
```

Seed all vehicles from CSV:

```bash
python -m app.seed --limit -1
```

Use a custom CSV file:

```bash
python -m app.seed --csv-path path/to/your/file.csv
```

**Note:** The seed script uses upsert logic, so running it multiple times won't create duplicates. Existing vehicles (by VIN) will be skipped.

## API Documentation

### Base URL

- **Local**: `http://localhost:8000`
- **Production**: Your deployed URL

### Endpoints

#### Health Check

**GET** `/health`

Returns the API status.

**Response:**

```json
{
  "status": "ok"
}
```

#### List Vehicles

**GET** `/api/vehicles?page=1&page_size=10`

Retrieves a paginated list of vehicles.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 10)

**Response:**

```json
{
  "items": [
    {
      "vin": "1HGBH41JXMN109186",
      "make": "Honda",
      "model": "Civic",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 10,
  "total_pages": 10
}
```

#### Get Vehicle by VIN

**GET** `/api/vehicles/{vin}`

Retrieves detailed information about a specific vehicle.

**Path Parameters:**

- `vin`: Vehicle Identification Number

**Response:**

```json
{
  "vin": "1HGBH41JXMN109186",
  "make": "Honda",
  "model": "Civic",
  "description": "Beautiful sedan...",
  "image_urls": ["https://example.com/image1.jpg"],
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

- `404`: Vehicle not found

#### Create Vehicle

**POST** `/api/vehicles`

Creates a new vehicle.

**Request Body:**

```json
{
  "vin": "1HGBH41JXMN109186",
  "make": "Honda",
  "model": "Civic",
  "description": "Beautiful sedan in excellent condition",
  "image_urls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}
```

**Response:** `201 Created`

```json
{
  "vin": "1HGBH41JXMN109186",
  "make": "Honda",
  "model": "Civic",
  "description": "Beautiful sedan in excellent condition",
  "image_urls": ["https://example.com/image1.jpg"],
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

- `409 Conflict`: Vehicle with this VIN already exists
- `422 Unprocessable Entity`: Validation error

## Deployment to Render (Updated – Production Correct)

Render is used to deploy the FastAPI service. The configuration below is **tested and production-safe**.

---

### Step 1: Create a Web Service

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **New + → Web Service**
3. Connect your Git repository
4. Select the backend repository
5. Set **Root Directory** to `backend` (if applicable)

---

### Step 2: Configure Build & Start Commands

**Build Command:**

```bash
pip install -r requirements.txt 
```

**Start Command (IMPORTANT):**

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Why this matters:

- Render injects `$PORT`
- Binding to `0.0.0.0` is required for public access
- `--reload` must NOT be used in production

---

### Step 3: Environment Variables on Render

Navigate to **Service → Environment** and add:

#### DATABASE_URL (Required)

```
postgresql+asyncpg://postgres.<project_ref>:YOUR_PASSWORD@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
```

#### CORS_ORIGINS (Optional)

```
https://your-frontend-domain.com,http://localhost:3000
```

---

### Step 4: Deploy

1. Click **Create Web Service**
2. Render will:

   - Install dependencies
   - Run migrations
   - Start the FastAPI server

3. Once complete, you will see:

```
Your service is live 🎉
```

---

### Step 5: Verify Deployment

Health check:

```bash
curl https://your-service.onrender.com/health
```

API docs:

```
https://your-service.onrender.com/docs
```

---

## Render + Supabase Networking Notes (Critical)

| Component               | Requirement                            |
| ----------------------- | -------------------------------------- |
| Supabase Direct DB      | ❌ IPv6-only (not supported by Render) |
| Supabase Session Pooler | ✅ IPv4-compatible                     |
| SSL                     | ✅ Required                            |
| asyncpg                 | ✅ Supported                           |
| PgBouncer               | ✅ Requires statement cache disabled   |

---

## Common Deployment Mistakes (Avoid These)

- ❌ Using Supabase **Direct connection** on Render
- ❌ Forgetting `?sslmode=require`
- ❌ Using `--reload` in production
- ❌ Binding Uvicorn to `127.0.0.1`
- ❌ Not disabling prepared statements with PgBouncer

---

## Final Notes

This configuration:

- Works on Render free & paid tiers
- Is production-safe
- Handles Supabase networking correctly
- Avoids IPv6 routing issues
- Is compatible with async SQLAlchemy

## Project Structure

```
backend/
├── alembic/                 # Database migration scripts
│   ├── versions/           # Migration version files
│   ├── env.py              # Alembic environment configuration
│   └── script.py.mako      # Migration template
├── app/                    # Application code
│   ├── __init__.py
│   ├── main.py            # FastAPI application entry point
│   ├── db.py              # Database connection and engine
│   ├── routers/           # API route handlers
│   │   └── vehicle_routes.py
│   ├── schemas/           # Pydantic models for validation
│   │   └── vehicle_schemas.py
│   ├── queries/           # Database queries
│   │   └── vehicle_queries.py
│   └── seed.py            # Database seeding script
├── .env                   # Environment variables (gitignored)
├── env.example            # Example environment file
├── alembic.ini            # Alembic configuration
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## Technologies Used

- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **SQLAlchemy** - SQL toolkit and ORM
- **Alembic** - Database migration tool
- **asyncpg** - Async PostgreSQL driver
- **Pydantic** - Data validation using Python type annotations
- **python-dotenv** - Environment variable management
- **PostgreSQL** - Database (via Supabase)

## Troubleshooting

### Database Connection Issues

**Error:** `DATABASE_URL is required`

**Solution:**

- Ensure `.env` file exists in the backend directory
- Verify `DATABASE_URL` is set correctly
- Check that the connection string includes `?sslmode=require`

**Error:** Connection timeout or refused

**Solution:**

- Verify your Supabase project is active
- Check network restrictions in Supabase settings
- Ensure your IP is whitelisted (if restrictions are enabled)
- Verify the connection string format is correct

### Migration Issues

**Error:** `Target database is not up to date`

**Solution:**

- Run `alembic upgrade head` to apply pending migrations
- Check migration history with `alembic history`
- Verify your database schema matches expected state

**Error:** Migration conflicts

**Solution:**

- Check for conflicting migration files
- Review migration history: `alembic current`
- Consider rolling back if needed: `alembic downgrade -1`

### CORS Issues

**Error:** CORS policy blocking requests from frontend

**Solution:**

- Set `CORS_ORIGINS` in `.env` with your frontend URL(s)
- Ensure URLs are comma-separated without spaces
- For development, you can use `*` (allows all origins)
- For production, specify exact frontend URL(s)

### Port Already in Use

**Error:** `Address already in use`

**Solution:**

```bash
# Find the process using port 8000
# On Windows
netstat -ano | findstr :8000

# On macOS/Linux
lsof -i :8000

# Use a different port
uvicorn app.main:app --port 8001
```

### Import Errors

**Error:** `ModuleNotFoundError`

**Solution:**

- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`
- Verify you're in the correct directory
- Check Python path and virtual environment

### Render Deployment Issues

**Error:** Build fails on Render

**Solution:**

- Check build logs in Render dashboard
- Verify `requirements.txt` includes all dependencies
- Ensure build command is correct
- Check that Python version is compatible (3.10+)

**Error:** Service crashes after deployment

**Solution:**

- Check application logs in Render dashboard
- Verify environment variables are set correctly
- Ensure database is accessible from Render
- Check that start command uses `$PORT` variable

**Error:** Database migrations fail on Render

**Solution:**

- Verify `DATABASE_URL` is set correctly in Render environment variables
- Check that Supabase allows connections from Render
- Review migration logs in build output
- Ensure migrations are in the build command

### General Debugging Tips

1. **Check logs**: Always review application logs for detailed error messages
2. **Test locally first**: Ensure everything works locally before deploying
3. **Verify environment variables**: Double-check all required variables are set
4. **Database connectivity**: Test database connection separately
5. **API documentation**: Use `/docs` endpoint to test API endpoints

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review application logs
3. Consult the API documentation at `/docs` endpoint
4. Check Supabase and Render documentation
