from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models import UserType, PaymentMode, PaymentStatus

# User Schemas
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    user_type: Optional[UserType] = None

class UserCreate(UserBase):
    password: Optional[str] = None  # Not required for Privy users

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    user_type: Optional[UserType] = None

class UserResponse(UserBase):
    id: int
    privy_id: Optional[str] = None
    profile_id: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

# Privy Authentication Schemas
class PrivyAuthRequest(BaseModel):
    access_token: str

class PrivyUserData(BaseModel):
    privy_id: str
    profile_id: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None

class PrivyAuthResponse(BaseModel):
    user: UserResponse
    is_new_user: bool

# Property Schemas
class PropertyBase(BaseModel):
    title: str
    description: Optional[str] = None
    number_of_rooms: int
    has_kitchen: bool = False
    has_bathroom: bool = False
    number_of_bathrooms: int = 1
    rent_amount: float
    deposit_amount: float = 0.0
    payment_mode: PaymentMode
    address: str
    city: str
    state: str
    country: str
    pincode: str

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    number_of_rooms: Optional[int] = None
    has_kitchen: Optional[bool] = None
    has_bathroom: Optional[bool] = None
    number_of_bathrooms: Optional[int] = None
    rent_amount: Optional[float] = None
    deposit_amount: Optional[float] = None
    payment_mode: Optional[PaymentMode] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    is_occupied: Optional[bool] = None
    is_active: Optional[bool] = None

class PropertyResponse(PropertyBase):
    id: int
    enhanced_description: Optional[str] = None
    is_occupied: bool
    is_active: bool
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

class PropertySearch(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    min_rent: Optional[float] = None
    max_rent: Optional[float] = None
    min_rooms: Optional[int] = None
    max_rooms: Optional[int] = None
    has_kitchen: Optional[bool] = None
    has_bathroom: Optional[bool] = None
    payment_mode: Optional[PaymentMode] = None
    is_occupied: Optional[bool] = None

class PropertyDescriptionEnhancement(BaseModel):
    keywords: str = Field(..., description="Keywords to enhance the property description")

# Rent Agreement Schemas
class RentAgreementBase(BaseModel):
    start_date: datetime
    end_date: datetime
    agreement_span_months: int
    monthly_rent: float
    security_deposit: float
    payment_mode: PaymentMode
    conditions: Optional[str] = None
    special_terms: Optional[str] = None

class RentAgreementCreate(RentAgreementBase):
    property_id: int
    tenant_id: int

class RentAgreementUpdate(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    agreement_span_months: Optional[int] = None
    monthly_rent: Optional[float] = None
    security_deposit: Optional[float] = None
    payment_mode: Optional[PaymentMode] = None
    conditions: Optional[str] = None
    special_terms: Optional[str] = None
    is_active: Optional[bool] = None
    is_terminated: Optional[bool] = None
    termination_date: Optional[datetime] = None
    termination_reason: Optional[str] = None

class RentAgreementResponse(RentAgreementBase):
    id: int
    agreement_number: str
    is_active: bool
    is_terminated: bool
    termination_date: Optional[datetime] = None
    termination_reason: Optional[str] = None
    property_id: int
    tenant_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

# Payment Schemas
class PaymentBase(BaseModel):
    amount: float
    currency: str = "USD"
    payment_type: str
    payment_method: Optional[str] = None
    payment_period_start: Optional[datetime] = None
    payment_period_end: Optional[datetime] = None
    due_date: datetime
    description: Optional[str] = None
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    payer_id: int
    rent_agreement_id: int

class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    currency: Optional[str] = None
    payment_type: Optional[str] = None
    payment_method: Optional[str] = None
    status: Optional[PaymentStatus] = None
    payment_period_start: Optional[datetime] = None
    payment_period_end: Optional[datetime] = None
    due_date: Optional[datetime] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    paid_at: Optional[datetime] = None

class PaymentResponse(PaymentBase):
    id: int
    payment_reference: str
    status: PaymentStatus
    x402_payment_id: Optional[str] = None
    x402_transaction_hash: Optional[str] = None
    payer_id: int
    rent_agreement_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

# X402 Payment Schemas
class X402PaymentRequest(BaseModel):
    amount: float
    currency: str = "USD"
    description: str
    payment_reference: str

class X402PaymentResponse(BaseModel):
    payment_id: str
    payment_url: str
    status: str
    transaction_hash: Optional[str] = None

# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str
