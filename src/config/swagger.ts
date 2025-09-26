import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hanumo Property Rental System API',
      version: '1.0.0',
      description: 'A comprehensive property rental management system with Privy authentication, AI-powered features, and X402 payment integration.',
      contact: {
        name: 'Hanumo Team',
        email: 'support@hanumo.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.hanumo.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Privy JWT token for authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
              example: 1,
            },
            privyId: {
              type: 'string',
              description: 'Privy user ID',
              example: 'privy_user_123',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            username: {
              type: 'string',
              description: 'Username',
              example: 'johndoe',
            },
            fullName: {
              type: 'string',
              description: 'Full name',
              example: 'John Doe',
            },
            phoneNumber: {
              type: 'string',
              description: 'Phone number',
              example: '+1234567890',
            },
            userType: {
              type: 'string',
              enum: ['tenant', 'owner'],
              description: 'Type of user',
              example: 'tenant',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether user is active',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Property: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Property ID',
              example: 1,
            },
            title: {
              type: 'string',
              description: 'Property title',
              example: 'Beautiful 2BR Apartment in Downtown',
            },
            description: {
              type: 'string',
              description: 'Property description',
              example: 'A modern 2-bedroom apartment with stunning city views.',
            },
            enhancedDescription: {
              type: 'string',
              description: 'AI-enhanced property description',
            },
            numberOfRooms: {
              type: 'integer',
              description: 'Number of rooms',
              example: 2,
            },
            hasKitchen: {
              type: 'boolean',
              description: 'Has kitchen',
              example: true,
            },
            hasBathroom: {
              type: 'boolean',
              description: 'Has bathroom',
              example: true,
            },
            numberOfBathrooms: {
              type: 'integer',
              description: 'Number of bathrooms',
              example: 1,
            },
            rentAmount: {
              type: 'number',
              format: 'float',
              description: 'Monthly rent amount',
              example: 1500.00,
            },
            depositAmount: {
              type: 'number',
              format: 'float',
              description: 'Security deposit amount',
              example: 1500.00,
            },
            paymentMode: {
              type: 'string',
              enum: ['monthly', 'weekly', 'daily'],
              description: 'Payment frequency',
              example: 'monthly',
            },
            address: {
              type: 'string',
              description: 'Property address',
              example: '123 Main St, Apt 4B',
            },
            city: {
              type: 'string',
              description: 'City',
              example: 'New York',
            },
            state: {
              type: 'string',
              description: 'State',
              example: 'NY',
            },
            country: {
              type: 'string',
              description: 'Country',
              example: 'USA',
            },
            pincode: {
              type: 'string',
              description: 'Postal code',
              example: '10001',
            },
            isOccupied: {
              type: 'boolean',
              description: 'Whether property is occupied',
              example: false,
            },
            isActive: {
              type: 'boolean',
              description: 'Whether property is active',
              example: true,
            },
            ownerId: {
              type: 'integer',
              description: 'Property owner ID',
              example: 1,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        RentAgreement: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Agreement ID',
              example: 1,
            },
            agreementNumber: {
              type: 'string',
              description: 'Unique agreement number',
              example: 'RA000001',
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              description: 'Agreement start date',
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: 'Agreement end date',
            },
            agreementSpanMonths: {
              type: 'integer',
              description: 'Agreement duration in months',
              example: 12,
            },
            monthlyRent: {
              type: 'number',
              format: 'float',
              description: 'Monthly rent amount',
              example: 1500.00,
            },
            securityDeposit: {
              type: 'number',
              format: 'float',
              description: 'Security deposit amount',
              example: 1500.00,
            },
            paymentMode: {
              type: 'string',
              enum: ['monthly', 'weekly', 'daily'],
              description: 'Payment frequency',
              example: 'monthly',
            },
            conditions: {
              type: 'string',
              description: 'Agreement conditions',
            },
            specialTerms: {
              type: 'string',
              description: 'Special terms and conditions',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether agreement is active',
              example: true,
            },
            isTerminated: {
              type: 'boolean',
              description: 'Whether agreement is terminated',
              example: false,
            },
            terminationDate: {
              type: 'string',
              format: 'date-time',
              description: 'Termination date',
            },
            terminationReason: {
              type: 'string',
              description: 'Reason for termination',
            },
            propertyId: {
              type: 'integer',
              description: 'Property ID',
              example: 1,
            },
            tenantId: {
              type: 'integer',
              description: 'Tenant ID',
              example: 2,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Payment ID',
              example: 1,
            },
            paymentReference: {
              type: 'string',
              description: 'Unique payment reference',
              example: 'PAY00000001',
            },
            amount: {
              type: 'number',
              format: 'float',
              description: 'Payment amount',
              example: 1500.00,
            },
            currency: {
              type: 'string',
              description: 'Payment currency',
              example: 'USD',
            },
            paymentType: {
              type: 'string',
              description: 'Type of payment',
              example: 'rent',
            },
            paymentMethod: {
              type: 'string',
              description: 'Payment method',
              example: 'x402',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'refunded'],
              description: 'Payment status',
              example: 'completed',
            },
            x402PaymentId: {
              type: 'string',
              description: 'X402 payment ID',
              example: 'x402_payment_123',
            },
            x402TransactionHash: {
              type: 'string',
              description: 'Blockchain transaction hash',
              example: '0x1234567890abcdef',
            },
            paymentPeriodStart: {
              type: 'string',
              format: 'date-time',
              description: 'Payment period start',
            },
            paymentPeriodEnd: {
              type: 'string',
              format: 'date-time',
              description: 'Payment period end',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Payment due date',
            },
            description: {
              type: 'string',
              description: 'Payment description',
            },
            notes: {
              type: 'string',
              description: 'Payment notes',
            },
            payerId: {
              type: 'integer',
              description: 'Payer user ID',
              example: 2,
            },
            rentAgreementId: {
              type: 'integer',
              description: 'Rent agreement ID',
              example: 1,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
            paidAt: {
              type: 'string',
              format: 'date-time',
              description: 'Payment completion timestamp',
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            message: {
              type: 'string',
              description: 'Response message',
              example: 'Operation successful',
            },
            error: {
              type: 'string',
              description: 'Error message (if any)',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Validation error',
            },
            error: {
              type: 'string',
              description: 'Detailed error information',
              example: 'Invalid input data',
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./dist/routes/*.js', './dist/index.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Hanumo API Documentation',
  }));

  // JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export default setupSwagger;
