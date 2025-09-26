"""
Privy Client Utility

A comprehensive utility to create and manage Privy API client instances
with common operations like user verification, message signing, and transactions.
"""

import os
from typing import Optional, Dict, Any
from privy import PrivyAPI
from dotenv import load_dotenv

load_dotenv()


class PrivyClientUtil:
    """Utility class for managing Privy API client instances and common operations."""
    
    _client: Optional[PrivyAPI] = None
    
    @classmethod
    def get_client(cls) -> PrivyAPI:
        """
        Get or create a Privy API client instance.
        
        Returns:
            PrivyAPI: Configured Privy API client
            
        Raises:
            ValueError: If required environment variables are not set
        """
        if cls._client is None:
            app_id = os.getenv("PRIVY_APP_ID")
            app_secret = os.getenv("PRIVY_APP_SECRET")
            
            if not app_id or not app_secret:
                raise ValueError(
                    "PRIVY_APP_ID and PRIVY_APP_SECRET must be set in environment variables"
                )
            
            cls._client = PrivyAPI(
                app_id=app_id,
                app_secret=app_secret
            )
        
        return cls._client
    
    @classmethod
    def create_client(cls, app_id: str, app_secret: str) -> PrivyAPI:
        """
        Create a new Privy API client with provided credentials.
        
        Args:
            app_id: Privy application ID
            app_secret: Privy application secret
            
        Returns:
            PrivyAPI: New Privy API client instance
        """
        return PrivyAPI(
            app_id=app_id,
            app_secret=app_secret
        )
    
    @classmethod
    def reset_client(cls) -> None:
        """Reset the singleton client instance."""
        cls._client = None
    
    @classmethod
    def verify_user(cls, access_token: str) -> Dict[str, Any]:
        """
        Verify a user's access token and return user information.
        
        Args:
            access_token: The user's access token to verify
            
        Returns:
            Dict[str, Any]: User information from Privy
            
        Raises:
            Exception: If token verification fails
        """
        client = cls.get_client()
        try:
            user = client.users.verify_access_token(access_token)
            return user
        except Exception as e:
            raise Exception(f"Failed to verify user token: {str(e)}")
    
    @classmethod
    def sign_message(cls, wallet_id: str, message: str, caip2: str = "eip155:1") -> Dict[str, Any]:
        """
        Sign a plaintext message with the specified wallet.
        
        Args:
            wallet_id: The wallet ID (not address) to sign with
            message: The message to sign
            caip2: The CAIP-2 chain identifier (default: "eip155:1" for Ethereum mainnet)
            
        Returns:
            Dict[str, Any]: Transaction response from Privy
            
        Raises:
            Exception: If message signing fails
        """
        client = cls.get_client()
        try:
            tx = client.wallets.rpc(
                wallet_id=wallet_id,
                method="personal_sign",
                caip2=caip2,
                params={
                    "message": message,
                    "encoding": "utf-8"
                },
            )
            return tx
        except Exception as e:
            raise Exception(f"Failed to sign message: {str(e)}")
    
    @classmethod
    def send_transaction(cls, wallet_id: str, to_address: str, value: int, 
                        caip2: str = "eip155:1", **transaction_params) -> Dict[str, Any]:
        """
        Send a transaction using the specified wallet.
        
        Args:
            wallet_id: The wallet ID to send from
            to_address: The recipient address
            value: The amount to send (in wei)
            caip2: The CAIP-2 chain identifier (default: "eip155:1" for Ethereum mainnet)
            **transaction_params: Additional transaction parameters (gas, gasPrice, data, etc.)
            
        Returns:
            Dict[str, Any]: Transaction response from Privy
            
        Raises:
            Exception: If transaction fails
        """
        client = cls.get_client()
        try:
            transaction = {
                "to": to_address,
                "value": value,
                **transaction_params
            }
            
            tx = client.wallets.rpc(
                wallet_id=wallet_id,
                method="eth_sendTransaction",
                caip2=caip2,
                params={
                    "transaction": transaction,
                },
            )
            return tx
        except Exception as e:
            raise Exception(f"Failed to send transaction: {str(e)}")
    
    @classmethod
    def get_wallet_info(cls, wallet_id: str) -> Dict[str, Any]:
        """
        Get information about a specific wallet.
        
        Args:
            wallet_id: The wallet ID to get information for
            
        Returns:
            Dict[str, Any]: Wallet information from Privy
            
        Raises:
            Exception: If wallet info retrieval fails
        """
        client = cls.get_client()
        try:
            wallet = client.wallets.get(wallet_id)
            return wallet
        except Exception as e:
            raise Exception(f"Failed to get wallet info: {str(e)}")
    
    @classmethod
    def get_user_wallets(cls, user_id: str) -> Dict[str, Any]:
        """
        Get all wallets associated with a user.
        
        Args:
            user_id: The user ID to get wallets for
            
        Returns:
            Dict[str, Any]: User's wallets from Privy
            
        Raises:
            Exception: If wallet retrieval fails
        """
        client = cls.get_client()
        try:
            wallets = client.users.get_wallets(user_id)
            return wallets
        except Exception as e:
            raise Exception(f"Failed to get user wallets: {str(e)}")


# Convenience function for easy access
def get_privy_client() -> PrivyAPI:
    """
    Get the configured Privy API client.
    
    Returns:
        PrivyAPI: Configured Privy API client
    """
    return PrivyClientUtil.get_client()
