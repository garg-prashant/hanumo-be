import pino from 'pino';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create base logger configuration
const baseConfig = {
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
};

// Development configuration with pretty printing
const devConfig = {
  ...baseConfig,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
};

// Production configuration with file logging
const prodConfig = {
  ...baseConfig,
  transport: {
    targets: [
      {
        target: 'pino/file',
        level: 'info',
        options: { destination: path.join(logDir, 'combined.log') },
      },
      {
        target: 'pino/file',
        level: 'error',
        options: { destination: path.join(logDir, 'error.log') },
      },
    ],
  },
};

// Create the base logger
const baseLogger = pino(process.env.NODE_ENV === 'production' ? prodConfig : devConfig);

// Create a stream object for morgan
export const morganStream = {
  write: (message: string) => {
    baseLogger.info({ message: message.trim() });
  },
};

/**
 * Enhanced Logger Class
 * Provides structured logging with context, performance tracking, and error handling
 */
export class Logger {
  private context: string;
  private requestId?: string;
  private logger: pino.Logger;

  constructor(context: string, requestId?: string) {
    this.context = context;
    this.requestId = requestId;
    this.logger = baseLogger.child({
      context,
      ...(requestId && { requestId }),
    });
  }

  /**
   * Create a new logger instance with context
   */
  static create(context: string, requestId?: string): Logger {
    return new Logger(context, requestId);
  }

  /**
   * Add request ID to logger context
   */
  withRequestId(requestId: string): Logger {
    return new Logger(this.context, requestId);
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | any, meta?: any): void {
    this.logger.error({
      message,
      ...(error && { error: error instanceof Error ? error.message : error }),
      ...(error && error instanceof Error && { stack: error.stack }),
      ...(meta && { meta }),
    });
  }

  /**
   * Log warning messages
   */
  warn(message: string, meta?: any): void {
    this.logger.warn({
      message,
      ...(meta && { meta }),
    });
  }

  /**
   * Log info messages
   */
  info(message: string, meta?: any): void {
    this.logger.info({
      message,
      ...(meta && { meta }),
    });
  }

  /**
   * Log debug messages
   */
  debug(message: string, meta?: any): void {
    this.logger.debug({
      message,
      ...(meta && { meta }),
    });
  }

  /**
   * Log HTTP requests
   */
  http(message: string, meta?: any): void {
    this.logger.info({
      message,
      type: 'http',
      ...(meta && { meta }),
    });
  }

  /**
   * Log API requests with structured data
   */
  apiRequest(method: string, url: string, statusCode: number, responseTime?: number, meta?: any): void {
    const logData = {
      message: `API Request: ${method} ${url} - ${statusCode}`,
      type: 'api_request',
      method,
      url,
      statusCode,
      ...(responseTime && { responseTime: `${responseTime}ms` }),
      ...(meta && { meta }),
    };

    if (statusCode >= 400) {
      this.logger.error(logData);
    } else {
      this.logger.info(logData);
    }
  }

  /**
   * Log database operations
   */
  dbOperation(operation: string, table: string, duration?: number, meta?: any): void {
    this.logger.debug({
      message: `DB ${operation} on ${table}`,
      type: 'db_operation',
      operation,
      table,
      ...(duration && { duration: `${duration}ms` }),
      ...(meta && { meta }),
    });
  }

  /**
   * Log authentication events
   */
  auth(event: string, userId?: string, success: boolean = true, meta?: any): void {
    const logData = {
      message: `Auth ${event}${success ? ' successful' : ' failed'}`,
      type: 'auth',
      event,
      success,
      ...(userId && { userId }),
      ...(meta && { meta }),
    };

    if (success) {
      this.logger.info(logData);
    } else {
      this.logger.warn(logData);
    }
  }

  /**
   * Log business logic events
   */
  business(event: string, entityType: string, entityId?: string, meta?: any): void {
    this.logger.info({
      message: `Business Event: ${event} on ${entityType}`,
      type: 'business',
      event,
      entityType,
      ...(entityId && { entityId }),
      ...(meta && { meta }),
    });
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, meta?: any): void {
    const logData = {
      message: `Performance: ${operation} took ${duration}ms`,
      type: 'performance',
      operation,
      duration,
      ...(meta && { meta }),
    };

    if (duration > 1000) {
      this.logger.warn(logData);
    } else {
      this.logger.info(logData);
    }
  }

