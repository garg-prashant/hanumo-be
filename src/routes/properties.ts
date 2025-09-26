import { Router, Request, Response } from 'express';
import { db } from '../services/database';
import { llmService } from '../services/llm';
import { requireAuth, requireActiveUser, getCurrentUser } from '../middleware/auth';
import { validate, validateQuery, schemas } from '../utils/validation';
import { ApiResponse, Property, PropertyCreate, PropertySearch } from '../types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/properties
 * Create a new property
 */
router.post('/', requireActiveUser, validate(schemas.propertyCreate), async (req: Request, res: Response) => {
  try {
    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    const propertyData: PropertyCreate = req.body;
    const property = await db.property.create(propertyData, currentUser.id);

    const response: ApiResponse<Property> = {
      success: true,
      data: property,
      message: 'Property created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Create property failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to create property',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /api/v1/properties:
 *   get:
 *     summary: Get all properties with optional search filters
 *     description: Retrieve a list of properties with optional search and filter parameters
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *         example: "New York"
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state
 *         example: "NY"
 *       - in: query
 *         name: minRent
 *         schema:
 *           type: number
 *           format: float
 *         description: Minimum rent amount
 *         example: 1000
 *       - in: query
 *         name: maxRent
 *         schema:
 *           type: number
 *           format: float
 *         description: Maximum rent amount
 *         example: 3000
 *       - in: query
 *         name: minRooms
 *         schema:
 *           type: integer
 *         description: Minimum number of rooms
 *         example: 1
 *       - in: query
 *         name: maxRooms
 *         schema:
 *           type: integer
 *         description: Maximum number of rooms
 *         example: 5
 *       - in: query
 *         name: hasKitchen
 *         schema:
 *           type: boolean
 *         description: Filter by kitchen availability
 *         example: true
 *       - in: query
 *         name: hasBathroom
 *         schema:
 *           type: boolean
 *         description: Filter by bathroom availability
 *         example: true
 *       - in: query
 *         name: paymentMode
 *         schema:
 *           type: string
 *           enum: [monthly, weekly, daily]
 *         description: Filter by payment mode
 *         example: "monthly"
 *       - in: query
 *         name: isOccupied
 *         schema:
 *           type: boolean
 *         description: Filter by occupancy status
 *         example: false
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Property'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', validateQuery(schemas.propertySearch), async (req: Request, res: Response) => {
  try {
    const searchFilters: PropertySearch = req.query;
    const properties = await db.property.findMany(searchFilters);

    const response: ApiResponse<Property[]> = {
      success: true,
      data: properties,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get properties failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get properties',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/v1/properties/my
 * Get current user's properties
 */
router.get('/my', requireActiveUser, async (req: Request, res: Response) => {
  try {
    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    const properties = await db.property.findMany({});
    const userProperties = properties.filter(p => p.ownerId === currentUser.id);

    const response: ApiResponse<Property[]> = {
      success: true,
      data: userProperties,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get user properties failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get user properties',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/v1/properties/:id
 * Get property by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    
    if (isNaN(propertyId)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid property ID',
      };
      return res.status(400).json(response);
    }

    const property = await db.property.findById(propertyId);
    
    if (!property) {
      const response: ApiResponse = {
        success: false,
        message: 'Property not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Property> = {
      success: true,
      data: property,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get property failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get property',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * PUT /api/v1/properties/:id
 * Update property
 */
router.put('/:id', requireActiveUser, validate(schemas.propertyUpdate), async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    
    if (isNaN(propertyId)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid property ID',
      };
      return res.status(400).json(response);
    }

    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    // Check if property exists and belongs to user
    const existingProperty = await db.property.findById(propertyId);
    
    if (!existingProperty) {
      const response: ApiResponse = {
        success: false,
        message: 'Property not found',
      };
      return res.status(404).json(response);
    }

    if (existingProperty.ownerId !== currentUser.id) {
      const response: ApiResponse = {
        success: false,
        message: 'Unauthorized to update this property',
      };
      return res.status(403).json(response);
    }

    const updatedProperty = await db.property.update(propertyId, req.body);
    
    if (!updatedProperty) {
      const response: ApiResponse = {
        success: false,
        message: 'Failed to update property',
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse<Property> = {
      success: true,
      data: updatedProperty,
      message: 'Property updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Update property failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update property',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * DELETE /api/v1/properties/:id
 * Delete property
 */
router.delete('/:id', requireActiveUser, async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    
    if (isNaN(propertyId)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid property ID',
      };
      return res.status(400).json(response);
    }

    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    // Check if property exists and belongs to user
    const existingProperty = await db.property.findById(propertyId);
    
    if (!existingProperty) {
      const response: ApiResponse = {
        success: false,
        message: 'Property not found',
      };
      return res.status(404).json(response);
    }

    if (existingProperty.ownerId !== currentUser.id) {
      const response: ApiResponse = {
        success: false,
        message: 'Unauthorized to delete this property',
      };
      return res.status(403).json(response);
    }

    const deleted = await db.property.delete(propertyId);
    
    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        message: 'Failed to delete property',
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Property deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Delete property failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete property',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/v1/properties/:id/enhance-description
 * Enhance property description using AI
 */
router.post('/:id/enhance-description', requireActiveUser, validate(schemas.propertyDescriptionEnhancement), async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    
    if (isNaN(propertyId)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid property ID',
      };
      return res.status(400).json(response);
    }

    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    // Check if property exists and belongs to user
    const existingProperty = await db.property.findById(propertyId);
    
    if (!existingProperty) {
      const response: ApiResponse = {
        success: false,
        message: 'Property not found',
      };
      return res.status(404).json(response);
    }

    if (existingProperty.ownerId !== currentUser.id) {
      const response: ApiResponse = {
        success: false,
        message: 'Unauthorized to enhance this property',
      };
      return res.status(403).json(response);
    }

    const { keywords } = req.body;

    // Enhance description using LLM service
    const enhancedDescription = await llmService.enhancePropertyDescription({
      title: existingProperty.title,
      description: existingProperty.description || '',
      keywords,
      numberOfRooms: existingProperty.numberOfRooms,
      hasKitchen: existingProperty.hasKitchen,
      hasBathroom: existingProperty.hasBathroom,
      numberOfBathrooms: existingProperty.numberOfBathrooms,
      rentAmount: existingProperty.rentAmount,
      paymentMode: existingProperty.paymentMode,
      address: existingProperty.address,
      city: existingProperty.city,
      state: existingProperty.state,
      country: existingProperty.country,
    });

    // Update property with enhanced description
    const updatedProperty = await db.property.updateEnhancedDescription(propertyId, enhancedDescription);
    
    if (!updatedProperty) {
      const response: ApiResponse = {
        success: false,
        message: 'Failed to update property description',
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse<Property> = {
      success: true,
      data: updatedProperty,
      message: 'Property description enhanced successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Enhance property description failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to enhance property description',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/v1/properties/search/suggestions
 * Get AI-powered search suggestions
 */
router.get('/search/suggestions', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      const response: ApiResponse = {
        success: false,
        message: 'Search query is required',
      };
      return res.status(400).json(response);
    }

    const suggestions = await llmService.generateSearchSuggestions(q);

    const response: ApiResponse<string[]> = {
      success: true,
      data: suggestions,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get search suggestions failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get search suggestions',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

export default router;
