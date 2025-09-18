import express from 'express';
import Joi from 'joi';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation schemas
const loanCalculatorSchema = Joi.object({
  principal: Joi.number().positive().required(),
  interestRate: Joi.number().min(0).max(1).required(),
  termMonths: Joi.number().integer().positive().required()
});

const payoffCalculatorSchema = Joi.object({
  currentBalance: Joi.number().positive().required(),
  interestRate: Joi.number().min(0).max(1).required(),
  monthlyPayment: Joi.number().positive().required(),
  extraPayment: Joi.number().min(0).default(0)
});

const debtComparisonSchema = Joi.object({
  debts: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      balance: Joi.number().positive().required(),
      interestRate: Joi.number().min(0).max(1).required(),
      minimumPayment: Joi.number().positive().required()
    })
  ).min(1).required(),
  extraPayment: Joi.number().min(0).default(0),
  strategy: Joi.string().valid('snowball', 'avalanche').default('avalanche')
});

const emergencyFundSchema = Joi.object({
  monthlyExpenses: Joi.number().positive().required(),
  targetMonths: Joi.number().min(1).max(12).default(6),
  currentSavings: Joi.number().min(0).default(0),
  monthlySavings: Joi.number().positive().required()
});

const investmentCalculatorSchema = Joi.object({
  initialAmount: Joi.number().min(0).required(),
  monthlyContribution: Joi.number().min(0).required(),
  annualReturn: Joi.number().min(-1).max(2).required(),
  years: Joi.number().min(1).max(50).required(),
  compoundFrequency: Joi.number().valid(1, 4, 12).default(12) // Annual, Quarterly, Monthly
});

// POST /api/calculators/loan - Loan Payment Calculator
router.post('/loan', asyncHandler(async (req, res) => {
  const { error, value } = loanCalculatorSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid loan calculation data', error.details);
  }

  const { principal, interestRate, termMonths } = value;
  
  const monthlyRate = interestRate / 12;
  const monthlyPayment = monthlyRate === 0 
    ? principal / termMonths
    : (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
      (Math.pow(1 + monthlyRate, termMonths) - 1);

  const totalInterest = (monthlyPayment * termMonths) - principal;
  const totalAmount = principal + totalInterest;

  // Generate amortization schedule
  const schedule = [];
  let remainingBalance = principal;
  
  for (let month = 1; month <= termMonths; month++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance = Math.max(0, remainingBalance - principalPayment);
    
    schedule.push({
      month,
      monthlyPayment: Number(monthlyPayment.toFixed(2)),
      principalPayment: Number(principalPayment.toFixed(2)),
      interestPayment: Number(interestPayment.toFixed(2)),
      remainingBalance: Number(remainingBalance.toFixed(2))
    });
  }

  res.json({
    monthlyPayment: Number(monthlyPayment.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    schedule: schedule.slice(0, 12), // Return first 12 months, full schedule available on request
    summary: {
      principal: Number(principal.toFixed(2)),
      interestRate: Number((interestRate * 100).toFixed(2)),
      termMonths,
      totalPayments: termMonths
    }
  });
}));

// POST /api/calculators/payoff - Debt Payoff Calculator
router.post('/payoff', asyncHandler(async (req, res) => {
  const { error, value } = payoffCalculatorSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid payoff calculation data', error.details);
  }

  const { currentBalance, interestRate, monthlyPayment, extraPayment } = value;
  
  const totalPayment = monthlyPayment + extraPayment;
  const monthlyRate = interestRate / 12;

  // Calculate without extra payment
  const standardMonths = calculatePayoffTime(currentBalance, interestRate, monthlyPayment);
  const standardInterest = (standardMonths * monthlyPayment) - currentBalance;

  // Calculate with extra payment
  const acceleratedMonths = calculatePayoffTime(currentBalance, interestRate, totalPayment);
  const acceleratedInterest = (acceleratedMonths * totalPayment) - currentBalance;

  // Savings from extra payment
  const timeSaved = standardMonths - acceleratedMonths;
  const interestSaved = standardInterest - acceleratedInterest;

  res.json({
    standard: {
      months: standardMonths,
      years: Number((standardMonths / 12).toFixed(1)),
      totalInterest: Number(standardInterest.toFixed(2)),
      totalPaid: Number((standardMonths * monthlyPayment).toFixed(2))
    },
    accelerated: {
      months: acceleratedMonths,
      years: Number((acceleratedMonths / 12).toFixed(1)),
      totalInterest: Number(acceleratedInterest.toFixed(2)),
      totalPaid: Number((acceleratedMonths * totalPayment).toFixed(2))
    },
    savings: {
      timeSavedMonths: Number(timeSaved.toFixed(1)),
      timeSavedYears: Number((timeSaved / 12).toFixed(1)),
      interestSaved: Number(interestSaved.toFixed(2)),
      extraPaymentTotal: Number((extraPayment * acceleratedMonths).toFixed(2))
    }
  });
}));

