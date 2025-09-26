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

### Swagger UI Interface

The API includes comprehensive Swagger/OpenAPI documentation that you can access at:

- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs.json

The Swagger interface provides:
- Interactive API testing
- Complete endpoint documentation
- Request/response schemas
- Authentication examples
- Try-it-out functionality

### API Endpoints

#### Authentication
- `POST /api/v1/users/auth` - Authenticate with Privy token
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update user profile

#### Properties
- `GET /api/v1/properties` - List properties with search
- `POST /api/v1/properties` - Create property
- `GET /api/v1/properties/:id` - Get property details
- `PUT /api/v1/properties/:id` - Update property
- `DELETE /api/v1/properties/:id` - Delete property
- `POST /api/v1/properties/:id/enhance-description` - AI enhance description

#### Rent Agreements
- `GET /api/v1/rent-agreements` - List user agreements
- `POST /api/v1/rent-agreements` - Create agreement
- `GET /api/v1/rent-agreements/:id` - Get agreement details
- `PUT /api/v1/rent-agreements/:id` - Update agreement
- `DELETE /api/v1/rent-agreements/:id` - Delete agreement

#### Payments
- `GET /api/v1/payments` - List user payments
- `POST /api/v1/payments` - Create payment
- `GET /api/v1/payments/:id` - Get payment details
- `POST /api/v1/payments/x402/create` - Create X402 payment
- `GET /api/v1/payments/x402/:id/status` - Get X402 payment status

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