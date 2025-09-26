import { Request, Response, NextFunction } from 'express';
import { PrivyClient } from '@privy-io/server-auth';
import { logger } from '@/utils/logger';
import { db } from '@/services/database';
import { User } from '@/types';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      isAuthorized?: boolean;
      privyId?: string;
      user?: User;
    }
  }
}

// Initialize Privy client
const privyClient = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

/**
 * Authentication middleware that verifies Privy tokens and adds user info to request.
 * 
 * This middleware:
 * 1. Skips authentication for health checks and GET requests to certain paths
 * 2. Extracts and verifies the Authorization Bearer token
 * 3. Adds authentication status and user info to the request
 * 4. Logs request information for debugging
 */
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip authentication for certain paths and GET requests
    const skipPaths = ['/health', '/favicon.ico', '/docs', '/api-docs'];
    if (skipPaths.includes(req.path) || req.method === 'GET') {
      return next();
    }

    // Extract request information for logging
    const requestInfo = {
      headers: req.headers,
      body: req.body,
      method: req.method,
      path: req.path,
      query: req.query,
      params: req.params,
      ip: req.ip,
    };

    // Get IP address
    const ipAddress = getClientIp(req);

    // Extract and verify token
    const token = extractToken(req);

    if (token) {
      try {
        // Verify token with Privy
        const claim = await privyClient.verifyAuthToken(token);
        const privyId = claim.userId;

        // Log successful authentication
        logger.info({
          msg: `The request is from ${ipAddress} and privyId is ${privyId}`,
          request: requestInfo,
        });

        // Add authentication info to request
        req.isAuthorized = Boolean(privyId);
        req.privyId = privyId;

        // Try to get user from database
        if (privyId) {
          const user = await db.user.findByPrivyId(privyId);
          req.user = user || undefined;
        }

      } catch (error) {
        // Log failed authentication
        logger.info({
          msg: `The request is from ${ipAddress}`,
          request: requestInfo,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        req.isAuthorized = false;
        req.privyId = undefined;
        req.user = undefined;
      }
    } else {
      // No token provided
      logger.info({
        msg: `The request is from ${ipAddress} - no token provided`,
        request: requestInfo,
      });
      req.isAuthorized = false;
      req.privyId = undefined;
      req.user = undefined;
    }

    // Continue to the next middleware/route handler
    next();

  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(401).json({ message: 'error while authentication' });
  }
};

/**
 * Middleware to require authentication
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthorized || !req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  next();
};

/**
 * Middleware to require active user
 */
export const requireActiveUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthorized || !req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }

  if (!req.user.isActive) {
    return res.status(400).json({ 
      success: false,
      message: 'Inactive user' 
    });
  }

  next();
};

/**
 * Middleware to optionally require authentication
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // This middleware doesn't block requests, just adds user info if available
  next();
};

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(req: Request): string | null {
  const authorization = req.header('Authorization');
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token;
}

/**
 * Extract client IP address from request
 */
function getClientIp(req: Request): string {
  // Check for forwarded IP first
  const forwardedFor = req.header('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP if there are multiple
    return forwardedFor.split(',')[0].trim();
  }

  // Check for real IP header
  const realIp = req.header('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to direct connection IP
  return req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
}

/**
 * Get current user from request (for use in route handlers)
 */
export const getCurrentUser = (req: Request): User | null => {
  return req.user || null;
};

/**
 * Get current user ID from request
 */
export const getCurrentUserId = (req: Request): number | null => {
  return req.user?.id || null;
};

/**
 * Check if request requires authentication
 */
export const requiresAuth = (req: Request): boolean => {
  const skipPaths = ['/health', '/favicon.ico', '/docs', '/api-docs'];
  return !skipPaths.includes(req.path) && req.method !== 'GET';
};
