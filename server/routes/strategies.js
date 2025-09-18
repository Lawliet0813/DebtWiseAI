import express from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../db/connection.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation schemas
const strategySchema = Joi.object({
  strategyName: Joi.string().min(1).max(100).required(),
  strategyType: Joi.string().valid('snowball', 'avalanche', 'custom', 'ai_optimized').required(),
  totalExtraPayment: Joi.number().min(0).precision(2).default(0),
  targetPayoffDate: Joi.date().iso().optional(),
  debtOrder: Joi.array().items(
    Joi.object({
      debtId: Joi.string().uuid().required(),
      orderPosition: Joi.number().integer().positive().required(),
      allocatedExtraPayment: Joi.number().min(0).precision(2).default(0)
    })
  ).optional()
});

// GET /api/strategies - Get all repayment strategies
router.get('/', asyncHandler(async (req, res) => {
  const strategiesResult = await query(
    `SELECT * FROM repayment_strategies 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [req.user.id]
  );

  const strategies = await Promise.all(
    strategiesResult.rows.map(async (strategy) => {
      // Get debt order for each strategy
      const debtOrderResult = await query(
        `SELECT sdo.*, d.debt_name, d.current_balance, d.interest_rate, d.minimum_payment
         FROM strategy_debt_orders sdo
         JOIN debts d ON sdo.debt_id = d.id
         WHERE sdo.strategy_id = $1
         ORDER BY sdo.order_position`,
        [strategy.id]
      );

      return {
        ...strategy,
        totalExtraPayment: parseFloat(strategy.total_extra_payment),
        estimatedTotalInterest: parseFloat(strategy.estimated_total_interest) || 0,
        estimatedPayoffMonths: parseInt(strategy.estimated_payoff_months) || 0,
        monthlySavings: parseFloat(strategy.monthly_savings) || 0,
        debtOrder: debtOrderResult.rows.map(debt => ({
          ...debt,
          currentBalance: parseFloat(debt.current_balance),
          interestRate: parseFloat(debt.interest_rate),
          minimumPayment: parseFloat(debt.minimum_payment),
          allocatedExtraPayment: parseFloat(debt.allocated_extra_payment)
        }))
      };
    })
  );

  res.json({
    strategies,
    count: strategies.length
  });
}));

// GET /api/strategies/:id - Get single strategy
router.get('/:id', asyncHandler(async (req, res) => {
  const strategyResult = await query(
    'SELECT * FROM repayment_strategies WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );

  if (strategyResult.rows.length === 0) {
    throw new NotFoundError('Strategy');
  }

  const strategy = strategyResult.rows[0];

  // Get debt order
  const debtOrderResult = await query(
    `SELECT sdo.*, d.debt_name, d.current_balance, d.interest_rate, d.minimum_payment, d.debt_type
     FROM strategy_debt_orders sdo
     JOIN debts d ON sdo.debt_id = d.id
     WHERE sdo.strategy_id = $1
     ORDER BY sdo.order_position`,
    [strategy.id]
  );

  // Calculate detailed payoff schedule
  const payoffSchedule = calculatePayoffSchedule(debtOrderResult.rows, strategy.total_extra_payment);

  res.json({
    ...strategy,
    totalExtraPayment: parseFloat(strategy.total_extra_payment),
    estimatedTotalInterest: parseFloat(strategy.estimated_total_interest) || 0,
    estimatedPayoffMonths: parseInt(strategy.estimated_payoff_months) || 0,
    monthlySavings: parseFloat(strategy.monthly_savings) || 0,
    debtOrder: debtOrderResult.rows.map(debt => ({
      ...debt,
      currentBalance: parseFloat(debt.current_balance),
      interestRate: parseFloat(debt.interest_rate),
      minimumPayment: parseFloat(debt.minimum_payment),
      allocatedExtraPayment: parseFloat(debt.allocated_extra_payment)
    })),
    payoffSchedule
  });
}));

// POST /api/strategies - Create new strategy
router.post('/', asyncHandler(async (req, res) => {
  const { error, value } = strategySchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid strategy data', error.details);
  }

  const { strategyName, strategyType, totalExtraPayment, targetPayoffDate, debtOrder } = value;

  const result = await withTransaction(async (client) => {
    // Get user's active debts if debtOrder not provided
    let finalDebtOrder = debtOrder;
    if (!debtOrder) {
      const debtsResult = await client.query(
        'SELECT id, current_balance, interest_rate FROM debts WHERE user_id = $1 AND is_active = true',
        [req.user.id]
      );

      const debts = debtsResult.rows.map(debt => ({
        debtId: debt.id,
        balance: parseFloat(debt.current_balance),
        interestRate: parseFloat(debt.interest_rate)
      }));

      // Auto-generate order based on strategy type
      if (strategyType === 'snowball') {
        debts.sort((a, b) => a.balance - b.balance);
      } else if (strategyType === 'avalanche') {
        debts.sort((a, b) => b.interestRate - a.interestRate);
      }

      finalDebtOrder = debts.map((debt, index) => ({
        debtId: debt.debtId,
        orderPosition: index + 1,
        allocatedExtraPayment: 0
      }));
    }

    // Calculate strategy metrics
    const metrics = await calculateStrategyMetrics(client, req.user.id, finalDebtOrder, totalExtraPayment);

    // Create strategy
    const strategyResult = await client.query(
      `INSERT INTO repayment_strategies (
        user_id, strategy_name, strategy_type, total_extra_payment,
        target_payoff_date, estimated_total_interest, estimated_payoff_months, monthly_savings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        req.user.id, strategyName, strategyType, totalExtraPayment,
        targetPayoffDate, metrics.totalInterest, metrics.payoffMonths, metrics.monthlySavings
      ]
    );

    const strategy = strategyResult.rows[0];

    // Create debt order entries
    for (const debtEntry of finalDebtOrder) {
      await client.query(
        `INSERT INTO strategy_debt_orders (strategy_id, debt_id, order_position, allocated_extra_payment)
         VALUES ($1, $2, $3, $4)`,
        [strategy.id, debtEntry.debtId, debtEntry.orderPosition, debtEntry.allocatedExtraPayment || 0]
      );
    }

    return strategy;
  });

  res.status(201).json({
    message: 'Strategy created successfully',
    strategy: {
      ...result,
      totalExtraPayment: parseFloat(result.total_extra_payment),
      estimatedTotalInterest: parseFloat(result.estimated_total_interest) || 0,
      estimatedPayoffMonths: parseInt(result.estimated_payoff_months) || 0,
      monthlySavings: parseFloat(result.monthly_savings) || 0
    }
  });
}));

