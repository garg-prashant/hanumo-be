from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class UserType(str, enum.Enum):
    TENANT = "tenant"
    OWNER = "owner"

class PaymentMode(str, enum.Enum):
    MONTHLY = "monthly"
    WEEKLY = "weekly"
    DAILY = "daily"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone_number = Column(String)
    user_type = Column(Enum(UserType), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owned_properties = relationship("Property", back_populates="owner")
    tenant_agreements = relationship("RentAgreement", back_populates="tenant")
    payments_made = relationship("Payment", back_populates="payer")

class Property(Base):
    __tablename__ = "properties"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    enhanced_description = Column(Text)  # LLM enhanced description
    
    # Property details
    number_of_rooms = Column(Integer, nullable=False)
    has_kitchen = Column(Boolean, default=False)
    has_bathroom = Column(Boolean, default=False)
    number_of_bathrooms = Column(Integer, default=1)
    
    # Financial details
    rent_amount = Column(Float, nullable=False)
    deposit_amount = Column(Float, default=0.0)
    payment_mode = Column(Enum(PaymentMode), nullable=False)
    
    # Location details
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    country = Column(String, nullable=False)
    pincode = Column(String, nullable=False)
    
    # Status
    is_occupied = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Foreign keys
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="owned_properties")
    rent_agreements = relationship("RentAgreement", back_populates="property")

class RentAgreement(Base):
    __tablename__ = "rent_agreements"
    
    id = Column(Integer, primary_key=True, index=True)
    agreement_number = Column(String, unique=True, index=True, nullable=False)
    
    # Agreement details
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    agreement_span_months = Column(Integer, nullable=False)
    
    # Financial terms
    monthly_rent = Column(Float, nullable=False)
    security_deposit = Column(Float, nullable=False)
    payment_mode = Column(Enum(PaymentMode), nullable=False)
    
    # Terms and conditions
    conditions = Column(Text)
    special_terms = Column(Text)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_terminated = Column(Boolean, default=False)
    termination_date = Column(DateTime(timezone=True))
    termination_reason = Column(Text)
    
    # Foreign keys
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    property = relationship("Property", back_populates="rent_agreements")
    tenant = relationship("User", back_populates="tenant_agreements")
    payments = relationship("Payment", back_populates="rent_agreement")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    payment_reference = Column(String, unique=True, index=True, nullable=False)
    
    # Payment details
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    payment_type = Column(String, nullable=False)  # rent, deposit, maintenance, etc.
    
    # Payment method and status
    payment_method = Column(String)  # x402, bank_transfer, cash, etc.
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # X402 specific fields
    x402_payment_id = Column(String)  # X402 payment identifier
    x402_transaction_hash = Column(String)  # Blockchain transaction hash
    
    # Payment periods
    payment_period_start = Column(DateTime(timezone=True))
    payment_period_end = Column(DateTime(timezone=True))
    due_date = Column(DateTime(timezone=True), nullable=False)
    
    # Additional details
    description = Column(Text)
    notes = Column(Text)
    
    # Foreign keys
    payer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rent_agreement_id = Column(Integer, ForeignKey("rent_agreements.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    paid_at = Column(DateTime(timezone=True))
    
    # Relationships
    payer = relationship("User", back_populates="payments_made")
    rent_agreement = relationship("RentAgreement", back_populates="payments")
