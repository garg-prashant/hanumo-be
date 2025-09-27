import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

/**
 * Validation middleware factory
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: errorMessage,
      };
      
      return res.status(400).json(response);
    }
    
    req.body = value;
    next();
  };
};

/**
 * Query validation middleware factory
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      
      const response: ApiResponse = {
        success: false,
        message: 'Query validation error',
        error: errorMessage,
      };
      
      return res.status(400).json(response);
    }
    
    req.query = value;
    next();
  };
};

/**
 * Params validation middleware factory
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      
      const response: ApiResponse = {
        success: false,
        message: 'Parameter validation error',
        error: errorMessage,
      };
      
      return res.status(400).json(response);
    }
    
    req.params = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  // User schemas
  userCreate: Joi.object({
    email: Joi.string().email().optional(),
    username: Joi.string().alphanum().min(3).max(30).optional(),
    fullName: Joi.string().min(2).max(100).optional(),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
    userType: Joi.string().valid('tenant', 'owner').optional(),
    password: Joi.string().min(6).optional(),
  }),

  userUpdate: Joi.object({
    email: Joi.string().email().optional(),
    username: Joi.string().alphanum().min(3).max(30).optional(),
    fullName: Joi.string().min(2).max(100).optional(),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
    userType: Joi.string().valid('tenant', 'owner').optional(),
  }),


  // Property schemas
  propertyCreate: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().max(1000).optional(),
    numberOfRooms: Joi.number().integer().min(1).max(20).required(),
    hasKitchen: Joi.boolean().optional(),
    hasBathroom: Joi.boolean().optional(),
    numberOfBathrooms: Joi.number().integer().min(0).max(10).optional(),
    rentAmount: Joi.number().positive().required(),
    depositAmount: Joi.number().min(0).optional(),
    paymentMode: Joi.string().valid('monthly', 'weekly', 'daily').required(),
    address: Joi.string().min(10).max(500).required(),
    city: Joi.string().min(2).max(100).required(),
    state: Joi.string().min(2).max(100).required(),
    country: Joi.string().min(2).max(100).required(),
    pincode: Joi.string().pattern(/^[\d\w\s-]+$/).required(),
  }),

  propertyUpdate: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    numberOfRooms: Joi.number().integer().min(1).max(20).optional(),
    hasKitchen: Joi.boolean().optional(),
    hasBathroom: Joi.boolean().optional(),
    numberOfBathrooms: Joi.number().integer().min(0).max(10).optional(),
    rentAmount: Joi.number().positive().optional(),
    depositAmount: Joi.number().min(0).optional(),
    paymentMode: Joi.string().valid('monthly', 'weekly', 'daily').optional(),
    address: Joi.string().min(10).max(500).optional(),
    city: Joi.string().min(2).max(100).optional(),
    state: Joi.string().min(2).max(100).optional(),
    country: Joi.string().min(2).max(100).optional(),
    pincode: Joi.string().pattern(/^[\d\w\s-]+$/).optional(),
    isOccupied: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
  }),

  propertySearch: Joi.object({
    city: Joi.string().min(2).max(100).optional(),
    state: Joi.string().min(2).max(100).optional(),
    country: Joi.string().min(2).max(100).optional(),
    pincode: Joi.string().pattern(/^[\d\w\s-]+$/).optional(),
    minRent: Joi.number().min(0).optional(),
    maxRent: Joi.number().min(0).optional(),
    minRooms: Joi.number().integer().min(1).optional(),
    maxRooms: Joi.number().integer().min(1).optional(),
    hasKitchen: Joi.boolean().optional(),
    hasBathroom: Joi.boolean().optional(),
    paymentMode: Joi.string().valid('monthly', 'weekly', 'daily').optional(),
    isOccupied: Joi.boolean().optional(),
  }),

  propertyDescriptionEnhancement: Joi.object({
    keywords: Joi.string().min(3).max(200).required(),
  }),

  // Rent Agreement schemas
  rentAgreementCreate: Joi.object({
    propertyId: Joi.number().integer().positive().required(),
    tenantId: Joi.number().integer().positive().required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    agreementSpanMonths: Joi.number().integer().min(1).max(120).required(),
    monthlyRent: Joi.number().positive().required(),
    securityDeposit: Joi.number().min(0).required(),
    paymentMode: Joi.string().valid('monthly', 'weekly', 'daily').required(),
    conditions: Joi.string().max(2000).optional(),
    specialTerms: Joi.string().max(2000).optional(),
  }),

  rentAgreementUpdate: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    agreementSpanMonths: Joi.number().integer().min(1).max(120).optional(),
    monthlyRent: Joi.number().positive().optional(),
    securityDeposit: Joi.number().min(0).optional(),
    paymentMode: Joi.string().valid('monthly', 'weekly', 'daily').optional(),
    conditions: Joi.string().max(2000).optional(),
    specialTerms: Joi.string().max(2000).optional(),
    isActive: Joi.boolean().optional(),
    isTerminated: Joi.boolean().optional(),
    terminationDate: Joi.date().iso().optional(),
    terminationReason: Joi.string().max(1000).optional(),
  }),

  // Payment schemas
  paymentCreate: Joi.object({
    payerId: Joi.number().integer().positive().required(),
    rentAgreementId: Joi.number().integer().positive().required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).uppercase().optional(),
    paymentType: Joi.string().min(3).max(50).required(),
    paymentMethod: Joi.string().min(3).max(50).optional(),
    paymentPeriodStart: Joi.date().iso().optional(),
    paymentPeriodEnd: Joi.date().iso().optional(),
    dueDate: Joi.date().iso().required(),
    description: Joi.string().max(500).optional(),
    notes: Joi.string().max(1000).optional(),
  }),

  paymentUpdate: Joi.object({
    amount: Joi.number().positive().optional(),
    currency: Joi.string().length(3).uppercase().optional(),
    paymentType: Joi.string().min(3).max(50).optional(),
    paymentMethod: Joi.string().min(3).max(50).optional(),
    status: Joi.string().valid('pending', 'completed', 'failed', 'refunded').optional(),
    paymentPeriodStart: Joi.date().iso().optional(),
    paymentPeriodEnd: Joi.date().iso().optional(),
    dueDate: Joi.date().iso().optional(),
    description: Joi.string().max(500).optional(),
    notes: Joi.string().max(1000).optional(),
    paidAt: Joi.date().iso().optional(),
  }),

  // X402 Payment schemas
  x402PaymentRequest: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).uppercase().optional(),
    description: Joi.string().min(5).max(200).required(),
    paymentReference: Joi.string().min(5).max(50).required(),
  }),

  // Common schemas
  idParam: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};

export default { validate, validateQuery, validateParams, schemas };
