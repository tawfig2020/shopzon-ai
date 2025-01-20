# ShopSyncAI Deployment Guide

## Environment Setup

### Prerequisites
- Node.js 16.x or higher
- npm 7.x or higher
- Firebase CLI
- Git
- Docker (optional)

### Environment Variables

#### Frontend (.env)
```bash
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=shopsyncai-445000.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=shopsyncai-445000
REACT_APP_FIREBASE_STORAGE_BUCKET=shopsyncai-445000.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

#### Backend (.env)
```bash
OPENAI_API_KEY=your_openai_api_key
FIREBASE_SERVICE_ACCOUNT=path/to/service-account.json
```

## Local Development

### Frontend Setup
```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Backend Setup
```bash
# Install dependencies
cd backend
npm install

# Start Firebase emulators
firebase emulators:start

# Deploy functions locally
firebase serve --only functions
```

## Staging Environment

### Configuration
```bash
# Set up staging environment
firebase use staging

# Deploy to staging
npm run deploy:staging
```

### Monitoring Setup
```bash
# Enable Firebase monitoring
firebase deploy --only hosting:monitoring

# Set up logging
firebase functions:config:set logging.level="debug"
```

## Production Environment

### Pre-deployment Checklist
- [ ] Run all tests
- [ ] Update version numbers
- [ ] Check environment variables
- [ ] Backup database
- [ ] Update documentation

### Deployment Steps
```bash
# Frontend deployment
cd frontend
npm run build:production
firebase deploy --only hosting:production

# Backend deployment
cd backend
firebase deploy --only functions:production
```

### Post-deployment Verification
- [ ] Verify authentication flow
- [ ] Check database connections
- [ ] Test critical features
- [ ] Monitor error rates
- [ ] Check analytics

## Docker Deployment

### Build Docker Image
```dockerfile
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Run with Docker Compose
```yaml
version: '3'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
  
  backend:
    build: ./backend
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Dependencies
        run: npm install
      - name: Run Tests
        run: npm test
      - name: Build
        run: npm run build
      - name: Deploy
        run: firebase deploy
```

## Monitoring and Logging

### Enable Monitoring
```bash
# Enable Firebase Performance Monitoring
firebase deploy --only hosting:monitoring

# Enable Error Reporting
firebase deploy --only functions:errors

# Enable Analytics
firebase deploy --only analytics
```

### Log Levels
```javascript
// Production logging
firebase functions:config:set logging.level="error"

// Staging logging
firebase functions:config:set logging.level="debug"
```

## Rollback Procedures

### Frontend Rollback
```bash
# List previous versions
firebase hosting:versions:list

# Rollback to specific version
firebase hosting:clone VERSION_ID
```

### Backend Rollback
```bash
# List function versions
firebase functions:list

# Rollback functions
firebase functions:rollback
```

## Security Considerations

### SSL Configuration
```bash
# Enable SSL
firebase hosting:ssl:enable

# Configure custom domain
firebase hosting:domain:add
```

### Firewall Rules
```bash
# Configure Firebase Security Rules
firebase deploy --only firestore:rules

# Set up API restrictions
firebase functions:config:set api.allowlist="domain1.com,domain2.com"
```