// POST /api/calculators/debt-comparison - Debt Strategy Comparison
router.post('/debt-comparison', asyncHandler(async (req, res) => {
  const { error, value } = debtComparisonSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid debt comparison data', error.details);
  }

  const { debts, extraPayment, strategy } = value;

  // Calculate current minimum payments total
  const totalMinimumPayment = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  const totalBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);

  // Snowball strategy (lowest balance first)
  const snowballOrder = [...debts].sort((a, b) => a.balance - b.balance);
  const snowballResult = calculateDebtStrategy(snowballOrder, extraPayment);

  // Avalanche strategy (highest interest rate first)  
  const avalanacheOrder = [...debts].sort((a, b) => b.interestRate - a.interestRate);
  const avalancheResult = calculateDebtStrategy(avalanacheOrder, extraPayment);

  // Current order (minimum payments only)
  const minimumOnlyResult = calculateDebtStrategy(debts, 0);

  const comparison = {
    totalBalance: Number(totalBalance.toFixed(2)),
    totalMinimumPayment: Number(totalMinimumPayment.toFixed(2)),
    extraPayment: Number(extraPayment.toFixed(2)),
    strategies: {
      minimumOnly: {
        name: 'Minimum Payments Only',
        totalMonths: minimumOnlyResult.totalMonths,
        totalInterest: Number(minimumOnlyResult.totalInterest.toFixed(2)),
        totalPaid: Number((totalBalance + minimumOnlyResult.totalInterest).toFixed(2))
      },
      snowball: {
        name: 'Debt Snowball',
        description: 'Pay off smallest balances first',
        totalMonths: snowballResult.totalMonths,
        totalInterest: Number(snowballResult.totalInterest.toFixed(2)),
        totalPaid: Number((totalBalance + snowballResult.totalInterest).toFixed(2)),
        payoffOrder: snowballResult.payoffOrder,
        monthlySavings: Number(((minimumOnlyResult.totalInterest - snowballResult.totalInterest) / snowballResult.totalMonths).toFixed(2))
      },
      avalanche: {
        name: 'Debt Avalanche',
        description: 'Pay off highest interest rates first',
        totalMonths: avalancheResult.totalMonths,
        totalInterest: Number(avalancheResult.totalInterest.toFixed(2)),
        totalPaid: Number((totalBalance + avalancheResult.totalInterest).toFixed(2)),
        payoffOrder: avalancheResult.payoffOrder,
        monthlySavings: Number(((minimumOnlyResult.totalInterest - avalancheResult.totalInterest) / avalancheResult.totalMonths).toFixed(2))
      }
    },
    recommendation: avalancheResult.totalInterest < snowballResult.totalInterest ? 'avalanche' : 'snowball',
    potentialSavings: {
      bestStrategy: avalancheResult.totalInterest < snowballResult.totalInterest ? 'avalanche' : 'snowball',
      interestSaved: Number(Math.abs(avalancheResult.totalInterest - snowballResult.totalInterest).toFixed(2)),
      timeSaved: Math.abs(avalancheResult.totalMonths - snowballResult.totalMonths)
    }
  };

  res.json(comparison);
}));

// POST /api/calculators/emergency-fund - Emergency Fund Calculator
router.post('/emergency-fund', asyncHandler(async (req, res) => {
  const { error, value } = emergencyFundSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid emergency fund data', error.details);
  }

  const { monthlyExpenses, targetMonths, currentSavings, monthlySavings } = value;

  const targetAmount = monthlyExpenses * targetMonths;
  const amountNeeded = Math.max(0, targetAmount - currentSavings);
  const monthsToGoal = amountNeeded > 0 ? Math.ceil(amountNeeded / monthlySavings) : 0;

  const projectedGrowth = [];
  let currentAmount = currentSavings;
  
  for (let month = 0; month <= Math.min(monthsToGoal + 3, 24); month++) {
    projectedGrowth.push({
      month,
      amount: Number(currentAmount.toFixed(2)),
      percentage: Number(((currentAmount / targetAmount) * 100).toFixed(1))
    });
    currentAmount += monthlySavings;
  }

  res.json({
    currentSavings: Number(currentSavings.toFixed(2)),
    targetAmount: Number(targetAmount.toFixed(2)),
    amountNeeded: Number(amountNeeded.toFixed(2)),
    monthsToGoal,
    completionDate: monthsToGoal > 0 ? new Date(Date.now() + monthsToGoal * 30.44 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
    progress: Number(((currentSavings / targetAmount) * 100).toFixed(1)),
    projectedGrowth,
    recommendations: {
      monthlyExpenses: Number(monthlyExpenses.toFixed(2)),
      targetMonths,
      suggestedMonthlySavings: Number((amountNeeded / Math.max(monthsToGoal, 1)).toFixed(2))
    }
  });
}));

