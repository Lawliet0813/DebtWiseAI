import crypto from 'node:crypto';
import AppError from '../errors/AppError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { getString, ensureEmail } from '../utils/validators.js';
import { sign, verify } from '../utils/jwt.js';
import { sanitizeUser } from '../utils/serializers.js';

function createAuthService(context) {
  const { db, config } = context;

  function generateToken(user) {
    return sign({ sub: user.id, membership: user.membership }, config.jwtSecret, {
      expiresIn: config.tokenExpiresInSeconds,
    });
  }

  async function register(payload) {
    const email = ensureEmail(getString(payload, 'email', { minLength: 3 }));
    const password = getString(payload, 'password', { minLength: 8 });
    const name = getString(payload, 'name', { required: false, defaultValue: '' });

    const existing = await db.getUserByEmail(email);
    if (existing) {
      throw new AppError(409, 'Email is already registered.');
    }

    const now = new Date().toISOString();
    const user = {
      id: crypto.randomUUID(),
      email,
      passwordHash: hashPassword(password),
      name,
      income: Number(payload.income) || 0,
      expenses: Number(payload.expenses) || 0,
      reminderPreferences: {
        daysBeforeDue: Number(payload.reminderDays || 3),
        timeOfDay: payload.reminderTime || '09:00',
      },
      membership: 'free',
      createdAt: now,
      updatedAt: now,
    };
    const storedUser = await db.createUser(user);
    const token = generateToken(storedUser || user);
    return {
      token,
      user: sanitizeUser(storedUser || user),
    };
  }

  async function login(payload) {
    const email = ensureEmail(getString(payload, 'email', { minLength: 3 }));
    const password = getString(payload, 'password', { minLength: 8 });
    const user = await db.getUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new AppError(401, 'Invalid email or password.');
    }
    const token = generateToken(user);
    return {
      token,
      user: sanitizeUser(user),
    };
  }

  async function authenticate(authorizationHeader) {
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication token is missing.');
    }
    const token = authorizationHeader.slice('Bearer '.length);
    const payload = verify(token, config.jwtSecret);
    const user = await db.getUserById(payload.sub);
    if (!user) {
      throw new AppError(401, 'User not found for provided token.');
    }
    return sanitizeUser(user);
  }

  async function requestPasswordReset(payload) {
    const email = ensureEmail(getString(payload, 'email', { minLength: 3 }));
    const user = await db.getUserByEmail(email);
    if (!user) {
      throw new AppError(404, 'User with provided email was not found.');
    }
    const token = sign({ sub: user.id, purpose: 'password-reset' }, config.jwtSecret, {
      expiresIn: 60 * 15,
    });
    return {
      resetToken: token,
      message: 'Password reset token generated. Use this token to authorize password reset flow.',
    };
  }

  return {
    register,
    login,
    authenticate,
    requestPasswordReset,
  };
}

export default createAuthService;