// PUT /api/strategies/:id/activate - Activate strategy
router.put('/:id/activate', asyncHandler(async (req, res) => {
  const result = await withTransaction(async (client) => {
    // Check if strategy exists and belongs to user
    const strategyResult = await client.query(
      'SELECT * FROM repayment_strategies WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (strategyResult.rows.length === 0) {
      throw new NotFoundError('Strategy');
    }

    // Deactivate all other strategies for this user
    await client.query(
      'UPDATE repayment_strategies SET is_active = false WHERE user_id = $1',
      [req.user.id]
    );

    // Activate selected strategy
    const updateResult = await client.query(
      'UPDATE repayment_strategies SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    return updateResult.rows[0];
  });

  res.json({
    message: 'Strategy activated successfully',
    strategy: result
  });
}));

// DELETE /api/strategies/:id - Delete strategy
router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await withTransaction(async (client) => {
    // Check if strategy exists and belongs to user
    const strategyResult = await client.query(
      'SELECT strategy_name FROM repayment_strategies WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (strategyResult.rows.length === 0) {
      throw new NotFoundError('Strategy');
    }

    // Delete strategy (CASCADE will handle debt_orders)
    await client.query('DELETE FROM repayment_strategies WHERE id = $1', [req.params.id]);

    return strategyResult.rows[0];
  });

  res.json({
    message: `Strategy "${result.strategy_name}" deleted successfully`
  });
}));

