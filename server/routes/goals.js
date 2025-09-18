import express from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../db/connection.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation schemas
const goalSchema = Joi.object({
  goalType: Joi.string().valid('debt_free', 'emergency_fund', 'savings_target', 'investment').required(),
  goalName: Joi.string().min(1).max(200).required(),
  targetAmount: Joi.number().positive().precision(2).optional().allow(null),
  targetDate: Joi.date().iso().optional().allow(null),
  currentAmount: Joi.number().min(0).precision(2).default(0),
  priority: Joi.number().integer().min(1).max(10).default(1),
  notes: Joi.string().max(1000).optional().allow('')
});

const updateGoalSchema = goalSchema.fork(['goalType', 'goalName'], (schema) => schema.optional());

const progressUpdateSchema = Joi.object({
  currentAmount: Joi.number().min(0).precision(2).required(),
  notes: Joi.string().max(500).optional().allow('')
});

// GET /api/goals - Get all financial goals
router.get('/', asyncHandler(async (req, res) => {
  const { status = 'all', type, sortBy = 'created_at', order = 'desc' } = req.query;
  
  let whereClause = 'WHERE user_id = $1';
  const params = [req.user.id];
  let paramIndex = 2;

  if (status === 'active') {
    whereClause += ' AND is_achieved = false';
  } else if (status === 'completed') {
    whereClause += ' AND is_achieved = true';
  }

  if (type) {
    whereClause += ` AND goal_type = $${paramIndex}`;
    params.push(type);
    paramIndex++;
  }

  const validSortFields = ['goal_name', 'target_amount', 'target_date', 'priority', 'created_at'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  const result = await query(
    `SELECT * FROM financial_goals 
     ${whereClause}
     ORDER BY is_achieved ASC, priority ASC, ${sortField} ${sortOrder}`,
    params
  );

  const goals = result.rows.map(goal => ({
    ...goal,
    targetAmount: parseFloat(goal.target_amount) || 0,
    currentAmount: parseFloat(goal.current_amount) || 0,
    progress: goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0,
    remainingAmount: Math.max(0, (parseFloat(goal.target_amount) || 0) - (parseFloat(goal.current_amount) || 0)),
    daysRemaining: goal.target_date ? Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
  }));

  // Calculate summary statistics
  const summary = {
    totalGoals: goals.length,
    activeGoals: goals.filter(g => !g.is_achieved).length,
    completedGoals: goals.filter(g => g.is_achieved).length,
    totalTargetAmount: goals.reduce((sum, g) => sum + g.targetAmount, 0),
    totalCurrentAmount: goals.reduce((sum, g) => sum + g.currentAmount, 0),
    overallProgress: goals.length > 0 ? 
      goals.reduce((sum, g) => sum + g.progress, 0) / goals.length : 0,
    goalsByType: goals.reduce((acc, goal) => {
      acc[goal.goal_type] = (acc[goal.goal_type] || 0) + 1;
      return acc;
    }, {})
  };

  res.json({
    goals,
    summary,
    count: goals.length
  });
}));

// GET /api/goals/:id - Get single goal
router.get('/:id', asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM financial_goals WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Goal');
  }

  const goal = result.rows[0];
  
  // Calculate additional metrics
  const targetAmount = parseFloat(goal.target_amount) || 0;
  const currentAmount = parseFloat(goal.current_amount) || 0;
  const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const remainingAmount = Math.max(0, targetAmount - currentAmount);
  
  let projectedCompletion = null;
  if (goal.target_date && remainingAmount > 0) {
    const daysRemaining = Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24));
    const dailyRequired = remainingAmount / Math.max(1, daysRemaining);
    projectedCompletion = {
      daysRemaining,
      dailyAmountRequired: dailyRequired,
      weeklyAmountRequired: dailyRequired * 7,
      monthlyAmountRequired: dailyRequired * 30.44
    };
  }

  res.json({
    ...goal,
    targetAmount,
    currentAmount,
    progress: Number(progress.toFixed(2)),
    remainingAmount,
    projectedCompletion
  });
}));

