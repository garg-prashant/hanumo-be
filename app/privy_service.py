import httpx
import os
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from dotenv import load_dotenv

load_dotenv()

class PrivyService:
    def __init__(self):
        self.app_id = os.getenv("PRIVY_APP_ID")
        self.app_secret = os.getenv("PRIVY_APP_SECRET")
        self.base_url = "https://auth.privy.io/api/v1"
        
        if not self.app_id or not self.app_secret:
            raise ValueError("PRIVY_APP_ID and PRIVY_APP_SECRET must be set in environment variables")
    
    async def verify_access_token(self, access_token: str) -> Dict[str, Any]:
        """
        Verify a Privy access token and return user information
        """
        headers = {
            "Authorization": f"Bearer {self.app_secret}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/users/me",
                    headers=headers,
                    params={"access_token": access_token}
                )
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 401:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid or expired Privy token"
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Privy API error: {response.status_code}"
                    )
                    
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Failed to connect to Privy service: {str(e)}"
                )
    
    async def get_user_by_privy_id(self, privy_id: str) -> Dict[str, Any]:
        """
        Get user information from Privy by user ID
        """
        headers = {
            "Authorization": f"Bearer {self.app_secret}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/users/{privy_id}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="User not found in Privy"
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Privy API error: {response.status_code}"
                    )
                    
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Failed to connect to Privy service: {str(e)}"
                )
    
    def extract_user_data(self, privy_user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract relevant user data from Privy user object
        """
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
        
        # If no email, try to get wallet address
        if not user_data["email"]:
            for account in linked_accounts:
                if account.get("type") == "wallet":
                    user_data["profile_id"] = account.get("address")
                    break
        
        # Extract name from user profile
        user_profile = privy_user_data.get("user_profile", {})
        if user_profile:
            user_data["full_name"] = user_profile.get("display_name")
        
        return user_data

# Global instance
privy_service = PrivyService()