// POST /api/strategies/compare - Compare different strategies
router.post('/compare', asyncHandler(async (req, res) => {
  const { extraPayment = 0 } = req.body;

  // Get user's active debts
  const debtsResult = await query(
    `SELECT id, debt_name, current_balance, interest_rate, minimum_payment, debt_type
     FROM debts WHERE user_id = $1 AND is_active = true
     ORDER BY created_at`,
    [req.user.id]
  );

  const debts = debtsResult.rows.map(debt => ({
    id: debt.id,
    name: debt.debt_name,
    balance: parseFloat(debt.current_balance),
    interestRate: parseFloat(debt.interest_rate),
    minimumPayment: parseFloat(debt.minimum_payment),
    type: debt.debt_type
  }));

  if (debts.length === 0) {
    return res.json({
      message: 'No active debts found',
      strategies: []
    });
  }

  // Calculate different strategies
  const strategies = [];

  // 1. Minimum payments only
  const minimumOnly = calculateStrategyResult(debts, 0, 'current');
  strategies.push({
    name: 'Minimum Payments Only',
    type: 'minimum_only',
    description: 'Continue making only minimum payments',
    totalMonths: minimumOnly.totalMonths,
    totalInterest: minimumOnly.totalInterest,
    totalPaid: minimumOnly.totalPaid,
    monthlyPayment: debts.reduce((sum, d) => sum + d.minimumPayment, 0),
    savings: 0
  });

  // 2. Debt Snowball
  const snowballDebts = [...debts].sort((a, b) => a.balance - b.balance);
  const snowball = calculateStrategyResult(snowballDebts, extraPayment, 'snowball');
  strategies.push({
    name: 'Debt Snowball',
    type: 'snowball',
    description: 'Pay off smallest balances first for psychological wins',
    totalMonths: snowball.totalMonths,
    totalInterest: snowball.totalInterest,
    totalPaid: snowball.totalPaid,
    monthlyPayment: debts.reduce((sum, d) => sum + d.minimumPayment, 0) + extraPayment,
    savings: minimumOnly.totalInterest - snowball.totalInterest,
    timeSaved: minimumOnly.totalMonths - snowball.totalMonths,
    payoffOrder: snowballDebts.map(d => ({ id: d.id, name: d.name }))
  });

  // 3. Debt Avalanche
  const avalancheDebts = [...debts].sort((a, b) => b.interestRate - a.interestRate);
  const avalanche = calculateStrategyResult(avalancheDebts, extraPayment, 'avalanche');
  strategies.push({
    name: 'Debt Avalanche',
    type: 'avalanche',
    description: 'Pay off highest interest rates first for maximum savings',
    totalMonths: avalanche.totalMonths,
    totalInterest: avalanche.totalInterest,
    totalPaid: avalanche.totalPaid,
    monthlyPayment: debts.reduce((sum, d) => sum + d.minimumPayment, 0) + extraPayment,
    savings: minimumOnly.totalInterest - avalanche.totalInterest,
    timeSaved: minimumOnly.totalMonths - avalanche.totalMonths,
    payoffOrder: avalancheDebts.map(d => ({ id: d.id, name: d.name }))
  });

  // 4. Highest Balance First
  const highestBalanceDebts = [...debts].sort((a, b) => b.balance - a.balance);
  const highestBalance = calculateStrategyResult(highestBalanceDebts, extraPayment, 'highest_balance');
  strategies.push({
    name: 'Highest Balance First',
    type: 'highest_balance',
    description: 'Tackle largest debts first to reduce overall burden',
    totalMonths: highestBalance.totalMonths,
    totalInterest: highestBalance.totalInterest,
    totalPaid: highestBalance.totalPaid,
    monthlyPayment: debts.reduce((sum, d) => sum + d.minimumPayment, 0) + extraPayment,
    savings: minimumOnly.totalInterest - highestBalance.totalInterest,
    timeSaved: minimumOnly.totalMonths - highestBalance.totalMonths,
    payoffOrder: highestBalanceDebts.map(d => ({ id: d.id, name: d.name }))
  });

  // Sort strategies by total interest (best to worst)
  const sortedStrategies = strategies.slice(1).sort((a, b) => a.totalInterest - b.totalInterest);

  // Add recommendation
  const bestStrategy = sortedStrategies[0];
  const recommendation = {
    strategy: bestStrategy.type,
    reason: `This strategy saves you $${bestStrategy.savings.toFixed(2)} in interest and ${bestStrategy.timeSaved} months compared to minimum payments.`
  };

  res.json({
    strategies: [strategies[0], ...sortedStrategies], // minimum-only first, then sorted by efficiency
    recommendation,
    summary: {
      totalDebts: debts.length,
      totalBalance: debts.reduce((sum, d) => sum + d.balance, 0),
      totalMinimumPayment: debts.reduce((sum, d) => sum + d.minimumPayment, 0),
      extraPayment,
      maxPossibleSavings: bestStrategy.savings
    }
  });
}));

// Helper functions
async function calculateStrategyMetrics(client, userId, debtOrder, extraPayment) {
  // Get debt details
  const debtIds = debtOrder.map(d => d.debtId);
  const debtsResult = await client.query(
    'SELECT * FROM debts WHERE id = ANY($1) AND user_id = $2',
    [debtIds, userId]
  );

  const debts = debtsResult.rows.map(debt => ({
    id: debt.id,
    balance: parseFloat(debt.current_balance),
    interestRate: parseFloat(debt.interest_rate),
    minimumPayment: parseFloat(debt.minimum_payment)
  }));

  // Order debts according to strategy
  const orderedDebts = debtOrder.map(orderItem => {
    const debt = debts.find(d => d.id === orderItem.debtId);
    return {
      ...debt,
      orderPosition: orderItem.orderPosition,
      allocatedExtra: orderItem.allocatedExtraPayment || 0
    };
  }).sort((a, b) => a.orderPosition - b.orderPosition);

  // Calculate payoff scenario
  const result = calculateStrategyResult(orderedDebts, extraPayment, 'custom');
  
  // Calculate baseline (minimum payments only) for comparison
  const baseline = calculateStrategyResult(orderedDebts, 0, 'minimum');
  
  return {
    totalInterest: result.totalInterest,
    payoffMonths: result.totalMonths,
    monthlySavings: (baseline.totalInterest - result.totalInterest) / result.totalMonths
  };
}

