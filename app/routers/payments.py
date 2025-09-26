from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app import crud, schemas, auth, models
from app.x402_service import x402_service

router = APIRouter()

@router.post("/", response_model=schemas.PaymentResponse)
def create_payment(
    payment: schemas.PaymentCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Create a new payment"""
    # Check if rent agreement exists
    agreement = crud.get_rent_agreement(db, payment.rent_agreement_id)
    if not agreement:
        raise HTTPException(status_code=404, detail="Rent agreement not found")
    
    # Check permissions - either tenant or property owner can create payments
    property = crud.get_property(db, agreement.property_id)
    if current_user.id != agreement.tenant_id and current_user.id != property.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if payer exists
    payer = crud.get_user(db, payment.payer_id)
    if not payer:
        raise HTTPException(status_code=404, detail="Payer not found")
    
    return crud.create_payment(db=db, payment=payment)

@router.post("/{payment_id}/pay-with-x402", response_model=schemas.X402PaymentResponse)
async def pay_with_x402(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Initiate X402 payment for a payment record"""
    # Get payment
    payment = crud.get_payment(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Check if current user is the payer
    if current_user.id != payment.payer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the payer can initiate payment"
        )
    
    # Check if payment is still pending
    if payment.status != models.PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment is not in pending status"
        )
    
    try:
        # Create X402 payment request
        x402_request = schemas.X402PaymentRequest(
            amount=payment.amount,
            currency=payment.currency,
            description=f"Rent payment - {payment.description}",
            payment_reference=payment.payment_reference
        )
        
        # Initiate X402 payment
        x402_response = await x402_service.create_payment(x402_request)
        
        # Update payment with X402 details
        crud.update_payment_x402_details(
            db, 
            payment_id, 
            x402_response.payment_id
        )
        
        # Update payment method
        payment_update = schemas.PaymentUpdate(payment_method="x402")
        crud.update_payment(db, payment_id, payment_update)
        
        return x402_response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"X402 payment initiation failed: {str(e)}"
        )

@router.post("/x402/callback")
async def x402_webhook_callback(request: Request, db: Session = Depends(get_db)):
    """Handle X402 webhook callbacks"""
    try:
        webhook_data = await request.json()
        
        # Process webhook
        processed_data = await x402_service.process_webhook(webhook_data)
        
        # Find payment by X402 payment ID
        payment = db.query(models.Payment).filter(
            models.Payment.x402_payment_id == processed_data["payment_id"]
        ).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Update payment status based on webhook
        status_map = {
            "completed": models.PaymentStatus.COMPLETED,
            "failed": models.PaymentStatus.FAILED,
            "refunded": models.PaymentStatus.REFUNDED
        }
        
        new_status = status_map.get(processed_data["status"], models.PaymentStatus.PENDING)
        
        payment_update = schemas.PaymentUpdate(
            status=new_status
        )
        
        # Update transaction hash if provided
        if processed_data.get("transaction_hash"):
            crud.update_payment_x402_details(
                db,
                payment.id,
                payment.x402_payment_id,
                processed_data["transaction_hash"]
            )
        
        crud.update_payment(db, payment.id, payment_update)
        
        return {"status": "success", "message": "Webhook processed successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing failed: {str(e)}"
        )

@router.get("/my-payments", response_model=List[schemas.PaymentResponse])
def get_my_payments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Get payments made by current user"""
    return crud.get_payments_by_payer(db=db, payer_id=current_user.id, skip=skip, limit=limit)

@router.get("/agreement/{agreement_id}", response_model=List[schemas.PaymentResponse])
def get_payments_by_agreement(
    agreement_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Get payments for a specific rent agreement"""
    # Check if agreement exists
    agreement = crud.get_rent_agreement(db, agreement_id)
    if not agreement:
        raise HTTPException(status_code=404, detail="Rent agreement not found")
    
    # Check permissions
    property = crud.get_property(db, agreement.property_id)
    if current_user.id != agreement.tenant_id and current_user.id != property.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return crud.get_payments_by_agreement(db=db, agreement_id=agreement_id, skip=skip, limit=limit)

@router.get("/{payment_id}", response_model=schemas.PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Get payment by ID"""
    payment = crud.get_payment(db, payment_id=payment_id)
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Check permissions - payer or property owner can view
    agreement = crud.get_rent_agreement(db, payment.rent_agreement_id)
    property = crud.get_property(db, agreement.property_id)
    
    if current_user.id != payment.payer_id and current_user.id != property.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return payment

@router.get("/", response_model=List[schemas.PaymentResponse])
def get_payments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Get list of all payments"""
    payments = crud.get_payments(db, skip=skip, limit=limit)
    return payments

@router.get("/status/pending", response_model=List[schemas.PaymentResponse])
def get_pending_payments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Get pending payments"""
    return crud.get_pending_payments(db=db, skip=skip, limit=limit)

@router.put("/{payment_id}", response_model=schemas.PaymentResponse)
def update_payment(
    payment_id: int,
    payment_update: schemas.PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Update payment information"""
    # Check if payment exists
    payment = crud.get_payment(db, payment_id=payment_id)
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Check permissions - only property owner can update payments
    agreement = crud.get_rent_agreement(db, payment.rent_agreement_id)
    property = crud.get_property(db, agreement.property_id)
    
    if current_user.id != property.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only property owner can update payments"
        )
    
    updated_payment = crud.update_payment(db, payment_id=payment_id, payment_update=payment_update)
    return updated_payment

@router.get("/{payment_id}/x402-status")
async def get_x402_payment_status(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Get X402 payment status"""
    payment = crud.get_payment(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Check permissions
    if current_user.id != payment.payer_id:
        agreement = crud.get_rent_agreement(db, payment.rent_agreement_id)
        property = crud.get_property(db, agreement.property_id)
        if current_user.id != property.owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    if not payment.x402_payment_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment was not made through X402"
        )
    
    try:
        x402_status = await x402_service.get_payment_status(payment.x402_payment_id)
        return x402_status
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get X402 status: {str(e)}"
        )
