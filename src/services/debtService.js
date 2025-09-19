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

  function ensureDebt(userId, debtId) {
    const debt = db.data.debts.find((record) => record.id === debtId && record.userId === userId);
    if (!debt) {
      throw new AppError(404, 'Debt not found.');
    }
    return debt;
  }

  function createDebt(user, payload) {
    if (user.membership !== 'premium') {
      const count = db.data.debts.filter((debt) => debt.userId === user.id).length;
      if (count >= config.freeDebtLimit) {
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
    db.data.debts.push(debt);
    db.write();
    return formatDebt(debt);
  }

  function listDebts(userId, query = {}) {
    let results = db.data.debts.filter((debt) => debt.userId === userId);
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

  function getDebt(userId, debtId) {
    return formatDebt(ensureDebt(userId, debtId));
  }

  function updateDebt(userId, debtId, payload) {
    const debt = ensureDebt(userId, debtId);
    if (payload.name !== undefined) {
      debt.name = getString(payload, 'name', { required: false, defaultValue: debt.name });
    }
    if (payload.apr !== undefined) {
      debt.apr = getNumber(payload, 'apr', { required: false, min: 0, defaultValue: debt.apr });
    }
    if (payload.minimumPayment !== undefined) {
      debt.minimumPayment = clampToZero(getNumber(payload, 'minimumPayment', { required: false, min: 0.01, defaultValue: debt.minimumPayment }));
    }
    if (payload.dueDate !== undefined) {
      debt.dueDate = getDate(payload, 'dueDate', { required: false, defaultValue: new Date(debt.dueDate) }).toISOString();
    }
    if (payload.type !== undefined) {
      debt.type = normalizeType(String(payload.type));
    }
    debt.updatedAt = new Date().toISOString();
    db.write();
    return formatDebt(debt);
  }

  function deleteDebt(userId, debtId) {
    const debt = ensureDebt(userId, debtId);
    db.data.debts = db.data.debts.filter((record) => record.id !== debtId);
    db.data.payments = db.data.payments.filter((payment) => payment.debtId !== debtId);
    db.write();
    return { success: true };
  }

  function recordPayment(userId, debtId, payload) {
    const debt = ensureDebt(userId, debtId);
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
    db.data.payments.push(payment);
    debt.balance = clampToZero(debt.balance - amount);
    debt.totalPaid = clampToZero((debt.totalPaid || 0) + amount);
    debt.lastPaymentAt = payment.paidAt;
    debt.updatedAt = new Date().toISOString();
    if (debt.balance <= 0.01) {
      debt.balance = 0;
    }
    db.write();
    return {
      payment,
      debt: formatDebt(debt),
    };
  }

  function listPayments(userId, debtId) {
    ensureDebt(userId, debtId);
    return db.data.payments
      .filter((payment) => payment.userId === userId && payment.debtId === debtId)
      .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
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
