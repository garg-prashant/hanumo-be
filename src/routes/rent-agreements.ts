import { Router, Request, Response } from 'express';
import { db } from '@/services/database';
import { requireAuth, requireActiveUser, getCurrentUser } from '@/middleware/auth';
import { validate, schemas } from '@/utils/validation';
import { ApiResponse, RentAgreement, RentAgreementCreate } from '@/types';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * POST /api/v1/rent-agreements
 * Create a new rent agreement
 */
router.post('/', requireActiveUser, validate(schemas.rentAgreementCreate), async (req: Request, res: Response) => {
  try {
    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    const agreementData: RentAgreementCreate = req.body;
    const agreement = await db.rentAgreement.create(agreementData);

    const response: ApiResponse<RentAgreement> = {
      success: true,
      data: agreement,
      message: 'Rent agreement created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Create rent agreement failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to create rent agreement',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/v1/rent-agreements
 * Get all rent agreements for current user
 */
router.get('/', requireActiveUser, async (req: Request, res: Response) => {
  try {
    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    const agreements = await db.rentAgreement.findByTenantId(currentUser.id);

    const response: ApiResponse<RentAgreement[]> = {
      success: true,
      data: agreements,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get rent agreements failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get rent agreements',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/v1/rent-agreements/:id
 * Get rent agreement by ID
 */
router.get('/:id', requireActiveUser, async (req: Request, res: Response) => {
  try {
    const agreementId = parseInt(req.params.id);
    
    if (isNaN(agreementId)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid agreement ID',
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

    const agreement = await db.rentAgreement.findById(agreementId);
    
    if (!agreement) {
      const response: ApiResponse = {
        success: false,
        message: 'Rent agreement not found',
      };
      return res.status(404).json(response);
    }

    // Check if user is authorized to view this agreement
    if (agreement.tenantId !== currentUser.id) {
      const response: ApiResponse = {
        success: false,
        message: 'Unauthorized to view this agreement',
      };
      return res.status(403).json(response);
    }

    const response: ApiResponse<RentAgreement> = {
      success: true,
      data: agreement,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get rent agreement failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get rent agreement',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * PUT /api/v1/rent-agreements/:id
 * Update rent agreement
 */
router.put('/:id', requireActiveUser, validate(schemas.rentAgreementUpdate), async (req: Request, res: Response) => {
  try {
    const agreementId = parseInt(req.params.id);
    
    if (isNaN(agreementId)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid agreement ID',
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

    // Check if agreement exists and user is authorized
    const existingAgreement = await db.rentAgreement.findById(agreementId);
    
    if (!existingAgreement) {
      const response: ApiResponse = {
        success: false,
        message: 'Rent agreement not found',
      };
      return res.status(404).json(response);
    }

    if (existingAgreement.tenantId !== currentUser.id) {
      const response: ApiResponse = {
        success: false,
        message: 'Unauthorized to update this agreement',
      };
      return res.status(403).json(response);
    }

    const updatedAgreement = await db.rentAgreement.update(agreementId, req.body);
    
    if (!updatedAgreement) {
      const response: ApiResponse = {
        success: false,
        message: 'Failed to update rent agreement',
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse<RentAgreement> = {
      success: true,
      data: updatedAgreement,
      message: 'Rent agreement updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Update rent agreement failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update rent agreement',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * DELETE /api/v1/rent-agreements/:id
 * Delete rent agreement
 */
router.delete('/:id', requireActiveUser, async (req: Request, res: Response) => {
  try {
    const agreementId = parseInt(req.params.id);
    
    if (isNaN(agreementId)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid agreement ID',
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

    // Check if agreement exists and user is authorized
    const existingAgreement = await db.rentAgreement.findById(agreementId);
    
    if (!existingAgreement) {
      const response: ApiResponse = {
        success: false,
        message: 'Rent agreement not found',
      };
      return res.status(404).json(response);
    }

    if (existingAgreement.tenantId !== currentUser.id) {
      const response: ApiResponse = {
        success: false,
        message: 'Unauthorized to delete this agreement',
      };
      return res.status(403).json(response);
    }

    const deleted = await db.rentAgreement.delete(agreementId);
    
    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        message: 'Failed to delete rent agreement',
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Rent agreement deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Delete rent agreement failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete rent agreement',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/v1/rent-agreements/property/:propertyId
 * Get rent agreements for a specific property
 */
router.get('/property/:propertyId', requireActiveUser, async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    
    if (isNaN(propertyId)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid property ID',
      };
      return res.status(400).json(response);
    }

    const agreements = await db.rentAgreement.findByPropertyId(propertyId);

    const response: ApiResponse<RentAgreement[]> = {
      success: true,
      data: agreements,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get property rent agreements failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get property rent agreements',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

export default router;
