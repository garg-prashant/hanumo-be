# User Endpoints Documentation

## Overview
The user endpoints have been simplified to focus on Privy authentication. Users sign up using Privy authentication, and the frontend sends the Privy JWT token for authentication.

## Endpoints

### 1. Authenticate User
**POST** `/api/v1/users/auth`

Authenticates a user with Privy JWT token. If the user exists, returns user details. If the user doesn't exist, creates a new user and returns details.

**Request Body:**
```json
{
  "access_token": "privy_jwt_token_here"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "privy_id": "privy_user_id",
    "profile_id": "email_or_wallet_address",
    "embedded_wallet": "wallet_address",
    "account_id": "account_identifier",
    "email": "user@example.com",
    "username": null,
    "full_name": "John Doe",
    "phone_number": null,
    "user_type": null,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": null
  },
  "is_new_user": false
}
```

### 2. Get Current User
**GET** `/api/v1/users/me`

Returns the current authenticated user's information.

**Headers:**
```
Authorization: Bearer privy_jwt_token
```

**Response:**
```json
{
  "id": 1,
  "privy_id": "privy_user_id",
  "profile_id": "email_or_wallet_address",
  "embedded_wallet": "wallet_address",
  "account_id": "account_identifier",
  "email": "user@example.com",
  "username": null,
  "full_name": "John Doe",
  "phone_number": null,
  "user_type": null,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": null
}
```

### 3. Update User Profile
**PUT** `/api/v1/users/me`

Updates the current user's profile information.

**Headers:**
```
Authorization: Bearer privy_jwt_token
```

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "full_name": "Jane Doe",
  "phone_number": "+1234567890",
  "user_type": "tenant"
}
```

**Response:**
```json
{
  "id": 1,
  "privy_id": "privy_user_id",
  "profile_id": "email_or_wallet_address",
  "embedded_wallet": "wallet_address",
  "account_id": "account_identifier",
  "email": "newemail@example.com",
  "username": null,
  "full_name": "Jane Doe",
  "phone_number": "+1234567890",
  "user_type": "tenant",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

## User Data Fields

### Privy Authentication Fields
- `privy_id`: Unique identifier from Privy
- `profile_id`: Email or wallet address used for signup
- `embedded_wallet`: Embedded wallet address from Privy
- `account_id`: Account identifier from Privy

### App-Level User Details
- `email`: User's email address
- `full_name`: User's full name
- `phone_number`: User's contact number
- `user_type`: Type of user (tenant/owner)
- `is_active`: Whether the user account is active
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

## Authentication Flow

1. User signs up/logs in using Privy authentication on the frontend
2. Frontend receives Privy JWT token
3. Frontend sends token to `/api/v1/users/auth` endpoint
4. Backend verifies token with Privy service
5. Backend checks if user exists in local database
6. If user exists, returns user details
7. If user doesn't exist, creates new user with Privy data and returns details
8. Frontend can use the token for subsequent authenticated requests

## Error Handling

- **401 Unauthorized**: Invalid or expired Privy token
- **404 Not Found**: User not found (for update operations)
- **500 Internal Server Error**: Authentication or database errors
