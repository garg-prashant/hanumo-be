import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import get_db, Base
from main import app
from app import models

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop tables
    Base.metadata.drop_all(bind=engine)

def test_read_root():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Hanumo Property Rental System"}

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_user_registration():
    """Test user registration"""
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpassword",
        "full_name": "Test User",
        "phone_number": "1234567890",
        "user_type": "owner"
    }
    
    response = client.post("/api/v1/users/register", json=user_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["username"] == user_data["username"]
    assert data["user_type"] == user_data["user_type"]
    assert "id" in data

def test_user_login():
    """Test user login"""
    # First register a user
    user_data = {
        "email": "login@example.com",
        "username": "loginuser",
        "password": "loginpassword",
        "full_name": "Login User",
        "user_type": "tenant"
    }
    client.post("/api/v1/users/register", json=user_data)
    
    # Now login
    login_data = {
        "username": "loginuser",
        "password": "loginpassword"
    }
    
    response = client.post("/api/v1/users/login", data=login_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_create_property():
    """Test property creation"""
    # First create and login a user
    user_data = {
        "email": "owner@example.com",
        "username": "propowner",
        "password": "ownerpassword",
        "full_name": "Property Owner",
        "user_type": "owner"
    }
    client.post("/api/v1/users/register", json=user_data)
    
    # Login to get token
    login_response = client.post("/api/v1/users/login", data={
        "username": "propowner",
        "password": "ownerpassword"
    })
    token = login_response.json()["access_token"]
    
    # Create property
    property_data = {
        "title": "Beautiful 2BHK Apartment",
        "description": "A lovely apartment in the city center",
        "number_of_rooms": 2,
        "has_kitchen": True,
        "has_bathroom": True,
        "number_of_bathrooms": 2,
        "rent_amount": 1500.0,
        "deposit_amount": 3000.0,
        "payment_mode": "monthly",
        "address": "123 Main Street",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "pincode": "10001"
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/v1/properties/", json=property_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["title"] == property_data["title"]
    assert data["number_of_rooms"] == property_data["number_of_rooms"]
    assert data["rent_amount"] == property_data["rent_amount"]

def test_search_properties():
    """Test property search"""
    response = client.get("/api/v1/properties/search?city=New York&min_rooms=1&max_rooms=3")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_properties():
    """Test get all properties"""
    response = client.get("/api/v1/properties/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_unauthorized_property_creation():
    """Test that tenants cannot create properties"""
    # Create tenant user
    user_data = {
        "email": "tenant@example.com",
        "username": "testtenant",
        "password": "tenantpassword",
        "full_name": "Test Tenant",
        "user_type": "tenant"
    }
    client.post("/api/v1/users/register", json=user_data)
    
    # Login as tenant
    login_response = client.post("/api/v1/users/login", data={
        "username": "testtenant",
        "password": "tenantpassword"
    })
    token = login_response.json()["access_token"]
    
    # Try to create property (should fail)
    property_data = {
        "title": "Unauthorized Property",
        "number_of_rooms": 1,
        "rent_amount": 1000.0,
        "payment_mode": "monthly",
        "address": "Unauthorized Street",
        "city": "No City",
        "state": "No State",
        "country": "No Country",
        "pincode": "00000"
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/v1/properties/", json=property_data, headers=headers)
    assert response.status_code == 403

if __name__ == "__main__":
    pytest.main([__file__])