// POST /api/goals - Create new goal
router.post('/', asyncHandler(async (req, res) => {
  const { error, value } = goalSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid goal data', error.details);
  }

  const {
    goalType, goalName, targetAmount, targetDate, 
    currentAmount, priority, notes
  } = value;

  const result = await query(
    `INSERT INTO financial_goals (
      user_id, goal_type, goal_name, target_amount, target_date,
      current_amount, priority, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      req.user.id, goalType, goalName, targetAmount, targetDate,
      currentAmount, priority, notes
    ]
  );

  const goal = result.rows[0];

  res.status(201).json({
    message: 'Goal created successfully',
    goal: {
      ...goal,
      targetAmount: parseFloat(goal.target_amount) || 0,
      currentAmount: parseFloat(goal.current_amount) || 0,
      progress: goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
    }
  });
}));

// PUT /api/goals/:id - Update goal
router.put('/:id', asyncHandler(async (req, res) => {
  const { error, value } = updateGoalSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid goal data', error.details);
  }

  // Check if goal exists and belongs to user
  const existingGoal = await query(
    'SELECT * FROM financial_goals WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );

  if (existingGoal.rows.length === 0) {
    throw new NotFoundError('Goal');
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

  updates.push('updated_at = CURRENT_TIMESTAMP');

  const result = await query(
    `UPDATE financial_goals 
     SET ${updates.join(', ')}
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    params
  );

  const goal = result.rows[0];

  res.json({
    message: 'Goal updated successfully',
    goal: {
      ...goal,
      targetAmount: parseFloat(goal.target_amount) || 0,
      currentAmount: parseFloat(goal.current_amount) || 0,
      progress: goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
    }
  });
}));

// PUT /api/goals/:id/progress - Update goal progress
router.put('/:id/progress', asyncHandler(async (req, res) => {
  const { error, value } = progressUpdateSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid progress data', error.details);
  }

  const { currentAmount, notes } = value;

  const result = await withTransaction(async (client) => {
    // Get current goal
    const goalResult = await client.query(
      'SELECT * FROM financial_goals WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (goalResult.rows.length === 0) {
      throw new NotFoundError('Goal');
    }

    const goal = goalResult.rows[0];
    const targetAmount = parseFloat(goal.target_amount) || 0;
    const newProgress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    const wasAchieved = goal.is_achieved;
    const isNowAchieved = newProgress >= 100 && targetAmount > 0;

    // Update goal progress
    const updateResult = await client.query(
      `UPDATE financial_goals 
       SET current_amount = $1, 
           is_achieved = $2,
           achieved_date = $3,
           updated_at = CURRENT_TIMESTAMP,
           notes = COALESCE($4, notes)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [
        currentAmount, 
        isNowAchieved, 
        isNowAchieved && !wasAchieved ? new Date() : goal.achieved_date,
        notes,
        req.params.id, 
        req.user.id
      ]
    );

    // Create notification if goal was just achieved
    if (isNowAchieved && !wasAchieved) {
      await client.query(
        `INSERT INTO notifications (
          user_id, notification_type, title, message, related_goal_id
        ) VALUES ($1, 'goal_achieved', $2, $3, $4)`,
        [
          req.user.id,
          'Goal Achieved! 🎉',
          `Congratulations! You've achieved your goal "${goal.goal_name}". Great work on reaching your target!`,
          req.params.id
        ]
      );
    }

    return updateResult.rows[0];
  });

  res.json({
    message: 'Goal progress updated successfully',
    goal: {
      ...result,
      targetAmount: parseFloat(result.target_amount) || 0,
      currentAmount: parseFloat(result.current_amount) || 0,
      progress: result.target_amount > 0 ? (result.current_amount / result.target_amount) * 100 : 0
    },
    achieved: result.is_achieved && !existingGoal.rows[0].is_achieved
  });
}));

// DELETE /api/goals/:id - Delete goal
router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await query(
    'DELETE FROM financial_goals WHERE id = $1 AND user_id = $2 RETURNING goal_name',
    [req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Goal');
  }

  res.json({
    message: `Goal "${result.rows[0].goal_name}" deleted successfully`
  });
}));

// PUT /api/goals/:id/complete - Mark goal as complete
router.put('/:id/complete', asyncHandler(async (req, res) => {
  const { finalAmount, notes } = req.body;

  const result = await withTransaction(async (client) => {
    // Get current goal
    const goalResult = await client.query(
      'SELECT * FROM financial_goals WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (goalResult.rows.length === 0) {
      throw new NotFoundError('Goal');
    }

    const goal = goalResult.rows[0];
    
    // Mark as completed
    const updateResult = await client.query(
      `UPDATE financial_goals 
       SET is_achieved = true,
           achieved_date = CURRENT_TIMESTAMP,
           current_amount = COALESCE($1, target_amount, current_amount),
           notes = COALESCE($2, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [finalAmount, notes, req.params.id, req.user.id]
    );

    // Create achievement notification
    await client.query(
      `INSERT INTO notifications (
        user_id, notification_type, title, message, related_goal_id
      ) VALUES ($1, 'goal_achieved', $2, $3, $4)`,
      [
        req.user.id,
        'Goal Completed! 🏆',
        `Fantastic! You've successfully completed your goal "${goal.goal_name}". This is a major milestone in your financial journey!`,
        req.params.id
      ]
    );

    return updateResult.rows[0];
  });

  res.json({
    message: 'Goal marked as complete successfully',
    goal: {
      ...result,
      targetAmount: parseFloat(result.target_amount) || 0,
      currentAmount: parseFloat(result.current_amount) || 0,
      progress: 100
    }
  });
}));

