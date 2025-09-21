import AppError from '../errors/AppError.js';
import { getString, getNumber } from '../utils/validators.js';
import { sanitizeUser } from '../utils/serializers.js';

function createUserService(context) {
  const { db } = context;

  async function getById(userId) {
    const user = await db.getUserById(userId);
    if (!user) {
      throw new AppError(404, 'User not found.');
    }
    return user;
  }

  async function getProfile(userId) {
    const user = await getById(userId);
    return sanitizeUser(user);
  }

  async function updateProfile(userId, payload) {
    const user = await getById(userId);
    const updates = {};
    if (payload.name !== undefined) {
      updates.name = getString(payload, 'name', { required: false, defaultValue: user.name });
    }
    if (payload.income !== undefined) {
      updates.income = getNumber(payload, 'income', { required: false, min: 0, defaultValue: user.income });
    }
    if (payload.expenses !== undefined) {
      updates.expenses = getNumber(payload, 'expenses', { required: false, min: 0, defaultValue: user.expenses });
    }
    if (payload.reminderPreferences) {
      const prefs = payload.reminderPreferences;
      const current = user.reminderPreferences || { daysBeforeDue: 3, timeOfDay: '09:00' };
      updates.reminderPreferences = {
        daysBeforeDue: getNumber(prefs, 'daysBeforeDue', {
          required: false,
          min: 0,
          defaultValue: current.daysBeforeDue,
        }),
        timeOfDay: getString(prefs, 'timeOfDay', {
          required: false,
          defaultValue: current.timeOfDay,
        }),
      };
    }
    if (Object.keys(updates).length === 0) {
      return sanitizeUser(user);
    }
    updates.updatedAt = new Date().toISOString();
    const updated = await db.updateUser(userId, updates);
    if (!updated) {
      throw new AppError(404, 'User not found.');
    }
    return sanitizeUser(updated);
  }

  async function updateMembership(userId, membership) {
    if (!['free', 'premium'].includes(membership)) {
      throw new AppError(400, 'Membership must be either free or premium.');
    }
    const updates = {
      membership,
      updatedAt: new Date().toISOString(),
    };
    const updated = await db.updateUser(userId, updates);
    if (!updated) {
      throw new AppError(404, 'User not found.');
    }
    return sanitizeUser(updated);
  }

  return {
    getProfile,
    updateProfile,
    updateMembership,
    getById,
  };
}

export default createUserService;
