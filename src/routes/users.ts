import { Router, Request, Response } from 'express';
import { db } from '../services/database';
import { privyService } from '../services/privy';
import { requireAuth, getCurrentUser } from '../middleware/auth';
import { ApiResponse, User } from '../types';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/users/login
 * Login user with Privy JWT token from Authorization header
 * This endpoint handles user creation/fetching and returns user data
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Extract and verify token
    const authorization = req.header('Authorization');
    if (!authorization) {
      const response: ApiResponse = {
        success: false,
        message: 'Authorization header required',
      };
      return res.status(401).json(response);
    }

    const [scheme, token] = authorization.split(' ');
    if (!token || scheme.toLowerCase() !== 'bearer') {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid authorization format',
      };
      return res.status(401).json(response);
    }

    // Verify token with Privy
    const claim = await privyService.verifyAccessToken(token);
    const privyId = claim.userId;
    
    // Log complete JWT claim data
    logger.info('Complete JWT claim data:', JSON.stringify(claim, null, 2));

    if (!privyId) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid token - no user ID found',
      };
      return res.status(401).json(response);
    }

    // Check if user exists in database
    let user = await db.user.findByPrivyId(privyId);

    if (!user) {
      // User doesn't exist, create new user with Privy data
      try {
        // Fetch detailed user data from Privy to get linked accounts
        const privyUserDetails = await privyService.getPrivyUser(privyId);
        
        // Log complete Privy user details
        logger.info('Complete Privy user details:', JSON.stringify(privyUserDetails, null, 2));
        
        // Find embedded wallet address from linked accounts
        const embeddedWalletAccount = privyUserDetails.linkedAccounts.find(
          (account) => account.type === "wallet" && account.connectorType === "embedded"
        );
        
        // Extract available data from the claim and Privy user details
        const privyUserData = {
          privyId: claim.userId,
          profileId: (claim as any).email || (claim as any).profile_id,
          email: (claim as any).email,
          fullName: (claim as any).fullName || (claim as any).full_name || (claim as any).name,
          username: (claim as any).username || (claim as any).userName,
          phoneNumber: (claim as any).phoneNumber || (claim as any).phone_number || (claim as any).phone,
          embeddedWallet: embeddedWalletAccount?.address || undefined,
          embeddedWalletDelegated: embeddedWalletAccount?.delegated || false,
          accountId: (claim as any).accountId || (claim as any).account_id,
          isDelegated: (claim as any).isDelegated || (claim as any).is_delegated || false,
          linkedAccounts: privyUserDetails.linkedAccounts,
        };
        
        user = await db.user.createPrivyUser(privyUserData);
        logger.info(`Created new user for privyId: ${privyId} with ${privyUserDetails.linkedAccounts.length} linked accounts`);
      } catch (createError) {
        logger.error('Failed to create user:', createError);
        const response: ApiResponse = {
          success: false,
          message: 'Failed to create user',
          error: createError instanceof Error ? createError.message : 'Unknown error',
        };
        return res.status(500).json(response);
      }
    } else {
      // User exists, update their linked accounts data
      try {
        const privyUserDetails = await privyService.getPrivyUser(privyId);
        logger.info(`Updated linked accounts for existing user ${privyId} with ${privyUserDetails.linkedAccounts.length} linked accounts`);
        
        // Find embedded wallet address from linked accounts
        const embeddedWalletAccount = privyUserDetails.linkedAccounts.find(
          (account) => account.type === "wallet" && account.connectorType === "embedded"
        );
        
        // Update embedded wallet address and delegation status if found
        if (embeddedWalletAccount?.address && user.embeddedWallet !== embeddedWalletAccount.address) {
          await db.user.update(user.id, { 
            embeddedWallet: embeddedWalletAccount.address,
            embeddedWalletDelegated: embeddedWalletAccount.delegated || false
          });
          logger.info(`Updated embedded wallet address for user ${privyId}: ${embeddedWalletAccount.address}, delegated: ${embeddedWalletAccount.delegated}`);
        } else if (embeddedWalletAccount?.address) {
          // Check if delegation status changed
          if (user.embeddedWalletDelegated !== embeddedWalletAccount.delegated) {
            await db.user.update(user.id, { embeddedWalletDelegated: embeddedWalletAccount.delegated || false });
            logger.info(`Updated embedded wallet delegation status for user ${privyId}: ${embeddedWalletAccount.delegated}`);
          }
        }
        
        // Refresh user data from database to get updated linked accounts
        user = await db.user.findByPrivyId(privyId);
      } catch (updateError) {
        logger.error('Failed to update linked accounts for existing user:', updateError);
        // Continue with existing user data if update fails
      }
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user!,
      message: 'User logged in successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('User login failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});


/**
 * GET /api/v1/users/privy-data
 * Get complete Privy data for debugging
 */
router.get('/privy-data', async (req: Request, res: Response) => {
  try {
    // Extract and verify token
    const authorization = req.header('Authorization');
    if (!authorization) {
      const response: ApiResponse = {
        success: false,
        message: 'Authorization header required',
      };
      return res.status(401).json(response);
    }

    const [scheme, token] = authorization.split(' ');
    if (!token || scheme.toLowerCase() !== 'bearer') {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid authorization format',
      };
      return res.status(401).json(response);
    }

    // Verify token with Privy
    const claim = await privyService.verifyAccessToken(token);
    const privyId = claim.userId;

    if (!privyId) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid token - no user ID found',
      };
      return res.status(401).json(response);
    }

    // Get complete Privy user details
    const privyUserDetails = await privyService.getPrivyUser(privyId);

    const response: ApiResponse = {
      success: true,
      data: {
        jwtClaim: claim,
        privyUserDetails: privyUserDetails,
      },
      message: 'Complete Privy data retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to get Privy data:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get Privy data',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/v1/users/me
 * Get current authenticated user information
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    // Extract the Privy token from the Authorization header
    const authorization = req.header('Authorization');
    if (!authorization) {
      const response: ApiResponse = {
        success: false,
        message: 'Authorization header required',
      };
      return res.status(401).json(response);
    }

    const [scheme, token] = authorization.split(' ');
    if (!token || scheme.toLowerCase() !== 'bearer') {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid authorization format',
      };
      return res.status(401).json(response);
    }

    // Verify token with Privy
    const claim = await privyService.verifyAccessToken(token);
    const privyId = claim.userId;

    if (!privyId) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid token - no user ID found',
      };
      return res.status(401).json(response);
    }

    // Fetch user details from the database using privyId
    const user = await db.user.findByPrivyId(privyId);

    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user,
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
 * Update current user profile information
 * Only allows updating non-Privy managed fields
 */
router.put('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    // Only allow updating certain fields, not Privy-managed ones
    const allowedUpdates = {
      phoneNumber: req.body.phoneNumber,
      userType: req.body.userType,
    };

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'No valid fields to update',
      };
      return res.status(400).json(response);
    }

    const updatedUser = await db.user.update(currentUser.id, cleanUpdates);
    
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
 * Get current user profile with additional statistics
 */
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
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

export default router;