import { PrivyClient } from '@privy-io/server-auth';
import { logger } from '../utils/logger';
import { PrivyUserData, PrivyAuthRequest, PrivyAuthResponse, PrivyWallet, PrivyLinkedAccount, PrivyUserDetails } from '../types';
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

      // Extract isDelegated flag if available
      const isDelegated = privyUserData.isDelegated || privyUserData.is_delegated || false;

      return {
        privyId,
        profileId: email, // Use email as profile_id for consistency
        email,
        fullName,
        username,
        embeddedWallet,
        accountId,
        isDelegated,
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

  /**
   * Get user details from Privy by user ID
   */
  async getPrivyUser(userId: string): Promise<PrivyUserDetails> {
    try {
      const user = await this.client.getUserById(userId);

      // Log all linked accounts for debugging
      logger.info(`Linked accounts for user ${userId}:`, JSON.stringify(user.linkedAccounts, null, 2));

      // Process all linked accounts
      const linkedAccounts: PrivyLinkedAccount[] = user.linkedAccounts.map((account: any) => ({
        type: account.type,
        connectorType: account.connectorType,
        address: account.address,
        walletClient: account.walletClient,
        chainType: account.chainType,
        createdAt: account.createdAt,
        verifiedAt: account.verifiedAt,
        // Include any other fields that might be present
        ...account
      }));

      // Find embedded wallet specifically
      const embeddedWalletAccounts = linkedAccounts.filter(
        (account) => account.type === "wallet" && account.connectorType === "embedded"
      );

      const embeddedWallet = embeddedWalletAccounts.length > 0
        ? (embeddedWalletAccounts[0] as PrivyWallet)
        : undefined;

      const userDetails: PrivyUserDetails = {
        userId,
        linkedAccounts,
        embeddedWallet
      };

      // Store linked accounts in database
      await this.updateUserLinkedAccounts(userId, linkedAccounts);

      return userDetails;
    } catch (err) {
      if (err instanceof Error) {
        logger.error(`Error while fetching privy user details: ${err.message}; ${err.stack}`);
      } else {
        logger.error("Unknown error while fetching privy user details:", err);
      }
      throw err;
    }
  }

  /**
   * Update user's linked accounts in the database
   */
  private async updateUserLinkedAccounts(userId: string, linkedAccounts: PrivyLinkedAccount[]): Promise<void> {
    try {
      // Find user by privyId
      const user = await db.user.findByPrivyId(userId);
      
      if (user) {
        // Update user with linked accounts data
        await db.user.updateLinkedAccounts(user.id, linkedAccounts);
        logger.info(`Updated linked accounts for user ${userId} in database`);
      } else {
        logger.warn(`User with privyId ${userId} not found in database`);
      }
    } catch (error) {
      logger.error(`Failed to update linked accounts for user ${userId}:`, error);
      // Don't throw error here as this is a secondary operation
    }
  }
}

// Create singleton instance
export const privyService = new PrivyService();
export default privyService;
