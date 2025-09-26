#!/usr/bin/env python3
"""
Test script for Privy authentication endpoints.
This script tests the Privy authentication flow without requiring actual Privy tokens.
"""

import asyncio
import httpx
import json
from typing import Dict, Any

# Mock Privy service for testing
class MockPrivyService:
    def __init__(self):
        self.mock_users = {
            "test_token_123": {
                "id": "privy_user_123",
                "linked_accounts": [
                    {
                        "type": "email",
                        "address": "test@example.com"
                    }
                ],
                "user_profile": {
                    "display_name": "Test User"
                }
            }
        }
    
    async def verify_access_token(self, access_token: str) -> Dict[str, Any]:
        if access_token in self.mock_users:
            return self.mock_users[access_token]
        else:
            raise Exception("Invalid token")
    
    def extract_user_data(self, privy_user_data: Dict[str, Any]) -> Dict[str, Any]:
        user_data = {
            "privy_id": privy_user_data.get("id"),
            "profile_id": None,
            "email": None,
            "full_name": None
        }
        
        # Extract email from linked accounts
        linked_accounts = privy_user_data.get("linked_accounts", [])
        for account in linked_accounts:
            if account.get("type") == "email":
                user_data["email"] = account.get("address")
                user_data["profile_id"] = account.get("address")
                break
        
        # Extract name from user profile
        user_profile = privy_user_data.get("user_profile", {})
        if user_profile:
            user_data["full_name"] = user_profile.get("display_name")
        
        return user_data

async def test_privy_auth():
    """Test the Privy authentication endpoint"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Privy Authentication...")
    
    # Test data
    test_data = {
        "access_token": "test_token_123"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            # Test authentication endpoint
            print("1. Testing /api/v1/users/privy/auth endpoint...")
            response = await client.post(
                f"{base_url}/api/v1/users/privy/auth",
                json=test_data,
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Authentication successful!")
                print(f"   User ID: {data['user']['id']}")
                print(f"   Privy ID: {data['user']['privy_id']}")
                print(f"   Email: {data['user']['email']}")
                print(f"   Is New User: {data['is_new_user']}")
                
                # Test getting user info
                print("\n2. Testing /api/v1/users/privy/me endpoint...")
                headers = {"Authorization": f"Bearer {test_data['access_token']}"}
                me_response = await client.get(
                    f"{base_url}/api/v1/users/privy/me",
                    headers=headers,
                    timeout=10.0
                )
                
                if me_response.status_code == 200:
                    me_data = me_response.json()
                    print("✅ User info retrieved successfully!")
                    print(f"   User: {me_data['full_name']} ({me_data['email']})")
                else:
                    print(f"❌ Failed to get user info: {me_response.status_code}")
                    print(f"   Response: {me_response.text}")
                
                # Test updating user profile
                print("\n3. Testing profile update...")
                update_data = {
                    "username": "testuser",
                    "phone_number": "+1234567890",
                    "user_type": "tenant"
                }
                
                update_response = await client.put(
                    f"{base_url}/api/v1/users/privy/me",
                    headers=headers,
                    json=update_data,
                    timeout=10.0
                )
                
                if update_response.status_code == 200:
                    update_result = update_response.json()
                    print("✅ Profile updated successfully!")
                    print(f"   Username: {update_result['username']}")
                    print(f"   Phone: {update_result['phone_number']}")
                    print(f"   User Type: {update_result['user_type']}")
                else:
                    print(f"❌ Failed to update profile: {update_response.status_code}")
                    print(f"   Response: {update_response.text}")
                    
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except httpx.ConnectError:
            print("❌ Could not connect to the server.")
            print("   Make sure the server is running on http://localhost:8000")
        except Exception as e:
            print(f"❌ Test failed with error: {e}")

def print_setup_instructions():
    """Print setup instructions"""
    print("\n" + "="*60)
    print("PRIVY AUTHENTICATION SETUP INSTRUCTIONS")
    print("="*60)
    print()
    print("1. Install dependencies:")
    print("   pip install -r requirements.txt")
    print()
    print("2. Set up environment variables in .env file:")
    print("   PRIVY_APP_ID=your_privy_app_id")
    print("   PRIVY_APP_SECRET=your_privy_app_secret")
    print("   DATABASE_URL=sqlite:///./hanumo_rental.db")
    print("   SECRET_KEY=your-secret-key")
    print()
    print("3. Start the server:")
    print("   uvicorn main:app --reload")
    print()
    print("4. Test the endpoints:")
    print("   python test_privy_auth.py")
    print()
    print("5. API Endpoints:")
    print("   POST /api/v1/users/privy/auth - Authenticate with Privy")
    print("   GET  /api/v1/users/privy/me - Get current user")
    print("   PUT  /api/v1/users/privy/me - Update user profile")
    print()

if __name__ == "__main__":
    print_setup_instructions()
    
    # Ask user if they want to run tests
    try:
        run_tests = input("Do you want to run the authentication tests? (y/n): ").lower().strip()
        if run_tests in ['y', 'yes']:
            asyncio.run(test_privy_auth())
        else:
            print("Skipping tests. Run 'python test_privy_auth.py' when ready.")
    except KeyboardInterrupt:
        print("\nExiting...")
