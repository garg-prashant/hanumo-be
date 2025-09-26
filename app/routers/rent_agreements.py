from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import crud, schemas, auth, models

router = APIRouter()

@router.post("/", response_model=schemas.RentAgreementResponse)
def create_rent_agreement(
    agreement: schemas.RentAgreementCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Create a new rent agreement"""
    # Check if property exists
    property = crud.get_property(db, agreement.property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Check if property is already occupied
    if property.is_occupied:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Property is already occupied"
        )
    
    # Check if there's already an active agreement for this property
    existing_agreement = crud.get_active_rent_agreement_by_property(db, agreement.property_id)
    if existing_agreement:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Property already has an active rent agreement"
        )
    
    # Only property owner can create agreements
    if property.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only property owner can create rent agreements"
        )
    
    # Check if tenant exists
    tenant = crud.get_user(db, agreement.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if tenant.user_type != models.UserType.TENANT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected user is not a tenant"
        )
    
    return crud.create_rent_agreement(db=db, agreement=agreement)

@router.get("/my-agreements", response_model=List[schemas.RentAgreementResponse])
def get_my_agreements(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Get rent agreements for current user (as tenant or as property owner)"""
    if current_user.user_type == models.UserType.TENANT:
        return crud.get_rent_agreements_by_tenant(db=db, tenant_id=current_user.id, skip=skip, limit=limit)
    else:
        # For owners, get agreements for their properties
        agreements = []
        properties = crud.get_properties_by_owner(db=db, owner_id=current_user.id, skip=0, limit=1000)
        for property in properties:
            prop_agreements = crud.get_rent_agreements_by_property(db=db, property_id=property.id, skip=0, limit=100)
            agreements.extend(prop_agreements)
        return agreements[skip:skip+limit]

@router.get("/property/{property_id}", response_model=List[schemas.RentAgreementResponse])
def get_agreements_by_property(
    property_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Get rent agreements for a specific property"""
    # Check if property exists
    property = crud.get_property(db, property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Only property owner can view agreements
    if property.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return crud.get_rent_agreements_by_property(db=db, property_id=property_id, skip=skip, limit=limit)

@router.get("/{agreement_id}", response_model=schemas.RentAgreementResponse)
def get_rent_agreement(
    agreement_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Get rent agreement by ID"""
    agreement = crud.get_rent_agreement(db, agreement_id=agreement_id)
    if agreement is None:
        raise HTTPException(status_code=404, detail="Rent agreement not found")
    
    # Check permissions - either tenant or property owner can view
    property = crud.get_property(db, agreement.property_id)
    if current_user.id != agreement.tenant_id and current_user.id != property.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return agreement

@router.get("/", response_model=List[schemas.RentAgreementResponse])
def get_rent_agreements(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Get list of all rent agreements (admin only for now)"""
    agreements = crud.get_rent_agreements(db, skip=skip, limit=limit)
    return agreements

@router.put("/{agreement_id}", response_model=schemas.RentAgreementResponse)
def update_rent_agreement(
    agreement_id: int,
    agreement_update: schemas.RentAgreementUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Update rent agreement"""
    # Check if agreement exists
    agreement = crud.get_rent_agreement(db, agreement_id=agreement_id)
    if agreement is None:
        raise HTTPException(status_code=404, detail="Rent agreement not found")
    
    # Check permissions - only property owner can update
    property = crud.get_property(db, agreement.property_id)
    if current_user.id != property.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only property owner can update rent agreements"
        )
    
    updated_agreement = crud.update_rent_agreement(db, agreement_id=agreement_id, agreement_update=agreement_update)
    return updated_agreement

@router.post("/{agreement_id}/terminate")
def terminate_rent_agreement(
    agreement_id: int,
    termination_reason: str,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Terminate rent agreement"""
    # Check if agreement exists
    agreement = crud.get_rent_agreement(db, agreement_id=agreement_id)
    if agreement is None:
        raise HTTPException(status_code=404, detail="Rent agreement not found")
    
    # Check permissions - either tenant or property owner can terminate
    property = crud.get_property(db, agreement.property_id)
    if current_user.id != agreement.tenant_id and current_user.id != property.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    terminated_agreement = crud.terminate_rent_agreement(db, agreement_id=agreement_id, termination_reason=termination_reason)
    if terminated_agreement is None:
        raise HTTPException(status_code=404, detail="Rent agreement not found")
    
    return {"message": "Rent agreement terminated successfully"}
