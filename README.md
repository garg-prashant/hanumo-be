# Hanumo Property Rental System Backend

A comprehensive backend system for residential property rentals built with FastAPI, featuring property management, rent agreements, and integrated X402 payment protocol.

## Features

### Core Functionality
- **User Management**: Support for both property owners and tenants
- **Property Listings**: Create, search, and manage property listings
- **Rent Agreements**: Digital rent agreement management
- **Payment Processing**: Integrated X402 protocol for secure payments
- **LLM Integration**: AI-powered property description enhancement

### Key Capabilities
- JWT-based authentication and authorization
- Advanced property search with multiple filters
- Automated rent agreement generation
- Real-time payment status tracking
- Background tasks for description enhancement
- RESTful API with comprehensive documentation

## Tech Stack

- **Framework**: FastAPI
- **Database**: SQLite (configurable to PostgreSQL/MySQL)
- **ORM**: SQLAlchemy
- **Authentication**: JWT tokens with passlib
- **LLM Service**: OpenAI GPT integration
- **Payment Protocol**: X402 integration
- **Background Tasks**: FastAPI BackgroundTasks

## Project Structure

```
hanumo-be/
├── app/
│   ├── __init__.py
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── crud.py              # Database operations
│   ├── auth.py              # Authentication utilities
│   ├── llm_service.py       # LLM integration
│   ├── x402_service.py      # X402 payment service
│   └── routers/
│       ├── __init__.py
│       ├── users.py         # User management endpoints
│       ├── properties.py    # Property management endpoints
│       ├── rent_agreements.py # Rent agreement endpoints
│       └── payments.py      # Payment processing endpoints
├── main.py                  # FastAPI application entry point
├── requirements.txt         # Python dependencies
└── config.py               # Configuration settings
```

## API Entities

### User
- Can be either a tenant or property owner
- JWT-based authentication
- Profile management

### Property
- Comprehensive property details (rooms, amenities, location)
- Owner association
- AI-enhanced descriptions
- Search and filtering capabilities

### Rent Agreement
- Digital agreements between owners and tenants
- Automated property occupation tracking
- Agreement termination handling

### Payment
- Multiple payment types (rent, deposit, maintenance)
- X402 protocol integration
- Payment status tracking and webhooks

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd hanumo-be
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment Configuration**
Create a `.env` file with the following variables:
```env
DATABASE_URL=sqlite:///./hanumo_rental.db
SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
OPENAI_API_KEY=your-openai-api-key-here
X402_PROVIDER_URL=https://api.x402provider.com
X402_API_KEY=your-x402-api-key-here
BACKEND_URL=http://localhost:8000
ENVIRONMENT=development
```

5. **Run the application**
```bash
uvicorn main:app --reload
```

## API Documentation

Once the server is running, access:
- **Interactive API Docs**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

## Key API Endpoints

### Authentication
- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login
- `GET /api/v1/users/me` - Get current user

### Properties
- `POST /api/v1/properties/` - Create property listing
- `GET /api/v1/properties/search` - Search properties
- `GET /api/v1/properties/my-properties` - Get user's properties
- `POST /api/v1/properties/{id}/enhance-description` - AI description enhancement

### Rent Agreements
- `POST /api/v1/rent-agreements/` - Create rent agreement
- `GET /api/v1/rent-agreements/my-agreements` - Get user's agreements
- `POST /api/v1/rent-agreements/{id}/terminate` - Terminate agreement

### Payments
- `POST /api/v1/payments/` - Create payment record
- `POST /api/v1/payments/{id}/pay-with-x402` - Initiate X402 payment
- `GET /api/v1/payments/my-payments` - Get user's payments
- `POST /api/v1/payments/x402/callback` - X402 webhook handler

## X402 Integration

The system integrates with the X402 payment protocol for secure, decentralized payments:

1. **Payment Initiation**: Create payment requests through X402 providers
2. **Status Tracking**: Real-time payment status updates
3. **Webhook Handling**: Automated payment confirmation via webhooks
4. **Transaction History**: Complete payment audit trail

## LLM Integration

AI-powered property description enhancement:

1. **Input Processing**: Takes property details and keywords
2. **Context Building**: Combines property features with location data
3. **Description Generation**: Uses OpenAI GPT to create compelling descriptions
4. **Background Processing**: Non-blocking enhancement via background tasks

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt password encryption
- **Permission Checks**: Role-based access control
- **Input Validation**: Comprehensive request validation

## Database Schema

The system uses four main entities with proper relationships:
- Users have many Properties (as owners)
- Properties have many RentAgreements
- RentAgreements have many Payments
- Users have many Payments (as payers)

## Development

### Running Tests
```bash
pytest
```

### Code Quality
The codebase follows FastAPI best practices:
- Dependency injection for database sessions
- Proper error handling and HTTP status codes
- Comprehensive input validation
- Modular architecture with clear separation of concerns

## Production Deployment

For production deployment:

1. **Database**: Migrate to PostgreSQL/MySQL
2. **Environment**: Set secure environment variables
3. **CORS**: Configure appropriate CORS settings
4. **Logging**: Implement comprehensive logging
5. **Monitoring**: Add health checks and monitoring
6. **SSL**: Enable HTTPS with proper certificates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
