# Fahrdienst App

A full-stack web application for medical transport coordination system. This application helps manage patients, drivers, and trips for a non-public medical transport service.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker-)
- [Manual Setup Instructions](#manual-setup-instructions)
- [API Endpoints](#api-endpoints)
- [Development](#development)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Quick Reference](#quick-reference)

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- React Router for navigation
- Axios for API communication
- Nginx (for production deployment)

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL database
- RESTful API architecture

### DevOps
- Docker & Docker Compose
- Multi-stage builds for optimized images
- Health checks for all services
- Persistent volumes for database

## Features

### Core Functionality
- **Dashboard**: Real-time overview with statistics and upcoming trips
- **Patient Management**: Complete CRUD operations for patient records
  - Medical notes and emergency contacts
  - Search and filter capabilities
- **Driver Management**: Track drivers and vehicle information
  - Availability status management
  - License and vehicle details
- **Trip Coordination**: Full trip lifecycle management
  - Schedule new trips with patient and driver assignment
  - Track pickup and dropoff locations
  - Distance and time tracking
- **Status Tracking**: Real-time trip status updates
  - Scheduled → In Progress → Completed/Cancelled
  - Quick status change from the trips list

### Technical Features
- **Responsive UI**: Clean, mobile-friendly interface
- **RESTful API**: Well-structured backend endpoints
- **Type Safety**: Full TypeScript coverage on frontend and backend
- **Docker Ready**: One-command deployment with docker-compose
- **Health Monitoring**: Built-in health checks for all services
- **Data Persistence**: PostgreSQL with volume-backed storage
- **Security**: JWT authentication ready, CORS configured

## Architecture

The application follows a three-tier architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host                          │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │   Backend    │  │  PostgreSQL  │ │
│  │              │  │              │  │              │ │
│  │  React + TS  │─▶│  Express +   │─▶│  Database    │ │
│  │    Nginx     │  │  TypeScript  │  │              │ │
│  │              │  │              │  │              │ │
│  │  Port 80     │  │  Port 5000   │  │  Port 5432   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                 │                  │         │
│         └─────────────────┴──────────────────┘         │
│              fahrdienst-network (bridge)               │
└─────────────────────────────────────────────────────────┘
```

### Communication Flow
1. **User** → Frontend (React SPA served by Nginx)
2. **Frontend** → Backend API (Axios HTTP requests)
3. **Backend** → PostgreSQL (pg client)
4. **Database** → Backend → Frontend → User

### Data Flow
- Frontend makes REST API calls to `/api/*` endpoints
- Backend validates requests and queries PostgreSQL
- Response data flows back through the chain
- All containers communicate via Docker bridge network

## Prerequisites

### Option 1: Docker (Recommended)
- Docker
- Docker Compose

### Option 2: Manual Installation
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Quick Start with Docker ⚡

The easiest and recommended way to run the application is with Docker Compose. All services (database, backend, frontend) are containerized and ready to deploy.

### First Time Setup

```bash
# 1. Navigate to the project directory
cd FahrdienstApp

# 2. Build and start all services
docker-compose up -d

# 3. Check if all containers are running
docker-compose ps

# 4. View logs (optional)
docker-compose logs -f
```

That's it! The application is now running at:
- **Frontend**: http://localhost (Port 80)
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

### Verify Installation

Test the backend API:
```bash
curl http://localhost:5000/api/health
# Expected output: {"status":"ok","message":"Fahrdienst API is running"}
```

Test the frontend:
```bash
curl -I http://localhost/
# Expected: HTTP/1.1 200 OK
```

### Important Notes

✅ **Database Initialization**: The PostgreSQL schema is automatically created on first startup
✅ **Health Checks**: All services have built-in health monitoring
✅ **Persistent Data**: Database data is stored in a Docker volume and survives container restarts
⚠️ **Production Security**: Change default passwords before deploying to production (see Configuration section below)

### Docker Configuration

#### Default Credentials (Change in Production!)
- Database Password: `fahrdienst_secure_password_123`
- JWT Secret: `your_production_jwt_secret_change_this_in_production`

#### Customizing Environment Variables
1. Copy the example file: `cp .env.docker .env`
2. Edit `.env` with your values
3. Update `docker-compose.yml` to reference the `.env` file
4. Rebuild: `docker-compose up -d --build`

### Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View running containers
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Stop services
docker-compose down

# Remove all data (including database)
docker-compose down -v

# Access database
docker-compose exec database psql -U postgres -d fahrdienst_db
```

## Manual Setup Instructions

### 1. Clone the Repository

```bash
cd FahrdienstApp
```

### 2. Database Setup

1. Install PostgreSQL if not already installed
2. Create a new database:

```sql
CREATE DATABASE fahrdienst_db;
```

3. Run the schema to create tables:

```bash
psql -U postgres -d fahrdienst_db -f backend/src/database/schema.sql
```

### 3. Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=fahrdienst_db
DB_USER=postgres
DB_PASSWORD=your_password_here

JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=7d
```

5. Start the backend server:

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

The backend API will be running at `http://localhost:5000`

### 4. Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

4. Update the `.env` file with your API URL:

```env
VITE_API_URL=http://localhost:5000/api
```

5. Start the frontend development server:

```bash
npm run dev
```

The frontend will be running at `http://localhost:5173`

## API Endpoints

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Drivers
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/available` - Get available drivers
- `GET /api/drivers/:id` - Get driver by ID
- `POST /api/drivers` - Create new driver
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Delete driver

### Trips
- `GET /api/trips` - Get all trips
- `GET /api/trips/status/:status` - Get trips by status
- `GET /api/trips/:id` - Get trip by ID
- `POST /api/trips` - Create new trip
- `PUT /api/trips/:id` - Update trip
- `PATCH /api/trips/:id/status` - Update trip status
- `DELETE /api/trips/:id` - Delete trip

## Development

### Backend Development

```bash
cd backend
npm run dev
```

The backend uses nodemon for hot-reloading during development.

### Frontend Development

```bash
cd frontend
npm run dev
```

The frontend uses Vite's hot module replacement (HMR) for instant updates.

### Building for Production

Backend:
```bash
cd backend
npm run build
```

Frontend:
```bash
cd frontend
npm run build
```

## Project Structure

```
FahrdienstApp/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── connection.ts
│   │   │   └── schema.sql
│   │   ├── models/
│   │   │   └── types.ts
│   │   ├── routes/
│   │   │   ├── patient.routes.ts
│   │   │   ├── driver.routes.ts
│   │   │   └── trip.routes.ts
│   │   └── server.ts
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Patients.tsx
│   │   │   ├── Drivers.tsx
│   │   │   └── Trips.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   ├── package.json
│   └── .env.example
├── docker-compose.yml
├── .env.docker
└── README.md
```

## Troubleshooting

### Docker Issues

#### Containers not starting
```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs

# Restart all services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build
```

#### Port already in use
If you get "port already allocated" errors:
```bash
# Check what's using the ports
# Windows (PowerShell):
Get-NetTCPConnection -LocalPort 80,5000,5432

# Linux/Mac:
lsof -i :80
lsof -i :5000
lsof -i :5432

# Change ports in docker-compose.yml
# For example, change "80:80" to "8080:80" for frontend
```

#### Database connection errors
```bash
# Check if database is healthy
docker-compose ps database

# View database logs
docker-compose logs database

# Restart database
docker-compose restart database

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

#### Frontend shows blank page
```bash
# Check if API URL is correct
docker-compose logs frontend | grep VITE_API_URL

# Rebuild frontend with correct API URL
docker-compose build frontend --no-cache
docker-compose up -d frontend
```

### Development Issues

#### TypeScript errors during build
The project uses strict TypeScript with `verbatimModuleSyntax`. Make sure to use type-only imports:
```typescript
// ✅ Correct
import { myFunction, type MyType } from './module';

// ❌ Wrong
import { myFunction, MyType } from './module';
```

#### npm ci fails
If `npm ci` fails during Docker build, ensure `package-lock.json` exists:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Production Deployment

#### Security Checklist
Before deploying to production:
- [ ] Change `POSTGRES_PASSWORD` in docker-compose.yml
- [ ] Change `JWT_SECRET` in docker-compose.yml
- [ ] Update `VITE_API_URL` to your production domain
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Set up automated backups for PostgreSQL
- [ ] Review and update CORS settings in backend
- [ ] Enable production logging

#### Performance Optimization
- Consider using a reverse proxy (nginx/Traefik) in front of services
- Set up Docker resource limits
- Enable PostgreSQL connection pooling
- Implement caching strategies
- Monitor resource usage with `docker stats`

## Quick Reference

### Most Common Commands
```bash
# Start the app
docker-compose up -d

# Stop the app
docker-compose down

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend

# Restart a service
docker-compose restart backend

# Check service health
docker-compose ps

# Access database CLI
docker-compose exec database psql -U postgres -d fahrdienst_db

# Rebuild after code changes
docker-compose up -d --build

# Clean restart (deletes data!)
docker-compose down -v && docker-compose up -d
```

### Useful Database Queries
```sql
-- Connect to database
docker-compose exec database psql -U postgres -d fahrdienst_db

-- View all patients
SELECT * FROM patients;

-- View all trips with patient and driver names
SELECT t.*,
       p.first_name || ' ' || p.last_name as patient_name,
       d.first_name || ' ' || d.last_name as driver_name
FROM trips t
LEFT JOIN patients p ON t.patient_id = p.id
LEFT JOIN drivers d ON t.driver_id = d.id;

-- Count trips by status
SELECT status, COUNT(*) FROM trips GROUP BY status;

-- Find available drivers
SELECT * FROM drivers WHERE is_available = true;
```

### Default Service URLs
- **Frontend Application**: http://localhost
- **Backend API Health**: http://localhost:5000/api/health
- **List all Patients**: http://localhost:5000/api/patients
- **List all Drivers**: http://localhost:5000/api/drivers
- **List all Trips**: http://localhost:5000/api/trips

## License

ISC

## Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for medical transport coordination**

Last updated: December 2025
