# ShopSyncAI API Documentation

## Base URLs
- Production: `https://api.shopsyncai.com`
- Staging: `https://staging-api.shopsyncai.com`
- Development: `http://localhost:5001/shopsyncai-445000/us-central1/api`

## Authentication
All API requests require a Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

## API Endpoints

### Authentication

#### POST /auth/register
Create a new user account.

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "displayName": "string"
}
```

**Response:**
```json
{
  "userId": "string",
  "email": "string",
  "displayName": "string",
  "token": "string"
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "displayName": "string"
  }
}
```

### Households

#### GET /households
Get all households for current user.

**Response:**
```json
{
  "households": [
    {
      "id": "string",
      "name": "string",
      "members": [
        {
          "userId": "string",
          "role": "string",
          "displayName": "string"
        }
      ]
    }
  ]
}
```

#### POST /households
Create a new household.

**Request Body:**
```json
{
  "name": "string",
  "members": ["userId1", "userId2"]
}
```

### Shopping Lists

#### GET /lists/{householdId}
Get all lists for a household.

**Response:**
```json
{
  "lists": [
    {
      "id": "string",
      "name": "string",
      "items": [
        {
          "id": "string",
          "name": "string",
          "quantity": "number",
          "category": "string",
          "completed": "boolean"
        }
      ]
    }
  ]
}
```

#### POST /lists
Create a new shopping list.

**Request Body:**
```json
{
  "householdId": "string",
  "name": "string",
  "items": [
    {
      "name": "string",
      "quantity": "number",
      "category": "string"
    }
  ]
}
```

### AI Features

#### POST /ai/suggestions
Get AI-powered item suggestions.

**Request Body:**
```json
{
  "listId": "string",
  "query": "string"
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "name": "string",
      "confidence": "number",
      "category": "string"
    }
  ]
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

### Common Error Codes
- `auth/invalid-credentials`: Invalid login credentials
- `auth/email-already-exists`: Email already registered
- `household/not-found`: Household not found
- `household/permission-denied`: User not authorized
- `list/not-found`: Shopping list not found
- `validation/invalid-input`: Invalid request data

## Rate Limiting
- 100 requests per minute per user
- 1000 requests per day per user
- AI suggestions limited to 50 per day per user

## Webhooks

### Available Events
- `household.created`
- `household.updated`
- `list.created`
- `list.updated`
- `item.added`
- `item.completed`

### Webhook Format
```json
{
  "event": "string",
  "timestamp": "string",
  "data": {}
}
```
