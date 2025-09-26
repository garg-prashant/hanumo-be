import { Router, Request, Response } from 'express';
import { db } from '@/services/database';
import { x402Service } from '@/services/x402';
import { requireAuth, requireActiveUser, getCurrentUser } from '@/middleware/auth';
import { validate, schemas } from '@/utils/validation';
import { ApiResponse, Payment, PaymentCreate, X402PaymentRequest, X402PaymentResponse } from '@/types';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * POST /api/v1/payments
 * Create a new payment
 */
router.post('/', requireActiveUser, validate(schemas.paymentCreate), async (req: Request, res: Response) => {
  try {
    const currentUser = getCurrentUser(req);
    
    if (!currentUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    const paymentData: PaymentCreate = {
      ...req.body,
      payerId: currentUser.id, // Override with current user ID
    };

    const payment = await db.payment.create(paymentData);

    const response: ApiResponse<Payment> = {
      success: true,
      data: payment,
      message: 'Payment created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Create payment failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to create payment',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/v1/payments
 * Get all payments for current user
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

    const payments = await db.payment.findByPayerId(currentUser.id);

    const response: ApiResponse<Payment[]> = {
      success: true,
      data: payments,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get payments failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get payments',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/v1/payments/:id
 * Get payment by ID
 */
router.get('/:id', requireActiveUser, async (req: Request, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    
    if (isNaN(paymentId)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid payment ID',
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

    const payment = await db.payment.findById(paymentId);
    
    if (!payment) {
      const response: ApiResponse = {
        success: false,
        message: 'Payment not found',
      };
      return res.status(404).json(response);
    }

    // Check if user is authorized to view this payment
    if (payment.payerId !== currentUser.id) {
      const response: ApiResponse = {
        success: false,
        message: 'Unauthorized to view this payment',
      };
      return res.status(403).json(response);
    }

    const response: ApiResponse<Payment> = {
      success: true,
      data: payment,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get payment failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get payment',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * PUT /api/v1/payments/:id
 * Update payment
 */
router.put('/:id', requireActiveUser, validate(schemas.paymentUpdate), async (req: Request, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    
    if (isNaN(paymentId)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid payment ID',
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

    // Check if payment exists and user is authorized
    const existingPayment = await db.payment.findById(paymentId);
    
    if (!existingPayment) {
      const response: ApiResponse = {
        success: false,
        message: 'Payment not found',
      };
      return res.status(404).json(response);
    }

    if (existingPayment.payerId !== currentUser.id) {
      const response: ApiResponse = {
        success: false,
        message: 'Unauthorized to update this payment',
      };
      return res.status(403).json(response);
    }

    const updatedPayment = await db.payment.update(paymentId, req.body);
    
    if (!updatedPayment) {
      const response: ApiResponse = {
        success: false,
        message: 'Failed to update payment',
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse<Payment> = {
      success: true,
      data: updatedPayment,
      message: 'Payment updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Update payment failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update payment',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/v1/payments/rent-agreement/:rentAgreementId
 * Get payments for a specific rent agreement
 */
router.get('/rent-agreement/:rentAgreementId', requireActiveUser, async (req: Request, res: Response) => {
  try {
    const rentAgreementId = parseInt(req.params.rentAgreementId);
    
    if (isNaN(rentAgreementId)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid rent agreement ID',
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

    const payments = await db.payment.findByRentAgreementId(rentAgreementId);

    // Filter payments to only show those belonging to the current user
    const userPayments = payments.filter(payment => payment.payerId === currentUser.id);

    const response: ApiResponse<Payment[]> = {
      success: true,
      data: userPayments,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get rent agreement payments failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get rent agreement payments',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/v1/payments/x402/create
 * Create X402 payment
 */
router.post('/x402/create', requireActiveUser, validate(schemas.x402PaymentRequest), async (req: Request, res: Response) => {
  try {
    const paymentRequest: X402PaymentRequest = req.body;
    const x402Payment = await x402Service.createPayment(paymentRequest);

    const response: ApiResponse<X402PaymentResponse> = {
      success: true,
      data: x402Payment,
      message: 'X402 payment created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Create X402 payment failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to create X402 payment',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/v1/payments/x402/:paymentId/status
 * Get X402 payment status
 */
router.get('/x402/:paymentId/status', requireActiveUser, async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const status = await x402Service.getPaymentStatus(paymentId);

    const response: ApiResponse<typeof status> = {
      success: true,
      data: status,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get X402 payment status failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to get X402 payment status',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/v1/payments/x402/callback
 * Handle X402 payment webhook
 */
router.post('/x402/callback', async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;
    const processedWebhook = await x402Service.processWebhook(webhookData);

    // Update payment status in database if needed
    // This would typically involve finding the payment by reference and updating its status

    const response: ApiResponse<typeof processedWebhook> = {
      success: true,
      data: processedWebhook,
      message: 'Webhook processed successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Process X402 webhook failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to process webhook',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/v1/payments/x402/:paymentId/refund
 * Refund X402 payment
 */
router.post('/x402/:paymentId/refund', requireActiveUser, async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { amount } = req.body;

    const refund = await x402Service.refundPayment(paymentId, amount);

    const response: ApiResponse<typeof refund> = {
      success: true,
      data: refund,
      message: 'Payment refunded successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Refund X402 payment failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to refund payment',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

export default router;
