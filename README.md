# Hanumo Property Rental System - Node.js TypeScript Backend

A modern property rental management system built with Node.js, TypeScript, Express.js, and Prisma ORM.

## 🚀 Features

- **Authentication**: Privy-based authentication with JWT tokens
- **Property Management**: Create, update, and search properties
- **Rent Agreements**: Manage rental agreements between tenants and owners
- **Payment Processing**: X402 protocol integration for crypto payments
- **AI Integration**: OpenAI-powered property description enhancement
- **Database**: PostgreSQL with Prisma ORM
- **Type Safety**: Full TypeScript implementation
- **API Documentation**: Comprehensive REST API

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Privy
- **AI**: OpenAI GPT
- **Payments**: X402 Protocol
- **Validation**: Joi
- **Logging**: Winston

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- PostgreSQL 12 or higher
- Privy account and API keys
- OpenAI API key

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the environment file and configure your variables:

```bash
cp env.example .env
```

Update `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hanumo_rental?schema=public"

# Server Configuration
PORT=3000
NODE_ENV=development
BACKEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Privy Configuration
PRIVY_APP_ID=your_privy_app_id_here
PRIVY_APP_SECRET=your_privy_app_secret_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# X402 Payment Configuration
X402_PROVIDER_URL=https://api.x402provider.com
X402_API_KEY=your_x402_api_key_here
```

### 3. Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

### 4. Start Development Server

```bash
# Development mode with hot reload
npm run dev

# Or build and start production
npm run build
npm start
```

## 📚 API Documentation

### Authentication
All API endpoints (except health check) require JWT Bearer token authentication. The frontend should send the Privy JWT token in the `Authorization` header.

**Header Format:**
```bash
Authorization: Bearer <privy-jwt-token>
```

### Sample cURL Requests

#### System Endpoints

**Health Check**
```bash
curl -X GET http://localhost:3000/health
```

**Root Endpoint**
```bash
curl -X GET http://localhost:3000/
```

#### User Management

**Authenticate User**
```bash
curl -X POST http://localhost:3000/api/v1/users/auth \
  -H "Authorization: Bearer <privy-jwt-token>"
```

**Get Current User**
```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <privy-jwt-token>"
```

**Update User Profile**
```bash
curl -X PUT http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <privy-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "userType": "tenant"
  }'
```

**Get User Profile with Statistics**
```bash
curl -X GET http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer <privy-jwt-token>"
```

#### Property Management

**List All Properties (with search filters)**
```bash
# Get all properties
curl -X GET http://localhost:3000/api/v1/properties \
  -H "Authorization: Bearer <privy-jwt-token>"

# Search properties with filters
curl -X GET "http://localhost:3000/api/v1/properties?city=New%20York&minRent=1000&maxRent=3000&hasKitchen=true" \
  -H "Authorization: Bearer <privy-jwt-token>"
```

**Get My Properties (as owner)**
```bash
curl -X GET http://localhost:3000/api/v1/properties/my \
  -H "Authorization: Bearer <privy-jwt-token>"
```

**Get Property Details**
```bash
curl -X GET http://localhost:3000/api/v1/properties/1 \
  -H "Authorization: Bearer <privy-jwt-token>"
```

**Create Property**
```bash
curl -X POST http://localhost:3000/api/v1/properties \
  -H "Authorization: Bearer <privy-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Beautiful 2BR Apartment",
    "description": "Modern apartment in downtown",
    "numberOfRooms": 2,
    "hasKitchen": true,
    "hasBathroom": true,
    "numberOfBathrooms": 1,
    "rentAmount": 1500.00,
    "depositAmount": 1500.00,
    "paymentMode": "monthly",
    "address": "123 Main St, Apt 4B",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "pincode": "10001"
  }'
```

**Update Property**
```bash
curl -X PUT http://localhost:3000/api/v1/properties/1 \
  -H "Authorization: Bearer <privy-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Apartment Title",
    "rentAmount": 1600.00,
    "isOccupied": false
  }'
```

**Delete Property**
```bash
curl -X DELETE http://localhost:3000/api/v1/properties/1 \
  -H "Authorization: Bearer <privy-jwt-token>"
```

**AI Enhance Property Description**
```bash
curl -X POST http://localhost:3000/api/v1/properties/1/enhance-description \
  -H "Authorization: Bearer <privy-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "modern, luxury, downtown, amenities"
  }'
```

**Get Property Search Suggestions**
```bash
curl -X GET http://localhost:3000/api/v1/properties/search/suggestions \
  -H "Authorization: Bearer <privy-jwt-token>"
```

#### Rent Agreement Management

**List User Rent Agreements**
```bash
curl -X GET http://localhost:3000/api/v1/rent-agreements \
  -H "Authorization: Bearer <privy-jwt-token>"
```

**Get Rent Agreement Details**
```bash
curl -X GET http://localhost:3000/api/v1/rent-agreements/1 \
  -H "Authorization: Bearer <privy-jwt-token>"
```

**Create Rent Agreement**
```bash
curl -X POST http://localhost:3000/api/v1/rent-agreements \
  -H "Authorization: Bearer <privy-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": 1,
    "tenantId": 2,
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.000Z",
    "agreementSpanMonths": 12,
    "monthlyRent": 1500.00,
    "securityDeposit": 1500.00,
    "paymentMode": "monthly",
    "conditions": "Standard rental conditions apply",
    "specialTerms": "Pet-friendly property"
  }'
```

