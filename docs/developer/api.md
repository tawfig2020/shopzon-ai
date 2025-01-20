# ShopSync AI API Documentation

## Authentication
All API requests require authentication using JWT tokens.

### Get Authentication Token
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Shopping Lists

### Create Shopping List
```http
POST /api/lists
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Groceries",
  "category": "food",
  "items": [
    {
      "name": "Milk",
      "quantity": 1
    }
  ]
}
```

### Get Shopping Lists
```http
GET /api/lists
Authorization: Bearer <token>
```

### Update Shopping List
```http
PUT /api/lists/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated List Name",
  "items": [...]
}
```

## Households

### Create Household
```http
POST /api/households
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Family",
  "members": [
    {
      "email": "member@example.com",
      "role": "member"
    }
  ]
}
```

### Get Household Members
```http
GET /api/households/:id/members
Authorization: Bearer <token>
```

## Real-time Events

### WebSocket Connection
```javascript
const socket = io('wss://api.shopsync.ai', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for list updates
socket.on('list-updated', (data) => {
  console.log('List updated:', data);
});

// Join household room
socket.emit('join-household', householdId);
```

## Error Responses
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per user

## Webhook Events
```http
POST /api/webhooks/list-update
Content-Type: application/json

{
  "event": "list.updated",
  "data": {
    "listId": "123",
    "updatedBy": "user123",
    "changes": [...]
  }
}
```
