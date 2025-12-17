# Authentication Setup Guide

This document covers the implementation of JWT-based authentication for the Smart Crop Guidance System.

## Backend Setup

### 1. Install New Dependencies

```bash
cd backend
pip install -r requirements.txt
```

New packages added:
- `flask-sqlalchemy==3.1.1` - Database ORM
- `flask-jwt-extended==4.5.3` - JWT token management
- `werkzeug==3.0.1` - Password hashing
- `bcrypt==4.1.2` - Secure password hashing

### 2. Configure Environment Variables

Create or update `backend/.env`:

```
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=sqlite:///crop_guidance.db
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production
GEMINI_API_KEY=your-gemini-api-key-here
```

⚠️ **Important**: In production, use a strong, random JWT_SECRET_KEY:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Database Initialization

The database will be created automatically on first run:

```bash
python app.py
```

This creates:
- `crop_guidance.db` - SQLite database file
- `users` table - User account data
- `prediction_history` table - User prediction records

## Frontend Setup

No additional npm packages required. The frontend uses built-in `localStorage` for token storage.

## API Endpoints

### Authentication Routes

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "username": "farmer123",
  "email": "farmer@example.com",
  "password": "SecurePass123"
}

Response:
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "farmer123",
    "email": "farmer@example.com",
    "created_at": "2024-12-16T10:30:00"
  }
}
```

Password Requirements:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 digit

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "username": "farmer123",
  "password": "SecurePass123"
}

Response:
{
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "farmer123",
    "email": "farmer@example.com",
    "created_at": "2024-12-16T10:30:00"
  }
}
```

#### Logout
```
POST /auth/logout
Authorization: Bearer {access_token}

Response:
{
  "message": "Logout successful"
}
```

#### Get Current User
```
GET /auth/me
Authorization: Bearer {access_token}

Response:
{
  "user": {
    "id": 1,
    "username": "farmer123",
    "email": "farmer@example.com",
    "created_at": "2024-12-16T10:30:00"
  }
}
```

#### Get Prediction History
```
GET /auth/history?limit=20&offset=0
Authorization: Bearer {access_token}

Response:
{
  "predictions": [
    {
      "id": 1,
      "crop": "rice",
      "confidence": 0.95,
      "N": 90,
      "P": 42,
      "K": 43,
      "temperature": 20.8,
      "humidity": 82,
      "ph": 6.5,
      "rainfall": 202,
      "latitude": 21.14,
      "longitude": 79.08,
      "created_at": "2024-12-16T10:35:00"
    }
  ],
  "total": 1
}
```

### Prediction Route (Updated)

```
POST /predict
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "N": 90,
  "P": 42,
  "K": 43,
  "temperature": 20.8,
  "humidity": 82,
  "ph": 6.5,
  "rainfall": 202,
  "latitude": 21.14,
  "longitude": 79.08
}
```

**Note**: Now requires valid JWT token in Authorization header. Predictions are automatically saved to user's history.

## Frontend Integration

### Token Management

Tokens are stored in `localStorage`:
- `access_token` - JWT token from server

```typescript
import { getAuthToken, setAuthToken, clearAuthToken } from './services/predictionService';

// Get token
const token = getAuthToken();

// Set token (automatically done after login)
setAuthToken(token);

// Clear token (automatically done on logout)
clearAuthToken();
```

### Authentication Flow

1. **Registration**:
   - User fills registration form
   - Frontend calls `register()` from `authService.ts`
   - On success, frontend automatically logs in user
   - Token stored in localStorage
   - User redirected to dashboard

2. **Login**:
   - User fills login form
   - Frontend calls `login()` from `authService.ts`
   - On success, token stored in localStorage
   - User redirected to dashboard

3. **Protected Routes**:
   - All API calls include `Authorization: Bearer {token}` header
   - If token expired/invalid, server returns 401
   - Frontend should redirect to login

4. **Logout**:
   - Frontend calls `logout()` API (optional)
   - Token cleared from localStorage
   - User redirected to landing page

## Database Schema

### users table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(80) UNIQUE NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### prediction_history table
```sql
CREATE TABLE prediction_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  crop VARCHAR(120) NOT NULL,
  confidence FLOAT NOT NULL,
  N FLOAT NOT NULL,
  P FLOAT NOT NULL,
  K FLOAT NOT NULL,
  temperature FLOAT NOT NULL,
  humidity FLOAT NOT NULL,
  ph FLOAT NOT NULL,
  rainfall FLOAT NOT NULL,
  latitude FLOAT,
  longitude FLOAT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Running the Application

### Start Backend
```bash
cd backend
python app.py
```

Server starts on `http://localhost:5000`

### Start Frontend
```bash
npm run dev
```

Frontend starts on `http://localhost:3000` (or as configured)

## Testing Authentication

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPass123"}'

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"TestPass123"}'

# Make prediction (replace TOKEN with actual token)
curl -X POST http://localhost:5000/predict \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"N":90,"P":42,"K":43,"temperature":20.8,"humidity":82,"ph":6.5,"rainfall":202}'
```

## Security Considerations

1. **Password Hashing**: Passwords are hashed using bcrypt with salt
2. **JWT Tokens**: Tokens are signed with SECRET_KEY, valid for session lifetime
3. **Database**: Use PostgreSQL in production instead of SQLite
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Configure CORS origins for production domains
6. **Environment Variables**: Never commit `.env` file with real keys

## Troubleshooting

### Issue: "Model not loaded" error
- Run `python export_model.py` to train and save model

### Issue: "JWT token missing" error
- Ensure token is sent in `Authorization: Bearer {token}` header
- Check token hasn't expired

### Issue: "Database locked" error
- This happens with concurrent SQLite writes
- Switch to PostgreSQL for production

### Issue: Can't register user with "email already exists"
- Delete `crop_guidance.db` to reset database
- Or manually delete the user from database

## Next Steps

1. Deploy database to production (PostgreSQL recommended)
2. Implement password reset functionality
3. Add refresh token mechanism for long sessions
4. Add rate limiting to authentication endpoints
5. Implement email verification for registration
