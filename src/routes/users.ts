import { Router, Request, Response } from 'express';
import { db } from '../services/database';
import { privyService } from '../services/privy';
import { requireAuth, requireActiveUser, getCurrentUser } from '../middleware/auth';
import { validate, schemas } from '../utils/validation';
import { ApiResponse, PrivyAuthResponse, User } from '../types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/v1/users/auth:
 *   post:
 *     summary: Authenticate user with Privy JWT token
 *     description: Authenticate user using Privy JWT token. If user exists, return user details. If user doesn't exist, create new user and return details.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessToken
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Privy JWT access token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         isNewUser:
 *                           type: boolean
 *                           description: Whether this is a new user
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
router.post('/auth', validate(schemas.privyAuth), async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    // Authenticate user with Privy
    const authResponse: PrivyAuthResponse = await privyService.authenticateUser({ accessToken });

    const response: ApiResponse<PrivyAuthResponse> = {
      success: true,
      data: authResponse,
      message: authResponse.isNewUser ? 'User created successfully' : 'User authenticated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('User authentication failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user information
 *     description: Retrieve the current authenticated user's information
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
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
router.get('/me', requireActiveUser, async (req: Request, res: Response) => {
  try {
    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<User> = {
      success: true,
      data: currentUser,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get current user failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get user information',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * PUT /api/v1/users/me
 * Update user profile information
 */
router.put('/me', requireActiveUser, validate(schemas.userUpdate), async (req: Request, res: Response) => {
  try {
    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    const updatedUser = await db.user.update(currentUser.id, req.body);
    
    if (!updatedUser) {
      const response: ApiResponse = {
        success: false,
        message: 'Failed to update user',
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse<User> = {
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Update user failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/v1/users/profile
 * Get user profile with additional information
 */
router.get('/profile', requireActiveUser, async (req: Request, res: Response) => {
  try {
    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    // Get additional user statistics
    const userStats = {
      totalProperties: 0,
      activeAgreements: 0,
      totalPayments: 0,
    };

    // If user is an owner, get property count
    if (currentUser.userType === 'owner') {
      const properties = await db.property.findMany({});
      userStats.totalProperties = properties.filter(p => p.ownerId === currentUser.id).length;
    }

    // Get active agreements count
    const agreements = await db.rentAgreement.findByTenantId(currentUser.id);
    userStats.activeAgreements = agreements.filter(a => a.isActive && !a.isTerminated).length;

    // Get payments count
    const payments = await db.payment.findByPayerId(currentUser.id);
    userStats.totalPayments = payments.length;

    const profileData = {
      user: currentUser,
      stats: userStats,
    };

    const response: ApiResponse<typeof profileData> = {
      success: true,
      data: profileData,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get user profile failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get user profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * DELETE /api/v1/users/me
 * Delete user account
 */
router.delete('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    const deleted = await db.user.delete(currentUser.id);
    
    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        message: 'Failed to delete user',
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'User account deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Delete user failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/v1/users/wallets
 * Get user's embedded wallets
 */
router.get('/wallets', requireActiveUser, async (req: Request, res: Response) => {
  try {
    const currentUser = getCurrentUser(req);
    
    if (!currentUser || !currentUser.privyId) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found or not authenticated with Privy',
      };
      return res.status(404).json(response);
    }

    const wallets = await privyService.getUserWallets(currentUser.privyId);

    const response: ApiResponse<any[]> = {
      success: true,
      data: wallets,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get user wallets failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get user wallets',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/v1/users/wallets
 * Create a new embedded wallet for the user
 */
router.post('/wallets', requireActiveUser, async (req: Request, res: Response) => {
  try {
    const currentUser = getCurrentUser(req);
    
    if (!currentUser || !currentUser.privyId) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found or not authenticated with Privy',
      };
      return res.status(404).json(response);
    }

    const wallet = await privyService.createEmbeddedWallet(currentUser.privyId);

    const response: ApiResponse<any> = {
      success: true,
      data: wallet,
      message: 'Embedded wallet created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Create embedded wallet failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to create embedded wallet',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

export default router;