// GET /api/goals/insights/recommendations - Get goal recommendations
router.get('/insights/recommendations', asyncHandler(async (req, res) => {
  // Get user's financial data
  const [debtsResult, goalsResult, paymentsResult] = await Promise.all([
    query(
      'SELECT SUM(current_balance) as total_debt, AVG(interest_rate) as avg_rate FROM debts WHERE user_id = $1 AND is_active = true',
      [req.user.id]
    ),
    query(
      'SELECT goal_type, COUNT(*) as count, SUM(target_amount - current_amount) as remaining FROM financial_goals WHERE user_id = $1 AND is_achieved = false GROUP BY goal_type',
      [req.user.id]
    ),
    query(
      'SELECT AVG(amount) as avg_payment FROM payment_history ph JOIN debts d ON ph.debt_id = d.id WHERE d.user_id = $1 AND ph.payment_date >= CURRENT_DATE - INTERVAL \'3 months\'',
      [req.user.id]
    )
  ]);

  const totalDebt = parseFloat(debtsResult.rows[0]?.total_debt) || 0;
  const avgInterestRate = parseFloat(debtsResult.rows[0]?.avg_rate) || 0;
  const avgPayment = parseFloat(paymentsResult.rows[0]?.avg_payment) || 0;
  const currentGoals = goalsResult.rows.reduce((acc, row) => {
    acc[row.goal_type] = {
      count: parseInt(row.count),
      remaining: parseFloat(row.remaining)
    };
    return acc;
  }, {});

  const recommendations = [];

  // Debt-free goal recommendation
  if (totalDebt > 0 && !currentGoals.debt_free) {
    recommendations.push({
      type: 'debt_free',
      title: 'Become Debt-Free',
      description: 'Set a goal to pay off all your debts and achieve financial freedom.',
      suggestedTargetAmount: totalDebt,
      priority: 'high',
      reason: `You have $${totalDebt.toFixed(2)} in total debt. Creating a debt-free goal will help you stay motivated and track your progress.`,
      estimatedTimeframe: avgPayment > 0 ? Math.ceil(totalDebt / avgPayment) + ' months' : null
    });
  }

  // Emergency fund recommendation
  if (!currentGoals.emergency_fund || currentGoals.emergency_fund.remaining > 0) {
    const suggestedAmount = avgPayment > 0 ? avgPayment * 6 : 10000; // 6 months of expenses or $10k default
    recommendations.push({
      type: 'emergency_fund',
      title: 'Build Emergency Fund',
      description: 'Create a safety net for unexpected expenses.',
      suggestedTargetAmount: suggestedAmount,
      priority: totalDebt > suggestedAmount ? 'medium' : 'high',
      reason: 'An emergency fund of 3-6 months of expenses protects you from financial setbacks.',
      estimatedTimeframe: avgPayment > 0 ? Math.ceil(suggestedAmount / (avgPayment * 0.2)) + ' months' : null
    });
  }

  // Investment goal recommendation
  if (totalDebt < 5000 && !currentGoals.investment) {
    recommendations.push({
      type: 'investment',
      title: 'Start Investing',
      description: 'Begin building wealth through investments.',
      suggestedTargetAmount: 25000,
      priority: 'medium',
      reason: 'With manageable debt levels, it\'s time to start building long-term wealth through investing.',
      estimatedTimeframe: avgPayment > 0 ? Math.ceil(25000 / (avgPayment * 0.15)) + ' months' : null
    });
  }

  // Savings target recommendation
  if (!currentGoals.savings_target) {
    recommendations.push({
      type: 'savings_target',
      title: 'General Savings Goal',
      description: 'Set aside money for future opportunities and purchases.',
      suggestedTargetAmount: 5000,
      priority: 'low',
      reason: 'Having dedicated savings helps you avoid taking on new debt for planned expenses.',
      estimatedTimeframe: avgPayment > 0 ? Math.ceil(5000 / (avgPayment * 0.1)) + ' months' : null
    });
  }

  // Sort by priority
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  res.json({
    recommendations,
    userFinancialProfile: {
      totalDebt,
      avgInterestRate: Number((avgInterestRate * 100).toFixed(2)),
      avgMonthlyPayment: avgPayment,
      currentGoalTypes: Object.keys(currentGoals),
      debtToIncomeRatio: null // Would need income data
    }
  });
}));

export default router;