import crypto from 'node:crypto';
import AppError from '../errors/AppError.js';
import { getString, getDate } from '../utils/validators.js';

function applyTimeOfDay(date, timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return date;
  }
  const [hours, minutes] = timeString.split(':').map((value) => Number(value));
  if (Number.isInteger(hours) && Number.isInteger(minutes)) {
    const updated = new Date(date);
    updated.setHours(hours, minutes, 0, 0);
    return updated;
  }
  return date;
}

function createReminderService(context) {
  const { db, config } = context;

  function listCustomReminders(userId) {
    return db.data.reminders
      .filter((reminder) => reminder.userId === userId)
      .sort((a, b) => new Date(a.notifyAt) - new Date(b.notifyAt));
  }

  function ensureDebt(userId, debtId) {
    const debt = db.data.debts.find((record) => record.id === debtId && record.userId === userId);
    if (!debt) {
      throw new AppError(404, 'Debt not found for reminder.');
    }
    return debt;
  }

  function createCustomReminder(userId, payload) {
    const title = getString(payload, 'title', { minLength: 1 });
    const notifyAt = getDate(payload, 'notifyAt').toISOString();
    let debtId = null;
    if (payload.debtId) {
      ensureDebt(userId, payload.debtId);
      debtId = payload.debtId;
    }
    const reminder = {
      id: crypto.randomUUID(),
      userId,
      debtId,
      title,
      notifyAt,
      createdAt: new Date().toISOString(),
    };
    db.data.reminders.push(reminder);
    db.write();
    return reminder;
  }

  function getUpcomingReminders(user) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + config.reminderLookAheadDays);
    const reminders = [];
    const preferences = user.reminderPreferences || { daysBeforeDue: 3, timeOfDay: '09:00' };

    db.data.debts
      .filter((debt) => debt.userId === user.id && debt.balance > 0)
      .forEach((debt) => {
        const dueDate = new Date(debt.dueDate);
        const reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() - (preferences.daysBeforeDue || 0));
        const notifyAt = applyTimeOfDay(reminderDate, preferences.timeOfDay);
        if (notifyAt >= now && notifyAt <= future) {
          reminders.push({
            id: `${debt.id}-due`,
            title: `Upcoming payment: ${debt.name}`,
            debtId: debt.id,
            notifyAt: notifyAt.toISOString(),
            dueDate: debt.dueDate,
            amountDue: debt.minimumPayment,
            type: 'system',
          });
        }
      });

    listCustomReminders(user.id).forEach((reminder) => {
      const notifyAt = new Date(reminder.notifyAt);
      if (notifyAt >= now && notifyAt <= future) {
        reminders.push({
          ...reminder,
          type: 'custom',
        });
      }
    });

    reminders.sort((a, b) => new Date(a.notifyAt) - new Date(b.notifyAt));
    return reminders;
  }

  return {
    listCustomReminders,
    createCustomReminder,
    getUpcomingReminders,
  };
}

export default createReminderService;
