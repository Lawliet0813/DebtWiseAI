import express from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../db/connection.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation schemas
const paymentSchema = Joi.object({
  debtId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).required(),
  paymentDate: Joi.date().iso().default(() => new Date()),
  paymentType: Joi.string().valid('regular', 'extra', 'minimum').default('regular'),
  notes: Joi.string().max(500).optional().allow('')
});

// GET /api/payments - Get payment history
router.get('/', asyncHandler(async (req, res) => {
  const { debtId, limit = 50, offset = 0, startDate, endDate } = req.query;
  
  let whereClause = 'WHERE d.user_id = $1';
  const params = [req.user.id];
  let paramIndex = 2;

  if (debtId) {
    whereClause += ` AND ph.debt_id = $${paramIndex}`;
    params.push(debtId);
    paramIndex++;
  }

  if (startDate) {
    whereClause += ` AND ph.payment_date >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    whereClause += ` AND ph.payment_date <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  const result = await query(
    `SELECT ph.*, d.debt_name, d.debt_type, d.creditor_name
     FROM payment_history ph
     JOIN debts d ON ph.debt_id = d.id
     ${whereClause}
     ORDER BY ph.payment_date DESC, ph.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM payment_history ph
     JOIN debts d ON ph.debt_id = d.id
     ${whereClause}`,
    params
  );

  const payments = result.rows.map(payment => ({
    ...payment,
    amount: parseFloat(payment.amount),
    interestPortion: parseFloat(payment.interest_portion) || 0,
    principalPortion: parseFloat(payment.principal_portion) || 0,
    remainingBalance: parseFloat(payment.remaining_balance)
  }));

  const summary = {
    totalPayments: payments.reduce((sum, p) => sum + p.amount, 0),
    totalPrincipal: payments.reduce((sum, p) => sum + p.principalPortion, 0),
    totalInterest: payments.reduce((sum, p) => sum + p.interestPortion, 0),
    paymentCount: payments.length
  };

  res.json({
    payments,
    summary,
    pagination: {
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + payments.length < parseInt(countResult.rows[0].total)
    }
  });
}));

// POST /api/payments - Record new payment
router.post('/', asyncHandler(async (req, res) => {
  const { error, value } = paymentSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid payment data', error.details);
  }

  const { debtId, amount, paymentDate, paymentType, notes } = value;

  const result = await withTransaction(async (client) => {
    // Verify debt exists and belongs to user
    const debtResult = await client.query(
      'SELECT * FROM debts WHERE id = $1 AND user_id = $2 AND is_active = true',
      [debtId, req.user.id]
    );

    if (debtResult.rows.length === 0) {
      throw new NotFoundError('Active debt');
    }

    const debt = debtResult.rows[0];
    const currentBalance = parseFloat(debt.current_balance);

    // Calculate interest and principal portions
    const monthlyRate = parseFloat(debt.interest_rate) / 12;
    const interestPortion = currentBalance * monthlyRate;
    const principalPortion = Math.min(amount - Math.max(0, interestPortion), currentBalance);
    const newBalance = Math.max(0, currentBalance - principalPortion);

    // Record payment
    const paymentResult = await client.query(
      `INSERT INTO payment_history (
        debt_id, amount, payment_date, payment_type, 
        interest_portion, principal_portion, remaining_balance, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        debtId, amount, paymentDate, paymentType,
        interestPortion, principalPortion, newBalance, notes
      ]
    );

    // Update debt balance
    const isPaidOff = newBalance === 0;
    await client.query(
      `UPDATE debts 
       SET current_balance = $1, 
           updated_at = CURRENT_TIMESTAMP,
           is_active = $2,
           paid_off_date = $3
       WHERE id = $4`,
      [newBalance, !isPaidOff, isPaidOff ? new Date() : null, debtId]
    );

    return {
      payment: paymentResult.rows[0],
      debt: { ...debt, current_balance: newBalance, is_active: !isPaidOff }
    };
  });

  // Update financial snapshot
  await updateFinancialSnapshot(req.user.id);

  const payment = {
    ...result.payment,
    amount: parseFloat(result.payment.amount),
    interestPortion: parseFloat(result.payment.interest_portion),
    principalPortion: parseFloat(result.payment.principal_portion),
    remainingBalance: parseFloat(result.payment.remaining_balance)
  };

  res.status(201).json({
    message: 'Payment recorded successfully',
    payment,
    isPaidOff: result.debt.current_balance === 0
  });
}));

// GET /api/payments/:id - Get single payment
router.get('/:id', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT ph.*, d.debt_name, d.debt_type, d.creditor_name
     FROM payment_history ph
     JOIN debts d ON ph.debt_id = d.id
     WHERE ph.id = $1 AND d.user_id = $2`,
    [req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Payment');
  }

  const payment = result.rows[0];
  res.json({
    ...payment,
    amount: parseFloat(payment.amount),
    interestPortion: parseFloat(payment.interest_portion) || 0,
    principalPortion: parseFloat(payment.principal_portion) || 0,
    remainingBalance: parseFloat(payment.remaining_balance)
  });
}));

// DELETE /api/payments/:id - Delete payment (and adjust debt balance)
router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await withTransaction(async (client) => {
    // Get payment details
    const paymentResult = await client.query(
      `SELECT ph.*, d.debt_name 
       FROM payment_history ph
       JOIN debts d ON ph.debt_id = d.id
       WHERE ph.id = $1 AND d.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (paymentResult.rows.length === 0) {
      throw new NotFoundError('Payment');
    }

    const payment = paymentResult.rows[0];
    const principalPortion = parseFloat(payment.principal_portion) || 0;

    // Check if this is the most recent payment for the debt
    const recentPaymentResult = await client.query(
      `SELECT id FROM payment_history 
       WHERE debt_id = $1 AND payment_date >= $2
       ORDER BY payment_date DESC, created_at DESC
       LIMIT 1`,
      [payment.debt_id, payment.payment_date]
    );

    if (recentPaymentResult.rows.length === 0 || recentPaymentResult.rows[0].id !== payment.id) {
      throw new ValidationError('Can only delete the most recent payment for a debt');
    }

    // Delete payment
    await client.query('DELETE FROM payment_history WHERE id = $1', [req.params.id]);

    // Restore debt balance
    await client.query(
      `UPDATE debts 
       SET current_balance = current_balance + $1,
           is_active = true,
           paid_off_date = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [principalPortion, payment.debt_id]
    );

    return payment;
  });

  // Update financial snapshot
  await updateFinancialSnapshot(req.user.id);

  res.json({
    message: `Payment for "${result.debt_name}" deleted successfully`
  });
}));