**Update Rent Agreement**
```bash
curl -X PUT http://localhost:3000/api/v1/rent-agreements/1 \
  -H "Authorization: Bearer <privy-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "monthlyRent": 1600.00,
    "isActive": true,
    "specialTerms": "Updated terms"
  }'
```

**Delete Rent Agreement**
```bash
curl -X DELETE http://localhost:3000/api/v1/rent-agreements/1 \
  -H "Authorization: Bearer <privy-jwt-token>"
```

**Get Rent Agreements for Property**
```bash
curl -X GET http://localhost:3000/api/v1/rent-agreements/property/1 \
  -H "Authorization: Bearer <privy-jwt-token>"
```

#### Payment Management

**List User Payments**
```bash
curl -X GET http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer <privy-jwt-token>"
```

**Get Payment Details**
```bash
curl -X GET http://localhost:3000/api/v1/payments/1 \
  -H "Authorization: Bearer <privy-jwt-token>"
```

**Create Payment**
```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer <privy-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "payerId": 2,
    "rentAgreementId": 1,
    "amount": 1500.00,
    "currency": "USD",
    "paymentType": "rent",
    "paymentMethod": "x402",
    "dueDate": "2024-02-01T00:00:00.000Z",
    "description": "Monthly rent payment",
    "notes": "February 2024 rent"
  }'
```

**Update Payment**
```bash
curl -X PUT http://localhost:3000/api/v1/payments/1 \
  -H "Authorization: Bearer <privy-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "notes": "Payment completed successfully"
  }'
```

**Get Payments for Rent Agreement**
```bash
curl -X GET http://localhost:3000/api/v1/payments/rent-agreement/1 \
  -H "Authorization: Bearer <privy-jwt-token>"
```

#### X402 Payment Integration

**Create X402 Payment**
```bash
curl -X POST http://localhost:3000/api/v1/payments/x402/create \
  -H "Authorization: Bearer <privy-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1500.00,
    "currency": "USD",
    "description": "Monthly rent payment",
    "paymentReference": "RENT_2024_02_001"
  }'
```

**Get X402 Payment Status**
```bash
curl -X GET http://localhost:3000/api/v1/payments/x402/payment_123/status \
  -H "Authorization: Bearer <privy-jwt-token>"
```

**X402 Payment Callback (Webhook)**
```bash
curl -X POST http://localhost:3000/api/v1/payments/x402/callback \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "payment_123",
    "status": "completed",
    "transactionHash": "0x1234567890abcdef"
  }'
```

**Refund X402 Payment**
```bash
curl -X POST http://localhost:3000/api/v1/payments/x402/payment_123/refund \
  -H "Authorization: Bearer <privy-jwt-token>"
```

#### Workflow Management

**Start Rent Payment Workflow**
```bash
curl -X POST http://localhost:3000/api/v1/workflow/rent-payment \
  -H "Authorization: Bearer <privy-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rentAgreementId": 1,
    "amount": 1500.00,
    "paymentMethod": "x402"
  }'
```

**Get Rent Payment Workflow Status**
```bash
curl -X GET http://localhost:3000/api/v1/workflow/rent-payment/payment_123/status \
  -H "Authorization: Bearer <privy-jwt-token>"
```

### Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## 🏗️ Project Structure

```
src/
├── index.ts              # Application entry point
├── types/                # TypeScript type definitions
├── middleware/           # Express middleware
│   └── auth.ts          # Authentication middleware
├── routes/              # API route handlers
│   ├── users.ts
│   ├── properties.ts
│   ├── rent-agreements.ts
│   └── payments.ts
├── services/            # Business logic services
│   ├── database.ts      # Database service with Prisma
│   ├── privy.ts         # Privy authentication service
│   ├── llm.ts           # OpenAI LLM service
│   └── x402.ts          # X402 payment service
└── utils/               # Utility functions
    ├── logger.ts        # Winston logging
    └── validation.ts    # Joi validation schemas
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run build            # Build TypeScript
npm start                # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode

# Linting
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
```

### Database Schema

The application uses Prisma with the following main models:

- **User**: User accounts with Privy integration
- **Property**: Rental properties with AI-enhanced descriptions
- **RentAgreement**: Rental agreements between tenants and owners
- **Payment**: Payment records with X402 integration

## 🔐 Authentication

The application uses Privy for authentication:

1. Frontend authenticates with Privy
2. Backend verifies Privy tokens
3. User data is stored in PostgreSQL
4. JWT tokens are used for API access

## 💳 Payment Integration

X402 protocol integration for crypto payments:

- Create payment requests
- Track payment status
- Handle webhooks
- Process refunds

## 🤖 AI Features

OpenAI integration for:

- Property description enhancement
- Search suggestions
- Property recommendations
- Content analysis

## 🚀 Deployment

### Environment Variables

Ensure all required environment variables are set in production:

- Database connection string
- Privy API credentials
- OpenAI API key
- X402 payment provider credentials
- JWT secret key

### Database Migration

```bash
npm run db:migrate
```

### Production Build

```bash
npm run build
npm start
```

## 📝 API Documentation

The API follows RESTful conventions with JSON responses:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the API documentation
- Review the code comments
- Open an issue on GitHub

---

**Note**: This is a Node.js TypeScript conversion of the original Python FastAPI codebase. All Python files have been removed and replaced with this modern TypeScript implementation.