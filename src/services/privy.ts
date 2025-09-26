import { PrivyClient } from '@privy-io/server-auth';
import { logger } from '../utils/logger';
import { PrivyUserData, PrivyAuthRequest, PrivyAuthResponse } from '../types';
import { db } from './database';

/**
 * Privy Service for handling authentication and user management
 */
class PrivyService {
  private client: PrivyClient;

  constructor() {
    this.client = new PrivyClient(
      process.env.PRIVY_APP_ID!,
      process.env.PRIVY_APP_SECRET!
    );
  }

  /**
   * Verify a Privy access token and return user data
   */
  async verifyAccessToken(accessToken: string): Promise<any> {
    try {
      const userData = await this.client.verifyAuthToken(accessToken);
      return userData;
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Extract and normalize user data from Privy response
   */
  extractUserData(privyUserData: any): PrivyUserData {
    try {
      // Extract user ID (Privy uses different field names)
      const privyId = privyUserData.userId || privyUserData.user_id || privyUserData.id;
      
      if (!privyId) {
        throw new Error('No user ID found in Privy response');
      }

      // Extract email
      const email = privyUserData.email || privyUserData.emailAddress || privyUserData.profile_id;

      // Extract other profile information
      const fullName = privyUserData.fullName || privyUserData.full_name || privyUserData.name;

      // Extract phone number if available
      const phoneNumber = privyUserData.phoneNumber || privyUserData.phone_number || privyUserData.phone;

      // Extract username if available
      const username = privyUserData.username || privyUserData.userName;

      // Extract embedded wallet if available
      const embeddedWallet = privyUserData.embeddedWallet || privyUserData.embedded_wallet;

      // Extract account ID if available
      const accountId = privyUserData.accountId || privyUserData.account_id;

      return {
        privyId,
        profileId: email, // Use email as profile_id for consistency
        email,
        fullName,
        username,
        embeddedWallet,
        accountId,
      };
    } catch (error) {
      logger.error('Error extracting user data:', error);
      throw new Error('Failed to extract user data');
    }
  }

  /**
   * Authenticate user with Privy token
   * If user exists, return user details.
   * If user doesn't exist, create new user and return details.
   */
  async authenticateUser(authRequest: PrivyAuthRequest): Promise<PrivyAuthResponse> {
    try {
      // Verify token with Privy
      const privyUserData = await this.verifyAccessToken(authRequest.accessToken);
      const userData = this.extractUserData(privyUserData);

      // Check if user already exists
      const existingUser = await db.user.findByPrivyId(userData.privyId);

      if (existingUser) {
        // User exists, return user details
        return {
          user: existingUser,
          isNewUser: false,
        };
      } else {
        // User doesn't exist, create new user
        const newUser = await db.user.createPrivyUser(userData);
        return {
          user: newUser,
          isNewUser: true,
        };
      }
    } catch (error) {
      logger.error('Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Get user's wallets from Privy
   */
  async getUserWallets(userId: string): Promise<any[]> {
    try {
      // Note: This would need to be implemented based on Privy's actual API
      // For now, return empty array as placeholder
      logger.info(`Getting wallets for user: ${userId}`);
      return [];
    } catch (error) {
      logger.error('Failed to get user wallets:', error);
      throw new Error('Failed to retrieve user wallets');
    }
  }

  /**
   * Create an embedded wallet for a user
   */
  async createEmbeddedWallet(userId: string): Promise<any> {
    try {
      // Note: This would need to be implemented based on Privy's actual API
      // For now, return a placeholder response
      logger.info(`Creating embedded wallet for user: ${userId}`);
      return {
        walletId: `wallet_${Date.now()}`,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        status: 'created',
      };
    } catch (error) {
      logger.error('Failed to create embedded wallet:', error);
      throw new Error('Failed to create embedded wallet');
    }
  }

  /**
   * Get user profile from Privy
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      // Note: This would need to be implemented based on Privy's actual API
      logger.info(`Getting profile for user: ${userId}`);
      return {
        userId,
        profile: {
          // Placeholder profile data
        },
      };
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      throw new Error('Failed to retrieve user profile');
    }
  }

  /**
   * Update user profile in Privy
   */
  async updateUserProfile(userId: string, profileData: any): Promise<any> {
    try {
      // Note: This would need to be implemented based on Privy's actual API
      logger.info(`Updating profile for user: ${userId}`, profileData);
      return {
        userId,
        updated: true,
        profile: profileData,
      };
    } catch (error) {
      logger.error('Failed to update user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }
}

// Create singleton instance
export const privyService = new PrivyService();
export default privyService;
