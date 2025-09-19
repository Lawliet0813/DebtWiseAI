import AppError from '../errors/AppError.js';
import { getString, getNumber } from '../utils/validators.js';
import { sanitizeUser } from '../utils/serializers.js';

function createUserService(context) {
  const { db } = context;

  function getById(userId) {
    const user = db.data.users.find((record) => record.id === userId);
    if (!user) {
      throw new AppError(404, 'User not found.');
    }
    return user;
  }

  function getProfile(userId) {
    return sanitizeUser(getById(userId));
  }

  function updateProfile(userId, payload) {
    const user = getById(userId);
    if (payload.name !== undefined) {
      user.name = getString(payload, 'name', { required: false, defaultValue: user.name });
    }
    if (payload.income !== undefined) {
      user.income = getNumber(payload, 'income', { required: false, min: 0, defaultValue: user.income });
    }
    if (payload.expenses !== undefined) {
      user.expenses = getNumber(payload, 'expenses', { required: false, min: 0, defaultValue: user.expenses });
    }
    if (payload.reminderPreferences) {
      const prefs = payload.reminderPreferences;
      user.reminderPreferences = {
        daysBeforeDue: getNumber(prefs, 'daysBeforeDue', { required: false, min: 0, defaultValue: user.reminderPreferences.daysBeforeDue }),
        timeOfDay: getString(prefs, 'timeOfDay', { required: false, defaultValue: user.reminderPreferences.timeOfDay }),
      };
    }
    user.updatedAt = new Date().toISOString();
    db.write();
    return sanitizeUser(user);
  }

  function updateMembership(userId, membership) {
    const user = getById(userId);
    if (!['free', 'premium'].includes(membership)) {
      throw new AppError(400, 'Membership must be either free or premium.');
    }
    user.membership = membership;
    user.updatedAt = new Date().toISOString();
    db.write();
    return sanitizeUser(user);
  }

  return {
    getProfile,
    updateProfile,
    updateMembership,
    getById,
  };
}

export default createUserService;