function calculateStrategyResult(debts, extraPayment, strategy) {
  const debtList = debts.map(debt => ({ ...debt }));
  let totalInterest = 0;
  let month = 0;
  const maxMonths = 600; // 50 years maximum

  while (debtList.some(debt => debt.balance > 0) && month < maxMonths) {
    month++;

    // Apply interest and minimum payments
    debtList.forEach(debt => {
      if (debt.balance > 0) {
        const monthlyRate = debt.interestRate / 12;
        const interestCharge = debt.balance * monthlyRate;
        const minPayment = Math.min(debt.minimumPayment, debt.balance + interestCharge);
        const principalPayment = minPayment - interestCharge;

        totalInterest += interestCharge;
        debt.balance = Math.max(0, debt.balance - principalPayment);
      }
    });

    // Apply extra payment to first debt with balance
    if (extraPayment > 0) {
      const targetDebt = debtList.find(debt => debt.balance > 0);
      if (targetDebt) {
        const extraApplied = Math.min(extraPayment, targetDebt.balance);
        targetDebt.balance -= extraApplied;
      }
    }
  }

  const totalOriginalBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalMinimumPayments = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);

  return {
    totalMonths: month,
    totalInterest: Number(totalInterest.toFixed(2)),
    totalPaid: Number((totalOriginalBalance + totalInterest).toFixed(2)),
    monthlyPayment: totalMinimumPayments + extraPayment
  };
}

function calculatePayoffSchedule(debts, extraPayment) {
  // Implementation for detailed month-by-month payoff schedule
  // This would be used for the detailed strategy view
  const schedule = [];
  const debtList = debts.map(debt => ({ 
    ...debt, 
    balance: parseFloat(debt.current_balance) 
  }));

  let month = 0;
  const maxMonths = Math.min(120, 600); // Limit to 10 years for schedule display

  while (debtList.some(debt => debt.balance > 0) && month < maxMonths) {
    month++;

    const monthData = {
      month,
      debts: [],
      totalPayment: 0,
      totalInterest: 0,
      totalPrincipal: 0
    };

    // Process each debt
    debtList.forEach(debt => {
      if (debt.balance > 0) {
        const monthlyRate = parseFloat(debt.interest_rate) / 12;
        const interestPayment = debt.balance * monthlyRate;
        const minimumPayment = parseFloat(debt.minimum_payment);
        const principalPayment = Math.min(minimumPayment - interestPayment, debt.balance);
        
        debt.balance = Math.max(0, debt.balance - principalPayment);
        
        monthData.debts.push({
          debtId: debt.debt_id,
          debtName: debt.debt_name,
          payment: minimumPayment,
          interestPayment: Number(interestPayment.toFixed(2)),
          principalPayment: Number(principalPayment.toFixed(2)),
          remainingBalance: Number(debt.balance.toFixed(2))
        });

        monthData.totalPayment += minimumPayment;
        monthData.totalInterest += interestPayment;
        monthData.totalPrincipal += principalPayment;
      }
    });

    // Apply extra payment
    if (extraPayment > 0) {
      const targetDebt = debtList.find(debt => debt.balance > 0);
      if (targetDebt) {
        const extraApplied = Math.min(extraPayment, targetDebt.balance);
        targetDebt.balance -= extraApplied;
        
        // Update the corresponding debt in monthData
        const debtData = monthData.debts.find(d => d.debtId === targetDebt.debt_id);
        if (debtData) {
          debtData.payment += extraApplied;
          debtData.principalPayment += extraApplied;
          debtData.remainingBalance = Number(targetDebt.balance.toFixed(2));
        }

        monthData.totalPayment += extraPayment;
        monthData.totalPrincipal += extraApplied;
      }
    }

    monthData.totalPayment = Number(monthData.totalPayment.toFixed(2));
    monthData.totalInterest = Number(monthData.totalInterest.toFixed(2));
    monthData.totalPrincipal = Number(monthData.totalPrincipal.toFixed(2));

    schedule.push(monthData);
  }

  return schedule;
}

export default router;