import express from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../db/connection.js';
import { asyncHandler, ValidationError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation schemas
const debtSchema = Joi.object({
  debtName: Joi.string().min(1).max(200).required(),
  debtType: Joi.string().valid('credit_card', 'personal_loan', 'mortgage', 'student_loan', 'other').required(),
  originalAmount: Joi.number().positive().precision(2).required(),
  currentBalance: Joi.number().min(0).precision(2).required(),
  interestRate: Joi.number().min(0).max(1).precision(4).required(), // APR as decimal
  minimumPayment: Joi.number().positive().precision(2).required(),
  dueDate: Joi.number().integer().min(1).max(31).required(),
  creditorName: Joi.string().max(200).optional().allow(''),
  accountNumberLast4: Joi.string().length(4).optional().allow(''),
  notes: Joi.string().max(1000).optional().allow('')
});

const updateDebtSchema = debtSchema.fork(['debtName', 'debtType', 'originalAmount', 'currentBalance', 'interestRate', 'minimumPayment', 'dueDate'], (schema) => schema.optional());

// GET /api/debts - Get all debts for authenticated user
router.get('/', asyncHandler(async (req, res) => {
  const { status = 'active', sortBy = 'created_at', order = 'desc' } = req.query;
  
  const validSortFields = ['debt_name', 'current_balance', 'interest_rate', 'minimum_payment', 'due_date', 'created_at'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
  
  let whereClause = 'WHERE user_id = $1';
  const params = [req.user.id];
  
  if (status === 'active') {
    whereClause += ' AND is_active = true AND current_balance > 0';
  } else if (status === 'paid_off') {
    whereClause += ' AND (is_active = false OR current_balance = 0)';
  }

  const result = await query(
    `SELECT id, debt_name, debt_type, original_amount, current_balance, 
            interest_rate, minimum_payment, due_date, creditor_name, 
            account_number_last4, created_at, updated_at, paid_off_date, 
            is_active, priority_order, notes
     FROM debts 
     ${whereClause}
     ORDER BY ${sortField} ${sortOrder}`,
    params
  );

  // Calculate additional metrics
  const debts = result.rows.map(debt => ({
    ...debt,
    interestRate: parseFloat(debt.interest_rate),
    originalAmount: parseFloat(debt.original_amount),
    currentBalance: parseFloat(debt.current_balance),
    minimumPayment: parseFloat(debt.minimum_payment),
    utilizationRate: debt.original_amount > 0 ? (debt.current_balance / debt.original_amount) : 0,
    monthsToPayOff: calculatePayoffTime(debt.current_balance, debt.interest_rate, debt.minimum_payment),
    totalInterestRemaining: calculateRemainingInterest(debt.current_balance, debt.interest_rate, debt.minimum_payment)
  }));

  const summary = {
    totalDebts: debts.length,
    totalBalance: debts.reduce((sum, debt) => sum + debt.currentBalance, 0),
    totalMinimumPayment: debts.reduce((sum, debt) => sum + debt.minimumPayment, 0),
    averageInterestRate: debts.length > 0 ? debts.reduce((sum, debt) => sum + debt.interestRate, 0) / debts.length : 0,
    highestInterestRate: Math.max(...debts.map(d => d.interestRate), 0),
    largestBalance: Math.max(...debts.map(d => d.currentBalance), 0)
  };

  res.json({
    debts,
    summary,
    count: debts.length
  });
}));

// GET /api/debts/:id - Get single debt
router.get('/:id', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT d.*, 
            COUNT(ph.id) as payment_count,
            SUM(ph.amount) as total_payments,
            MAX(ph.payment_date) as last_payment_date
     FROM debts d
     LEFT JOIN payment_history ph ON d.id = ph.debt_id
     WHERE d.id = $1 AND d.user_id = $2
     GROUP BY d.id`,
    [req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Debt');
  }

  const debt = result.rows[0];
  
  res.json({
    ...debt,
    interestRate: parseFloat(debt.interest_rate),
    originalAmount: parseFloat(debt.original_amount),
    currentBalance: parseFloat(debt.current_balance),
    minimumPayment: parseFloat(debt.minimum_payment),
    paymentCount: parseInt(debt.payment_count),
    totalPayments: parseFloat(debt.total_payments) || 0,
    monthsToPayOff: calculatePayoffTime(debt.current_balance, debt.interest_rate, debt.minimum_payment),
    totalInterestRemaining: calculateRemainingInterest(debt.current_balance, debt.interest_rate, debt.minimum_payment)
  });
}));

// POST /api/debts - Create new debt
router.post('/', asyncHandler(async (req, res) => {
  const { error, value } = debtSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid debt data', error.details);
  }

  const {
    debtName, debtType, originalAmount, currentBalance, interestRate,
    minimumPayment, dueDate, creditorName, accountNumberLast4, notes
  } = value;

  const result = await query(
    `INSERT INTO debts (
      user_id, debt_name, debt_type, original_amount, current_balance,
      interest_rate, minimum_payment, due_date, creditor_name,
      account_number_last4, notes, priority_order
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
      (SELECT COALESCE(MAX(priority_order), 0) + 1 FROM debts WHERE user_id = $1))
    RETURNING *`,
    [
      req.user.id, debtName, debtType, originalAmount, currentBalance,
      interestRate, minimumPayment, dueDate, creditorName,
      accountNumberLast4, notes
    ]
  );

  const debt = result.rows[0];

  // Create initial financial snapshot
  await updateFinancialSnapshot(req.user.id);

  res.status(201).json({
    message: 'Debt created successfully',
    debt: {
      ...debt,
      interestRate: parseFloat(debt.interest_rate),
      originalAmount: parseFloat(debt.original_amount),
      currentBalance: parseFloat(debt.current_balance),
      minimumPayment: parseFloat(debt.minimum_payment)
    }
  });
}));

// PUT /api/debts/:id - Update debt
router.put('/:id', asyncHandler(async (req, res) => {
  const { error, value } = updateDebtSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid debt data', error.details);
  }

  // Check if debt exists and belongs to user
  const existingDebt = await query(
    'SELECT id FROM debts WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );

  if (existingDebt.rows.length === 0) {
    throw new NotFoundError('Debt');
  }

  // Build update query dynamically
  const updates = [];
  const params = [req.params.id, req.user.id];
  let paramIndex = 3;

  Object.entries(value).forEach(([key, val]) => {
    if (val !== undefined) {
      const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      updates.push(`${dbKey} = $${paramIndex}`);
      params.push(val);
      paramIndex++;
    }
  });

  if (updates.length === 0) {
    throw new ValidationError('No valid fields to update');
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const result = await query(
    `UPDATE debts 
     SET ${updates.join(', ')}
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    params
  );

  const debt = result.rows[0];
  
  // Update financial snapshot
  await updateFinancialSnapshot(req.user.id);

  res.json({
    message: 'Debt updated successfully',
    debt: {
      ...debt,
      interestRate: parseFloat(debt.interest_rate),
      originalAmount: parseFloat(debt.original_amount),
      currentBalance: parseFloat(debt.current_balance),
      minimumPayment: parseFloat(debt.minimum_payment)
    }
  });
}));

