# Developer Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- MongoDB
- Redis
- Firebase account
- Git

## Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/shopsync-ai.git
cd shopsync-ai
```

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update environment variables
# Edit .env with your Firebase configuration
```

### 3. Backend Setup
```bash
# Navigate to backend directory
cd ../backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update environment variables with your:
# - MongoDB URI
# - Redis URI
# - JWT Secret
# - Firebase Admin credentials
```

### 4. Database Setup
```bash
# Start MongoDB
mongod

# Start Redis
redis-server
```

### 5. Run Development Servers
```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend
cd backend
npm run dev
```

## Environment Variables

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shopsync
REDIS_URI=redis://localhost:6379
JWT_SECRET=your_jwt_secret
FIREBASE_ADMIN_CREDENTIALS=path/to/credentials.json
```

## Testing

### Running Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test

# E2E tests
cd frontend
npm run cypress:open
```

### Test Coverage
```bash
# Generate coverage report
npm run test:coverage
```

## Build & Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

### Deployment
```bash
# Deploy to Firebase
firebase deploy

# Deploy backend to your server
npm run deploy
```

## Common Issues

### CORS Issues
1. Check API URL in frontend .env
2. Verify CORS configuration in backend
3. Clear browser cache

### MongoDB Connection
1. Verify MongoDB is running
2. Check connection string
3. Check network access

### Redis Connection
1. Verify Redis server is running
2. Check Redis configuration
3. Clear Redis cache if needed

## Code Style & Linting

### Running Linters
```bash
# Frontend
npm run lint

# Backend
npm run lint
```

### Pre-commit Hooks
```bash
# Install husky
npx husky install
```

## Contributing
1. Fork the repository
2. Create feature branch
3. Make changes
4. Run tests
5. Submit pull request
