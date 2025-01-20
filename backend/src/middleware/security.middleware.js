const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Security middleware configuration
const securityMiddleware = [
  // Basic security headers
  helmet(),

  // CORS
  cors(corsOptions),

  // Rate limiting
  limiter,

  // Content security policy
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: [
        "'self'",
        'https://firestore.googleapis.com',
        'https://identitytoolkit.googleapis.com',
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  }),

  // No cache for API responses
  (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  },

  // XSS protection
  helmet.xssFilter(),

  // Prevent clickjacking
  helmet.frameguard({ action: 'deny' }),
];

module.exports = securityMiddleware;