// DELETE /api/debts/:id - Delete debt
router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await withTransaction(async (client) => {
    // Check if debt exists and belongs to user
    const debtResult = await client.query(
      'SELECT id, debt_name FROM debts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (debtResult.rows.length === 0) {
      throw new NotFoundError('Debt');
    }

    // Delete associated payment history (CASCADE will handle this, but let's be explicit)
    await client.query('DELETE FROM payment_history WHERE debt_id = $1', [req.params.id]);
    
    // Delete debt
    await client.query('DELETE FROM debts WHERE id = $1', [req.params.id]);
    
    return debtResult.rows[0];
  });

  // Update financial snapshot
  await updateFinancialSnapshot(req.user.id);

  res.json({
    message: `Debt "${result.debt_name}" deleted successfully`
  });
}));

// PUT /api/debts/:id/payoff - Mark debt as paid off
router.put('/:id/payoff', asyncHandler(async (req, res) => {
  const { payoffDate, finalPayment } = req.body;

  const result = await withTransaction(async (client) => {
    // Check if debt exists and belongs to user
    const debtResult = await client.query(
      'SELECT * FROM debts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (debtResult.rows.length === 0) {
      throw new NotFoundError('Debt');
    }

    const debt = debtResult.rows[0];

    // Add final payment if specified
    if (finalPayment && finalPayment > 0) {
      await client.query(
        `INSERT INTO payment_history (debt_id, amount, payment_date, payment_type, remaining_balance)
         VALUES ($1, $2, $3, 'final', 0)`,
        [req.params.id, finalPayment, payoffDate || new Date()]
      );
    }

    // Mark debt as paid off
    const updateResult = await client.query(
      `UPDATE debts 
       SET current_balance = 0, is_active = false, paid_off_date = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [payoffDate || new Date(), req.params.id, req.user.id]
    );

    return updateResult.rows[0];
  });

  // Update financial snapshot
  await updateFinancialSnapshot(req.user.id);

  res.json({
    message: 'Debt marked as paid off successfully',
    debt: result
  });
}));

// Helper functions
function calculatePayoffTime(balance, interestRate, minimumPayment) {
  if (balance <= 0 || minimumPayment <= 0 || interestRate < 0) return 0;
  
  const monthlyRate = interestRate / 12;
  if (monthlyRate === 0) {
    return Math.ceil(balance / minimumPayment);
  }
  
  const months = -Math.log(1 - (balance * monthlyRate) / minimumPayment) / Math.log(1 + monthlyRate);
  return Math.ceil(months);
}

function calculateRemainingInterest(balance, interestRate, minimumPayment) {
  const months = calculatePayoffTime(balance, interestRate, minimumPayment);
  const totalPayments = months * minimumPayment;
  return Math.max(0, totalPayments - balance);
}

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
    // Don't throw error to avoid breaking the main operation
  }
}

export default router;