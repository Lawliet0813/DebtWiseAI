import express from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { query, withTransaction } from '../db/connection.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import { asyncHandler, ValidationError, UnauthorizedError, ConflictError } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
    'any.required': 'Password is required'
  }),
  username: Joi.string().min(3).max(30).alphanum().required().messages({
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot exceed 30 characters',
    'string.alphanum': 'Username can only contain letters and numbers',
    'any.required': 'Username is required'
  }),
  firstName: Joi.string().min(1).max(100).optional(),
  lastName: Joi.string().min(1).max(100).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid registration data', error.details);
  }

  const { email, password, username, firstName, lastName } = value;

  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );

  if (existingUser.rows.length > 0) {
    throw new ConflictError('User with this email or username already exists');
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user with transaction
  const result = await withTransaction(async (client) => {
    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, username, first_name, last_name, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, username, first_name, last_name, created_at`,
      [email, passwordHash, username, firstName, lastName, false]
    );

    const user = userResult.rows[0];

    // Create default user preferences
    await client.query(
      `INSERT INTO user_preferences (user_id, currency, theme, notification_email, notification_push)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, 'USD', 'light', true, true]
    );

    return user;
  });

  // Generate tokens
  const token = generateToken(result.id);
  const refreshToken = generateRefreshToken(result.id);

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: result.id,
      email: result.email,
      username: result.username,
      firstName: result.first_name,
      lastName: result.last_name,
      createdAt: result.created_at,
      emailVerified: false
    },
    tokens: {
      accessToken: token,
      refreshToken: refreshToken
    }
  });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid login data', error.details);
  }

  const { email, password } = value;

  // Find user
  const result = await query(
    `SELECT id, email, username, password_hash, first_name, last_name, 
            is_active, email_verified, last_login
     FROM users WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new UnauthorizedError('Account has been deactivated');
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Update last login
  await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

  // Generate tokens
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      emailVerified: user.email_verified,
      lastLogin: user.last_login
    },
    tokens: {
      accessToken: token,
      refreshToken: refreshToken
    }
  });
}));

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  const decoded = verifyRefreshToken(refreshToken);
  
  // Verify user still exists and is active
  const result = await query(
    'SELECT id, email, username, is_active FROM users WHERE id = $1',
    [decoded.userId]
  );

  if (result.rows.length === 0 || !result.rows[0].is_active) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Generate new tokens
  const newToken = generateToken(decoded.userId);
  const newRefreshToken = generateRefreshToken(decoded.userId);

  res.json({
    tokens: {
      accessToken: newToken,
      refreshToken: newRefreshToken
    }
  });
}));

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // In a more sophisticated implementation, you would:
  // 1. Add the token to a blacklist
  // 2. Clear refresh tokens from database
  // For now, client-side token removal is sufficient
  
  res.json({
    message: 'Logged out successfully'
  });
});

// GET /api/auth/me (requires authentication)
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new UnauthorizedError('Access token required');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  const result = await query(
    `SELECT u.id, u.email, u.username, u.first_name, u.last_name, 
            u.email_verified, u.created_at, u.last_login,
            up.currency, up.theme, up.language, up.notification_email, up.notification_push
     FROM users u
     LEFT JOIN user_preferences up ON u.id = up.user_id
     WHERE u.id = $1 AND u.is_active = true`,
    [decoded.userId]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid token');
  }

  const user = result.rows[0];
  
  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      preferences: {
        currency: user.currency,
        theme: user.theme,
        language: user.language,
        notificationEmail: user.notification_email,
        notificationPush: user.notification_push
      }
    }
  });
}));

export default router;