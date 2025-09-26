# Privy Authentication Setup

## Environment Variables Required

Add these environment variables to your `.env` file:

```bash
# Privy Configuration
# Get these values from your Privy dashboard: https://dashboard.privy.io/
PRIVY_APP_ID=your_privy_app_id_here
PRIVY_APP_SECRET=your_privy_app_secret_here

# Database Configuration
DATABASE_URL=sqlite:///./hanumo_rental.db

# JWT Configuration
SECRET_KEY=your-secret-key-change-this-in-production

# OpenAI Configuration (for LLM features)
OPENAI_API_KEY=your_openai_api_key_here
```

## Privy Setup Steps

1. **Create a Privy App**:
   - Go to [Privy Dashboard](https://dashboard.privy.io/)
   - Create a new app
   - Note down your App ID and App Secret

2. **Configure Your App**:
   - Set up authentication methods (email, wallet, social)
   - Configure redirect URLs for your frontend
   - Enable embedded wallet if needed

3. **Update Environment Variables**:
   - Replace `your_privy_app_id_here` with your actual App ID
   - Replace `your_privy_app_secret_here` with your actual App Secret

## API Endpoints

### Privy Authentication

- `POST /api/v1/users/privy/auth` - Authenticate with Privy token
- `GET /api/v1/users/privy/me` - Get current Privy user info
- `PUT /api/v1/users/privy/me` - Update Privy user profile

### Request/Response Examples

#### Authenticate with Privy Token
```bash
POST /api/v1/users/privy/auth
Content-Type: application/json

{
  "access_token": "privy_access_token_from_frontend"
}
```

Response:
```json
{
  "user": {
    "id": 1,
    "privy_id": "privy_user_id",
    "profile_id": "user@example.com",
    "email": "user@example.com",
    "username": null,
    "full_name": "John Doe",
    "phone_number": null,
    "user_type": null,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": null
  },
  "is_new_user": true
}
```

#### Update User Profile
```bash
PUT /api/v1/users/privy/me
Authorization: Bearer privy_access_token
Content-Type: application/json

{
  "username": "johndoe",
  "full_name": "John Doe",
  "phone_number": "+1234567890",
  "user_type": "tenant"
}
```

## Frontend Integration

Your frontend should:

1. **Authenticate with Privy**:
   ```javascript
   const { user, getAccessToken } = usePrivy();
   const accessToken = await getAccessToken();
   ```

2. **Send token to backend**:
   ```javascript
   const response = await fetch('/api/v1/users/privy/auth', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       access_token: accessToken
     })
   });
   ```

3. **Use token for authenticated requests**:
   ```javascript
   const response = await fetch('/api/v1/users/privy/me', {
     headers: {
       'Authorization': `Bearer ${accessToken}`
     }
   });
   ```

## Database Migration

The database has been updated to include Privy fields:
- `privy_id`: Unique Privy user identifier
- `profile_id`: Email or wallet address from Privy

Existing users can still use traditional authentication, while new users can authenticate via Privy.
