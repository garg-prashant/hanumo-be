from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from passlib.context import CryptContext
import uuid
from datetime import datetime
import hashlib
import os

from app import models, schemas

# Use a more robust password context with fallback
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception:
    # Fallback for testing environments
    pwd_context = None

# User CRUD operations
def get_password_hash(password: str) -> str:
    """Hash password using bcrypt or fallback to SHA256 for testing"""
    if pwd_context:
        try:
            # Truncate password to 72 bytes for bcrypt compatibility
            if len(password.encode('utf-8')) > 72:
                password = password[:72]
            return pwd_context.hash(password)
        except Exception:
            pass
    
    # Fallback to SHA256 with salt for testing
    salt = os.urandom(32)
    return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000).hex() + salt.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using bcrypt or fallback to SHA256 for testing"""
    if pwd_context:
        try:
            # Truncate password to 72 bytes for bcrypt compatibility
            if len(plain_password.encode('utf-8')) > 72:
                plain_password = plain_password[:72]
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            pass
    
    # Fallback verification for SHA256
    if len(hashed_password) > 64:  # SHA256 + salt
        stored_hash = hashed_password[:64]
        salt = bytes.fromhex(hashed_password[64:])
        test_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000).hex()
        return stored_hash == test_hash
    
    return False

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_privy_id(db: Session, privy_id: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.privy_id == privy_id).first()

def get_user_by_profile_id(db: Session, profile_id: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.profile_id == profile_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = None
    if user.password:
        hashed_password = get_password_hash(user.password)
    
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        phone_number=user.phone_number,
        user_type=user.user_type
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_privy_user(db: Session, privy_data: schemas.PrivyUserData) -> models.User:
    """Create a new user from Privy authentication data"""
    db_user = models.User(
        privy_id=privy_data.privy_id,
        profile_id=privy_data.profile_id,
        email=privy_data.email,
        full_name=privy_data.full_name,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate) -> Optional[models.User]:
    db_user = get_user(db, user_id)
    if db_user:
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_user, field, value)
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False

# Property CRUD operations
def get_property(db: Session, property_id: int) -> Optional[models.Property]:
    return db.query(models.Property).filter(models.Property.id == property_id).first()

def get_properties(db: Session, skip: int = 0, limit: int = 100) -> List[models.Property]:
    return db.query(models.Property).filter(models.Property.is_active == True).offset(skip).limit(limit).all()

def get_properties_by_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Property]:
    return db.query(models.Property).filter(
        and_(models.Property.owner_id == owner_id, models.Property.is_active == True)
    ).offset(skip).limit(limit).all()

def search_properties(db: Session, search_params: schemas.PropertySearch, skip: int = 0, limit: int = 100) -> List[models.Property]:
    query = db.query(models.Property).filter(models.Property.is_active == True)
    
    if search_params.city:
        query = query.filter(models.Property.city.ilike(f"%{search_params.city}%"))
    if search_params.state:
        query = query.filter(models.Property.state.ilike(f"%{search_params.state}%"))
    if search_params.country:
        query = query.filter(models.Property.country.ilike(f"%{search_params.country}%"))
    if search_params.pincode:
        query = query.filter(models.Property.pincode == search_params.pincode)
    if search_params.min_rent is not None:
        query = query.filter(models.Property.rent_amount >= search_params.min_rent)
    if search_params.max_rent is not None:
        query = query.filter(models.Property.rent_amount <= search_params.max_rent)
    if search_params.min_rooms is not None:
        query = query.filter(models.Property.number_of_rooms >= search_params.min_rooms)
    if search_params.max_rooms is not None:
        query = query.filter(models.Property.number_of_rooms <= search_params.max_rooms)
    if search_params.has_kitchen is not None:
        query = query.filter(models.Property.has_kitchen == search_params.has_kitchen)
    if search_params.has_bathroom is not None:
        query = query.filter(models.Property.has_bathroom == search_params.has_bathroom)
    if search_params.payment_mode:
        query = query.filter(models.Property.payment_mode == search_params.payment_mode)
    if search_params.is_occupied is not None:
        query = query.filter(models.Property.is_occupied == search_params.is_occupied)
    
    return query.offset(skip).limit(limit).all()

def create_property(db: Session, property: schemas.PropertyCreate, owner_id: int) -> models.Property:
    db_property = models.Property(
        **property.dict(),
        owner_id=owner_id
    )
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property

def update_property(db: Session, property_id: int, property_update: schemas.PropertyUpdate) -> Optional[models.Property]:
    db_property = get_property(db, property_id)
    if db_property:
        update_data = property_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_property, field, value)
        db.commit()
        db.refresh(db_property)
    return db_property

def update_property_description(db: Session, property_id: int, enhanced_description: str) -> Optional[models.Property]:
    db_property = get_property(db, property_id)
    if db_property:
        db_property.enhanced_description = enhanced_description
        db.commit()
        db.refresh(db_property)
    return db_property

def delete_property(db: Session, property_id: int) -> bool:
    db_property = get_property(db, property_id)
    if db_property:
        db_property.is_active = False
        db.commit()
        return True
    return False

# Rent Agreement CRUD operations
def get_rent_agreement(db: Session, agreement_id: int) -> Optional[models.RentAgreement]:
    return db.query(models.RentAgreement).filter(models.RentAgreement.id == agreement_id).first()

def get_rent_agreements(db: Session, skip: int = 0, limit: int = 100) -> List[models.RentAgreement]:
    return db.query(models.RentAgreement).offset(skip).limit(limit).all()

def get_rent_agreements_by_tenant(db: Session, tenant_id: int, skip: int = 0, limit: int = 100) -> List[models.RentAgreement]:
    return db.query(models.RentAgreement).filter(
        models.RentAgreement.tenant_id == tenant_id
    ).offset(skip).limit(limit).all()

def get_rent_agreements_by_property(db: Session, property_id: int, skip: int = 0, limit: int = 100) -> List[models.RentAgreement]:
    return db.query(models.RentAgreement).filter(
        models.RentAgreement.property_id == property_id
    ).offset(skip).limit(limit).all()

def get_active_rent_agreement_by_property(db: Session, property_id: int) -> Optional[models.RentAgreement]:
    return db.query(models.RentAgreement).filter(
        and_(
            models.RentAgreement.property_id == property_id,
            models.RentAgreement.is_active == True,
            models.RentAgreement.is_terminated == False
        )
    ).first()

def create_rent_agreement(db: Session, agreement: schemas.RentAgreementCreate) -> models.RentAgreement:
    agreement_number = f"RA-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    db_agreement = models.RentAgreement(
        **agreement.dict(),
        agreement_number=agreement_number
    )
    db.add(db_agreement)
    
    # Update property occupation status
    property = get_property(db, agreement.property_id)
    if property:
        property.is_occupied = True
    
    db.commit()
    db.refresh(db_agreement)
    return db_agreement

def update_rent_agreement(db: Session, agreement_id: int, agreement_update: schemas.RentAgreementUpdate) -> Optional[models.RentAgreement]:
    db_agreement = get_rent_agreement(db, agreement_id)
    if db_agreement:
        update_data = agreement_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_agreement, field, value)
        
        # If terminating agreement, update property occupation status
        if update_data.get('is_terminated'):
            property = get_property(db, db_agreement.property_id)
            if property:
                property.is_occupied = False
        
        db.commit()
        db.refresh(db_agreement)
    return db_agreement

def terminate_rent_agreement(db: Session, agreement_id: int, termination_reason: str) -> Optional[models.RentAgreement]:
    db_agreement = get_rent_agreement(db, agreement_id)
    if db_agreement:
        db_agreement.is_terminated = True
        db_agreement.termination_date = datetime.now()
        db_agreement.termination_reason = termination_reason
        db_agreement.is_active = False
        
        # Update property occupation status
        property = get_property(db, db_agreement.property_id)
        if property:
            property.is_occupied = False
        
        db.commit()
        db.refresh(db_agreement)
    return db_agreement

# Payment CRUD operations
def get_payment(db: Session, payment_id: int) -> Optional[models.Payment]:
    return db.query(models.Payment).filter(models.Payment.id == payment_id).first()

def get_payment_by_reference(db: Session, payment_reference: str) -> Optional[models.Payment]:
    return db.query(models.Payment).filter(models.Payment.payment_reference == payment_reference).first()

def get_payments(db: Session, skip: int = 0, limit: int = 100) -> List[models.Payment]:
    return db.query(models.Payment).offset(skip).limit(limit).all()

def get_payments_by_payer(db: Session, payer_id: int, skip: int = 0, limit: int = 100) -> List[models.Payment]:
    return db.query(models.Payment).filter(
        models.Payment.payer_id == payer_id
    ).offset(skip).limit(limit).all()

def get_payments_by_agreement(db: Session, agreement_id: int, skip: int = 0, limit: int = 100) -> List[models.Payment]:
    return db.query(models.Payment).filter(
        models.Payment.rent_agreement_id == agreement_id
    ).offset(skip).limit(limit).all()

def get_pending_payments(db: Session, skip: int = 0, limit: int = 100) -> List[models.Payment]:
    return db.query(models.Payment).filter(
        models.Payment.status == models.PaymentStatus.PENDING
    ).offset(skip).limit(limit).all()

def create_payment(db: Session, payment: schemas.PaymentCreate) -> models.Payment:
    payment_reference = f"PAY-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    db_payment = models.Payment(
        **payment.dict(),
        payment_reference=payment_reference
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

def update_payment(db: Session, payment_id: int, payment_update: schemas.PaymentUpdate) -> Optional[models.Payment]:
    db_payment = get_payment(db, payment_id)
    if db_payment:
        update_data = payment_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_payment, field, value)
        
        # Set paid_at timestamp if payment is marked as completed
        if update_data.get('status') == models.PaymentStatus.COMPLETED and not db_payment.paid_at:
            db_payment.paid_at = datetime.now()
        
        db.commit()
        db.refresh(db_payment)
    return db_payment

def update_payment_x402_details(db: Session, payment_id: int, x402_payment_id: str, x402_transaction_hash: str = None) -> Optional[models.Payment]:
    db_payment = get_payment(db, payment_id)
    if db_payment:
        db_payment.x402_payment_id = x402_payment_id
        if x402_transaction_hash:
            db_payment.x402_transaction_hash = x402_transaction_hash
        db.commit()
        db.refresh(db_payment)
    return db_payment