  /**
   * Log security events
   */
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: any): void {
    const logData = {
      message: `Security Event: ${event}`,
      type: 'security',
      event,
      severity,
      ...(meta && { meta }),
    };

    switch (severity) {
      case 'critical':
      case 'high':
        this.logger.error(logData);
        break;
      case 'medium':
        this.logger.warn(logData);
        break;
      case 'low':
        this.logger.info(logData);
        break;
    }
  }

  /**
   * Log external service calls
   */
  externalService(service: string, operation: string, status: 'success' | 'error', duration?: number, meta?: any): void {
    const logData = {
      message: `External Service: ${service} ${operation} - ${status}`,
      type: 'external_service',
      service,
      operation,
      status,
      ...(duration && { duration: `${duration}ms` }),
      ...(meta && { meta }),
    };

    if (status === 'error') {
      this.logger.error(logData);
    } else {
      this.logger.info(logData);
    }
  }

  /**
   * Log workflow events
   */
  workflow(workflowName: string, step: string, status: 'started' | 'completed' | 'failed', meta?: any): void {
    const logData = {
      message: `Workflow: ${workflowName} - ${step} ${status}`,
      type: 'workflow',
      workflowName,
      step,
      status,
      ...(meta && { meta }),
    };

    switch (status) {
      case 'failed':
        this.logger.error(logData);
        break;
      case 'completed':
        this.logger.info(logData);
        break;
      case 'started':
        this.logger.debug(logData);
        break;
    }
  }

  /**
   * Log payment events
   */
  payment(event: string, paymentId: string, amount?: number, currency?: string, meta?: any): void {
    this.logger.info({
      message: `Payment Event: ${event}`,
      type: 'payment',
      event,
      paymentId,
      ...(amount && { amount }),
      ...(currency && { currency }),
      ...(meta && { meta }),
    });
  }

  /**
   * Log user actions
   */
  userAction(action: string, userId: string, entityType?: string, entityId?: string, meta?: any): void {
    this.logger.info({
      message: `User Action: ${action}`,
      type: 'user_action',
      action,
      userId,
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(meta && { meta }),
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: string): Logger {
    return new Logger(`${this.context}:${additionalContext}`, this.requestId);
  }
}

// Create a basic logger interface for easy imports
export interface BasicLogger {
  error(message: string, error?: Error | any, meta?: any): void;
  warn(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
  http(message: string, meta?: any): void;
}

// Basic logger implementation
export class BasicLoggerImpl implements BasicLogger {
  private context?: string;
  private logger: pino.Logger;

  constructor(context?: string) {
    this.context = context;
    this.logger = baseLogger.child({
      ...(context && { context }),
    });
  }

  error(message: string, error?: Error | any, meta?: any): void {
    this.logger.error({
      message,
      ...(error && { error: error instanceof Error ? error.message : error }),
      ...(error && error instanceof Error && { stack: error.stack }),
      ...(meta && { meta }),
    });
  }

  warn(message: string, meta?: any): void {
    this.logger.warn({
      message,
      ...(meta && { meta }),
    });
  }

  info(message: string, meta?: any): void {
    this.logger.info({
      message,
      ...(meta && { meta }),
    });
  }

  debug(message: string, meta?: any): void {
    this.logger.debug({
      message,
      ...(meta && { meta }),
    });
  }

  http(message: string, meta?: any): void {
    this.logger.info({
      message,
      type: 'http',
      ...(meta && { meta }),
    });
  }
}

// Factory function to create a basic logger
export const createLogger = (context?: string): BasicLogger => {
  return new BasicLoggerImpl(context);
};

// Default basic logger instance
export const basicLogger = new BasicLoggerImpl();

// Export convenience functions for backward compatibility
export const logError = (message: string, error?: Error | any, meta?: any) => {
  baseLogger.error({ message, error, meta });
};

export const logWarn = (message: string, meta?: any) => {
  baseLogger.warn({ message, meta });
};

export const logInfo = (message: string, meta?: any) => {
  baseLogger.info({ message, meta });
};

export const logDebug = (message: string, meta?: any) => {
  baseLogger.debug({ message, meta });
};

export const logHttp = (message: string, meta?: any) => {
  baseLogger.info({ message, type: 'http', meta });
};

// Export the base logger as default
export default baseLogger;

// Export a logger instance for convenience
export const logger = baseLogger;