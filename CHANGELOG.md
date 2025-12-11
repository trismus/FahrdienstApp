# Changelog

All notable changes to the Fahrdienst App will be documented in this file.

## [1.1.0] - 2025-12-11

### Added
- **Destination Management System**
  - Complete CRUD operations for medical facilities (hospitals, clinics, practices, rehab, pharmacies)
  - Reusable destination database for trip planning
  - Active/inactive status for destinations
  - Type-based filtering and organization
  - Integration with trip planning for both pickup and dropoff locations

- **Driver Availability System with Weekly Patterns**
  - Recurring weekly availability patterns (e.g., "every Monday 08:00-10:00")
  - 2-hour time blocks (Mo-Fr, 08:00-18:00)
  - Pattern-based availability management
  - Booking system for specific dates
  - Integrated availability grid in driver edit form
  - Automatic driver availability checking when assigning trips
  - Visual availability summary in driver list view
  - Real-time availability validation during trip creation

- **Enhanced Trip Planning with Appointments**
  - Three distinct time points for trips:
    - Initial pickup time and location
    - Appointment time at medical facility
    - Optional return pickup time and location
  - Flexible location management (saved destinations or custom addresses)
  - Separate driver assignment for return trips
  - Support for non-round-trip scenarios
  - Extended trip data model with appointment tracking

- **Recurring Trip Series (Backend Ready)**
  - API support for creating recurring trip patterns
  - Weekly, biweekly, and monthly recurrence options
  - Flexible weekday selection (e.g., "every Monday and Friday")
  - End date or occurrence count configuration
  - Automatic trip instance generation from patterns
  - PL/pgSQL function for efficient trip generation
  - Series management (activate/deactivate, view instances)

- **Database Migrations System**
  - Migration 001: Add destinations table
  - Migration 002: Convert to weekly availability patterns
  - Migration 003: Add appointments and recurring trips
  - PL/pgSQL function `generate_recurring_trip_instances()`

- **New API Endpoints**
  - `/api/destinations/*` - Full destination management
  - `/api/recurring-trips/*` - Recurring trip series management
  - `/api/availability/*` - Driver availability patterns and bookings
  - Enhanced `/api/trips/*` with appointment and return pickup support

- **Documentation**
  - `AVAILABILITY_SYSTEM.md` - Comprehensive driver availability system documentation
  - Updated README with new features and API endpoints
  - Migration scripts with inline documentation

### Changed
- **Trip Model**: Extended with appointment times, return pickups, and recurring trip links
- **Driver Model**: Now supports weekly recurring availability patterns
- **Trip Form UI**: Redesigned to support three time points and flexible locations
- **Driver Form UI**: Integrated availability pattern management
- **API Responses**: Include joined destination names and driver information

### Technical Details
- New tables: `destinations`, `recurring_trips`, `driver_availability_patterns`, `driver_availability_bookings`
- PostgreSQL ARRAY type for weekday storage
- PostgreSQL INTERVAL type for time offset calculations
- Enhanced TypeScript interfaces for Trip and RecurringTrip
- Improved API validation for complex trip scenarios

### Backend
- New route handlers for destinations, recurring trips, and availability
- Database schema updates with proper foreign key constraints
- Automatic trip instance generation from recurring patterns
- Complex SQL queries for availability checking with pattern and booking logic

### Frontend
- Enhanced trip creation/edit form with collapsible sections
- Real-time driver availability feedback
- Destination selection with search/filter capabilities
- Availability grid visualization in driver management
- Support for optional return trips with separate driver assignment

### Migration Path
- All migrations are backward compatible
- Existing trips continue to work with new optional fields
- Run migrations in order: 001, 002, 003

## [1.0.0] - 2025-12-11

### Added
- Initial release of Fahrdienst App
- Full-stack medical transport coordination system
- React 19 + TypeScript frontend with Vite
- Node.js + Express + TypeScript backend
- PostgreSQL database with automated schema initialization
- Complete CRUD operations for:
  - Patients (with medical notes and emergency contacts)
  - Drivers (with availability tracking)
  - Trips (with status tracking: scheduled, in progress, completed, cancelled)
- Dashboard with real-time statistics and upcoming trips
- Docker & Docker Compose configuration
  - Multi-stage builds for optimized images
  - Health checks for all services
  - Persistent volumes for database
  - Automatic database schema initialization
- RESTful API with comprehensive endpoints
- Type-safe frontend-backend communication
- Nginx configuration for production frontend serving
- Responsive UI design
- Security features:
  - JWT authentication ready
  - CORS configuration
  - Environment variable management
- Comprehensive documentation
  - README with setup instructions
  - Docker quick start guide
  - Troubleshooting section
  - API documentation
  - Architecture diagrams

### Technical Details
- Frontend: React 19.2.0, TypeScript 5.9.3, Vite 7.2.4
- Backend: Node.js 20, Express 4.18.2, TypeScript 5.3.3
- Database: PostgreSQL 16 (Alpine)
- Containerization: Docker with multi-stage builds
- Web Server: Nginx 1.29 (Alpine) for production frontend

### Security
- Placeholder credentials included for development
- Production security checklist provided in documentation
- Environment variable based configuration

### Known Issues
- Frontend health check may show as "unhealthy" but service works correctly
- Default passwords must be changed before production deployment

## Development Roadmap

### Planned for v1.1.0
- User authentication and authorization system
- Role-based access control (Admin, Dispatcher, Driver)
- Real-time notifications for trip updates
- Map integration for route planning
- Trip history and reporting
- Driver mobile app interface
- Email notifications for trips
- SMS integration for patient reminders

### Planned for v2.0.0
- Advanced analytics and reporting dashboard
- Vehicle maintenance tracking
- Multi-language support
- Offline mode support
- API rate limiting
- Automated backup system
- Integration with external calendar systems
- Advanced search and filtering
