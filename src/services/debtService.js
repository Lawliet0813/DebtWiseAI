import crypto from 'node:crypto';
import AppError from '../errors/AppError.js';
import { getString, getNumber, getDate } from '../utils/validators.js';
import { clampToZero } from '../utils/date.js';

const SUPPORTED_TYPES = ['credit_card', 'loan', 'mortgage', 'auto', 'student', 'other'];

function normalizeType(value) {
  const normalized = value.toLowerCase().replace(/\s+/g, '_');
  if (SUPPORTED_TYPES.includes(normalized)) {
    return normalized;
  }
  return 'other';
}

function createDebtService(context) {
  const { db, config } = context;

  function formatDebt(debt) {
    const totalPaid = clampToZero(debt.totalPaid || 0);
    const progress = debt.principal > 0 ? clampToZero(((debt.principal - debt.balance) / debt.principal) * 100) : 0;
    let status = 'active';
    if (debt.balance <= 0.01) {
      status = 'paid';
    } else if (new Date(debt.dueDate) < new Date()) {
      status = 'overdue';
    }
    return {
      id: debt.id,
      userId: debt.userId,
      name: debt.name,
      principal: clampToZero(debt.principal),
      apr: debt.apr,
      minimumPayment: clampToZero(debt.minimumPayment),
      dueDate: debt.dueDate,
      type: debt.type,
      balance: clampToZero(debt.balance),
      totalPaid,
      progress,
      status,
      createdAt: debt.createdAt,
      updatedAt: debt.updatedAt,
      lastPaymentAt: debt.lastPaymentAt || null,
    };
  }

  async function ensureDebt(userId, debtId) {
    const debt = await db.getDebtById(debtId);
    if (!debt || debt.userId !== userId) {
      throw new AppError(404, 'Debt not found.');
    }
    return debt;
  }

  async function createDebt(user, payload) {
    if (user.membership !== 'premium') {
      const debts = await db.listDebtsByUser(user.id);
      if (debts.length >= config.freeDebtLimit) {
        throw new AppError(403, `Free membership allows up to ${config.freeDebtLimit} debts.`);
      }
    }
    const name = getString(payload, 'name', { minLength: 1 });
    const principal = getNumber(payload, 'principal', { min: 0.01 });
    const apr = getNumber(payload, 'apr', { min: 0 });
    const minimumPayment = getNumber(payload, 'minimumPayment', { min: 0.01 });
    const dueDate = getDate(payload, 'dueDate');
    const type = payload.type ? normalizeType(String(payload.type)) : 'other';
    const now = new Date().toISOString();
    const debt = {
      id: crypto.randomUUID(),
      userId: user.id,
      name,
      principal: clampToZero(principal),
      apr,
      minimumPayment: clampToZero(minimumPayment),
      dueDate: dueDate.toISOString(),
      type,
      balance: clampToZero(principal),
      totalPaid: 0,
      createdAt: now,
      updatedAt: now,
      lastPaymentAt: null,
    };
    const stored = await db.createDebt(debt);
    return formatDebt(stored || debt);
  }

  async function listDebts(userId, query = {}) {
    let results = await db.listDebtsByUser(userId);
    if (query.type) {
      const requested = normalizeType(String(query.type));
      results = results.filter((debt) => debt.type === requested);
    }
    if (query.status === 'active') {
      results = results.filter((debt) => debt.balance > 0.01);
    }
    if (query.status === 'paid') {
      results = results.filter((debt) => debt.balance <= 0.01);
    }
    if (query.sort === 'balance') {
      results.sort((a, b) => a.balance - b.balance);
    } else if (query.sort === 'apr') {
      results.sort((a, b) => b.apr - a.apr);
    } else if (query.sort === 'dueDate') {
      results.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    } else {
      results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    return results.map((debt) => formatDebt(debt));
  }

  async function getDebt(userId, debtId) {
    const debt = await ensureDebt(userId, debtId);
    return formatDebt(debt);
  }

  async function updateDebt(userId, debtId, payload) {
    const debt = await ensureDebt(userId, debtId);
    const updates = {};
    let updatedPrincipal = debt.principal;
    let updatedBalance = debt.balance;
    if (payload.name !== undefined) {
      updates.name = getString(payload, 'name', { required: false, defaultValue: debt.name });
    }
    if (payload.apr !== undefined) {
      updates.apr = getNumber(payload, 'apr', { required: false, min: 0, defaultValue: debt.apr });
    }
    if (payload.minimumPayment !== undefined) {
      updates.minimumPayment = clampToZero(
        getNumber(payload, 'minimumPayment', { required: false, min: 0.01, defaultValue: debt.minimumPayment }),
      );
    }
    if (payload.principal !== undefined) {
      updatedPrincipal = clampToZero(
        getNumber(payload, 'principal', { required: false, min: 0.01, defaultValue: debt.principal }),
      );
      updates.principal = updatedPrincipal;
      if (updatedBalance > updatedPrincipal) {
        updatedBalance = updatedPrincipal;
        updates.balance = updatedBalance;
      }
    }
    if (payload.balance !== undefined) {
      updatedBalance = clampToZero(
        getNumber(payload, 'balance', { required: false, min: 0, defaultValue: debt.balance }),
      );
      if (updatedBalance > updatedPrincipal) {
        updatedBalance = updatedPrincipal;
      }
      updates.balance = updatedBalance;
    }
    if (payload.dueDate !== undefined) {
      updates.dueDate = getDate(payload, 'dueDate', {
        required: false,
        defaultValue: new Date(debt.dueDate),
      }).toISOString();
    }
    if (payload.type !== undefined) {
      updates.type = normalizeType(String(payload.type));
    }
    updates.updatedAt = new Date().toISOString();
    const stored = await db.updateDebt(debtId, updates);
    const updatedDebt = stored || { ...debt, ...updates };
    return formatDebt(updatedDebt);
  }

  async function deleteDebt(userId, debtId) {
    await ensureDebt(userId, debtId);
    await db.deleteDebt(debtId);
    await db.deletePaymentsByDebt(debtId);
    return { success: true };
  }

  async function recordPayment(userId, debtId, payload) {
    const debt = await ensureDebt(userId, debtId);
    const amount = getNumber(payload, 'amount', { min: 0.01 });
    const paidAt = payload.paidAt ? getDate(payload, 'paidAt', { required: false, defaultValue: new Date() }) : new Date();
    const note = payload.note ? getString(payload, 'note', { required: false, defaultValue: '' }) : '';

    const payment = {
      id: crypto.randomUUID(),
      userId,
      debtId,
      amount: clampToZero(amount),
      paidAt: paidAt.toISOString(),
      createdAt: new Date().toISOString(),
      note,
    };
    await db.createPayment(payment);
    let newBalance = clampToZero(debt.balance - amount);
    if (newBalance <= 0.01) {
      newBalance = 0;
    }
    const updates = {
      balance: newBalance,
      totalPaid: clampToZero((debt.totalPaid || 0) + amount),
      lastPaymentAt: payment.paidAt,
      updatedAt: new Date().toISOString(),
    };
    const storedDebt = await db.updateDebt(debtId, updates);
    const updatedDebt = storedDebt || { ...debt, ...updates };
    return {
      payment,
      debt: formatDebt(updatedDebt),
    };
  }

  async function listPayments(userId, debtId) {
    await ensureDebt(userId, debtId);
    return db.listPaymentsByDebt(userId, debtId);
  }

  return {
    createDebt,
    listDebts,
    getDebt,
    updateDebt,
    deleteDebt,
    recordPayment,
    listPayments,
  };
}

export default createDebtService;