// GET /api/payments/stats/summary - Payment statistics
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const { period = '12months' } = req.query;
  
  let dateFilter = '';
  const params = [req.user.id];

  switch (period) {
    case '1month':
      dateFilter = "AND ph.payment_date >= CURRENT_DATE - INTERVAL '1 month'";
      break;
    case '3months':
      dateFilter = "AND ph.payment_date >= CURRENT_DATE - INTERVAL '3 months'";
      break;
    case '6months':
      dateFilter = "AND ph.payment_date >= CURRENT_DATE - INTERVAL '6 months'";
      break;
    case '12months':
      dateFilter = "AND ph.payment_date >= CURRENT_DATE - INTERVAL '12 months'";
      break;
    case 'ytd':
      dateFilter = "AND ph.payment_date >= DATE_TRUNC('year', CURRENT_DATE)";
      break;
    case 'all':
    default:
      dateFilter = '';
      break;
  }

  const summaryResult = await query(
    `SELECT 
      COUNT(*) as total_payments,
      SUM(ph.amount) as total_amount,
      SUM(ph.principal_portion) as total_principal,
      SUM(ph.interest_portion) as total_interest,
      AVG(ph.amount) as average_payment,
      MIN(ph.payment_date) as first_payment,
      MAX(ph.payment_date) as last_payment,
      COUNT(DISTINCT ph.debt_id) as debts_paid_on
     FROM payment_history ph
     JOIN debts d ON ph.debt_id = d.id
     WHERE d.user_id = $1 ${dateFilter}`,
    params
  );

  const monthlyResult = await query(
    `SELECT 
      DATE_TRUNC('month', ph.payment_date) as month,
      SUM(ph.amount) as total_amount,
      SUM(ph.principal_portion) as principal,
      SUM(ph.interest_portion) as interest,
      COUNT(*) as payment_count
     FROM payment_history ph
     JOIN debts d ON ph.debt_id = d.id
     WHERE d.user_id = $1 ${dateFilter}
     GROUP BY DATE_TRUNC('month', ph.payment_date)
     ORDER BY month DESC
     LIMIT 12`,
    params
  );

  const summary = summaryResult.rows[0];
  const monthlyTrends = monthlyResult.rows.map(row => ({
    month: row.month,
    totalAmount: parseFloat(row.total_amount),
    principal: parseFloat(row.principal),
    interest: parseFloat(row.interest),
    paymentCount: parseInt(row.payment_count)
  }));

  res.json({
    summary: {
      totalPayments: parseInt(summary.total_payments),
      totalAmount: parseFloat(summary.total_amount) || 0,
      totalPrincipal: parseFloat(summary.total_principal) || 0,
      totalInterest: parseFloat(summary.total_interest) || 0,
      averagePayment: parseFloat(summary.average_payment) || 0,
      firstPayment: summary.first_payment,
      lastPayment: summary.last_payment,
      debtsPaidOn: parseInt(summary.debts_paid_on)
    },
    monthlyTrends,
    period
  });
}));

// Helper function to update financial snapshot
async function updateFinancialSnapshot(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const debtsResult = await query(
      `SELECT SUM(current_balance) as total_debt, SUM(minimum_payment) as monthly_payment
       FROM debts WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    
    const totalDebt = parseFloat(debtsResult.rows[0].total_debt) || 0;
    const monthlyPayment = parseFloat(debtsResult.rows[0].monthly_payment) || 0;

    await query(
      `INSERT INTO financial_snapshots (user_id, snapshot_date, total_debt, monthly_payment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, snapshot_date) 
       DO UPDATE SET total_debt = EXCLUDED.total_debt, monthly_payment = EXCLUDED.monthly_payment`,
      [userId, today, totalDebt, monthlyPayment]
    );
  } catch (error) {
    console.error('Error updating financial snapshot:', error);
  }
}

export default router;