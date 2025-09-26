from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import crud, schemas, auth, models
from app.llm_service import llm_service

router = APIRouter()

@router.post("/", response_model=schemas.PropertyResponse)
def create_property(
    property: schemas.PropertyCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Create a new property listing"""
    # Only owners can create properties
    if current_user.user_type != models.UserType.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only property owners can create listings"
        )
    
    return crud.create_property(db=db, property=property, owner_id=current_user.id)

@router.get("/search", response_model=List[schemas.PropertyResponse])
def search_properties(
    city: str = None,
    state: str = None,
    country: str = None,
    pincode: str = None,
    min_rent: float = None,
    max_rent: float = None,
    min_rooms: int = None,
    max_rooms: int = None,
    has_kitchen: bool = None,
    has_bathroom: bool = None,
    payment_mode: models.PaymentMode = None,
    is_occupied: bool = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Search properties based on various criteria"""
    search_params = schemas.PropertySearch(
        city=city,
        state=state,
        country=country,
        pincode=pincode,
        min_rent=min_rent,
        max_rent=max_rent,
        min_rooms=min_rooms,
        max_rooms=max_rooms,
        has_kitchen=has_kitchen,
        has_bathroom=has_bathroom,
        payment_mode=payment_mode,
        is_occupied=is_occupied
    )
    return crud.search_properties(db=db, search_params=search_params, skip=skip, limit=limit)

@router.get("/my-properties", response_model=List[schemas.PropertyResponse])
def get_my_properties(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Get properties owned by current user"""
    return crud.get_properties_by_owner(db=db, owner_id=current_user.id, skip=skip, limit=limit)

@router.get("/{property_id}", response_model=schemas.PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    """Get property by ID"""
    db_property = crud.get_property(db, property_id=property_id)
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return db_property

@router.get("/", response_model=List[schemas.PropertyResponse])
def get_properties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get list of all active properties"""
    properties = crud.get_properties(db, skip=skip, limit=limit)
    return properties

@router.put("/{property_id}", response_model=schemas.PropertyResponse)
def update_property(
    property_id: int,
    property_update: schemas.PropertyUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Update property information"""
    # Check if property exists and user owns it
    db_property = crud.get_property(db, property_id=property_id)
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if db_property.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    updated_property = crud.update_property(db, property_id=property_id, property_update=property_update)
    return updated_property

@router.delete("/{property_id}")
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Delete property (marks as inactive)"""
    # Check if property exists and user owns it
    db_property = crud.get_property(db, property_id=property_id)
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if db_property.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    success = crud.delete_property(db, property_id=property_id)
    if not success:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"message": "Property deleted successfully"}

async def enhance_description_background(property_id: int, keywords: str, db: Session):
    """Background task to enhance property description using LLM"""
    try:
        property = crud.get_property(db, property_id)
        if property:
            enhanced_description = await llm_service.enhance_property_description(
                title=property.title,
                description=property.description or "",
                keywords=keywords,
                number_of_rooms=property.number_of_rooms,
                has_kitchen=property.has_kitchen,
                has_bathroom=property.has_bathroom,
                number_of_bathrooms=property.number_of_bathrooms,
                rent_amount=property.rent_amount,
                payment_mode=property.payment_mode.value,
                address=property.address,
                city=property.city,
                state=property.state,
                country=property.country
            )
            crud.update_property_description(db, property_id, enhanced_description)
    except Exception as e:
        # Log error in production
        print(f"Error enhancing description: {e}")

@router.post("/{property_id}/enhance-description")
def enhance_property_description(
    property_id: int,
    enhancement_request: schemas.PropertyDescriptionEnhancement,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_active_user)
):
    """Enhance property description using LLM"""
    # Check if property exists and user owns it
    db_property = crud.get_property(db, property_id=property_id)
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if db_property.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Add background task to enhance description
    background_tasks.add_task(
        enhance_description_background,
        property_id,
        enhancement_request.keywords,
        db
    )
    
    return {"message": "Description enhancement started. Check back in a few moments."}