// POST /api/calculators/investment - Investment Growth Calculator
router.post('/investment', asyncHandler(async (req, res) => {
  const { error, value } = investmentCalculatorSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid investment data', error.details);
  }

  const { initialAmount, monthlyContribution, annualReturn, years, compoundFrequency } = value;

  const periodsPerYear = compoundFrequency;
  const totalPeriods = years * periodsPerYear;
  const periodRate = annualReturn / periodsPerYear;
  const monthlyPeriods = 12 / periodsPerYear;

  // Calculate compound interest with regular contributions
  let finalAmount = initialAmount;
  let totalContributions = initialAmount;
  
  const yearlyBreakdown = [];
  let currentAmount = initialAmount;
  
  for (let year = 1; year <= years; year++) {
    // Add monthly contributions throughout the year
    const yearlyContribution = monthlyContribution * 12;
    totalContributions += yearlyContribution;
    
    // Apply compound growth
    for (let period = 0; period < periodsPerYear; period++) {
      currentAmount = currentAmount * (1 + periodRate) + (monthlyContribution * monthlyPeriods);
    }
    
    const interestEarned = currentAmount - totalContributions;
    
    yearlyBreakdown.push({
      year,
      totalContributions: Number(totalContributions.toFixed(2)),
      totalValue: Number(currentAmount.toFixed(2)),
      interestEarned: Number(interestEarned.toFixed(2)),
      yearlyGrowth: year === 1 ? 0 : Number((currentAmount - yearlyBreakdown[year-2].totalValue).toFixed(2))
    });
  }

  finalAmount = currentAmount;
  const totalInterest = finalAmount - totalContributions;

  res.json({
    initialAmount: Number(initialAmount.toFixed(2)),
    monthlyContribution: Number(monthlyContribution.toFixed(2)),
    totalContributions: Number(totalContributions.toFixed(2)),
    finalAmount: Number(finalAmount.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    effectiveAnnualReturn: Number(((finalAmount / totalContributions - 1) * 100 / years).toFixed(2)),
    yearlyBreakdown,
    summary: {
      years,
      annualReturn: Number((annualReturn * 100).toFixed(2)),
      compoundFrequency,
      totalReturn: Number((((finalAmount - totalContributions) / totalContributions) * 100).toFixed(2))
    }
  });
}));

// Helper functions
function calculatePayoffTime(balance, interestRate, monthlyPayment) {
  if (balance <= 0 || monthlyPayment <= 0) return 0;
  
  const monthlyRate = interestRate / 12;
  if (monthlyRate === 0) {
    return Math.ceil(balance / monthlyPayment);
  }
  
  if (monthlyPayment <= balance * monthlyRate) {
    return Infinity; // Payment too low to ever pay off debt
  }
  
  const months = -Math.log(1 - (balance * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate);
  return Math.ceil(months);
}

function calculateDebtStrategy(debts, extraPayment) {
  const debtList = debts.map(debt => ({ ...debt }));
  const payoffOrder = [];
  let totalInterest = 0;
  let month = 0;
  let availableExtra = extraPayment;

  while (debtList.some(debt => debt.balance > 0) && month < 600) { // 50 year max
    month++;
    
    // Make minimum payments on all debts
    debtList.forEach(debt => {
      if (debt.balance > 0) {
        const monthlyRate = debt.interestRate / 12;
        const interestCharge = debt.balance * monthlyRate;
        const principalPayment = Math.min(debt.minimumPayment - interestCharge, debt.balance);
        
        totalInterest += interestCharge;
        debt.balance -= principalPayment;
        debt.balance = Math.max(0, debt.balance);
      }
    });

    // Apply extra payment to first debt with balance
    if (availableExtra > 0) {
      const targetDebt = debtList.find(debt => debt.balance > 0);
      if (targetDebt) {
        const extraApplied = Math.min(availableExtra, targetDebt.balance);
        targetDebt.balance -= extraApplied;
        
        if (targetDebt.balance === 0) {
          payoffOrder.push({
            name: targetDebt.name,
            month: month,
            originalBalance: debts.find(d => d.name === targetDebt.name).balance
          });
        }
      }
    }
  }

  return {
    totalMonths: month,
    totalInterest,
    payoffOrder
  };
}

export default router;