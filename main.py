from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import users, properties, rent_agreements, payments
import os
from dotenv import load_dotenv

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hanumo Property Rental System",
    description="A residential property rental system backend",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(properties.router, prefix="/api/v1/properties", tags=["properties"])
app.include_router(rent_agreements.router, prefix="/api/v1/rent-agreements", tags=["rent-agreements"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])

@app.get("/")
async def root():
    return {"message": "Welcome to Hanumo Property Rental System"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
