# Hanumo Property Rental System - Deployment Guide

## Quick Start

### 1. Setup Environment
```bash
# Clone the repository and navigate to the directory
cd hanumo-be

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration
Create a `.env` file with the following:
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

### 3. Run the Application
```bash
# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The application will be available at:
- **API Server**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

## API Testing

### 1. Register a User (Owner)
```bash
curl -X POST "http://localhost:8000/api/v1/users/register" \
-H "Content-Type: application/json" \
-d '{
  "email": "owner@example.com",
  "username": "propertyowner",
  "password": "securepassword",
  "full_name": "Property Owner",
  "phone_number": "1234567890",
  "user_type": "owner"
}'
```

### 2. Login
```bash
curl -X POST "http://localhost:8000/api/v1/users/login" \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "username=propertyowner&password=securepassword"
```

### 3. Create a Property (use the token from login)
```bash
TOKEN="your-access-token-here"

curl -X POST "http://localhost:8000/api/v1/properties/" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "title": "Modern 3BHK Apartment",
  "description": "Beautiful apartment with city view",
  "number_of_rooms": 3,
  "has_kitchen": true,
  "has_bathroom": true,
  "number_of_bathrooms": 2,
  "rent_amount": 2000.0,
  "deposit_amount": 4000.0,
  "payment_mode": "monthly",
  "address": "456 Oak Avenue",
  "city": "San Francisco",
  "state": "CA",
  "country": "USA",
  "pincode": "94102"
}'
```

### 4. Search Properties
```bash
curl -X GET "http://localhost:8000/api/v1/properties/search?city=San%20Francisco&min_rooms=2&max_rooms=4" \
-H "accept: application/json"
```

## Key Features Working

✅ **User Management**
- User registration for owners and tenants
- JWT-based authentication
- Role-based access control

✅ **Property Management**
- Property creation (owners only)
- Advanced search functionality
- Property listing and details

✅ **LLM Integration**
- AI-powered property description enhancement
- Background task processing

✅ **X402 Payment Integration**
- Payment request creation
- Webhook handling for payment status
- Payment status tracking

✅ **Database Operations**
- SQLite database with SQLAlchemy ORM
- Comprehensive CRUD operations
- Relationship management

✅ **API Documentation**
- Interactive Swagger UI at `/docs`
- ReDoc documentation at `/redoc`

## Testing

Run the test suite:
```bash
python -m pytest test_main.py -v
```

All tests are passing and cover:
- User registration and login
- Property creation and search
- Authentication and authorization
- Basic API functionality

## Next Steps for Production

1. **Database Migration**
   - Switch from SQLite to PostgreSQL/MySQL
   - Set up proper database migrations with Alembic

2. **Security Enhancements**
   - Use strong secret keys
   - Implement proper CORS settings
   - Add rate limiting

3. **External Services**
   - Configure real OpenAI API key for LLM features
   - Set up actual X402 payment provider

4. **Infrastructure**
   - Deploy to cloud platform (AWS, GCP, Azure)
   - Set up proper logging and monitoring
   - Configure SSL/HTTPS

## Architecture Overview

The system is built with:
- **FastAPI** for the web framework
- **SQLAlchemy** for database ORM
- **Pydantic** for data validation
- **JWT** for authentication
- **OpenAI API** for LLM integration
- **X402 Protocol** for payment processing

The modular architecture ensures easy maintenance and extensibility.
