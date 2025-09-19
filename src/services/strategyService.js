import AppError from '../errors/AppError.js';
import { getNumber, getString } from '../utils/validators.js';
import { simulateStrategy } from '../algorithms/debtStrategies.js';

function createStrategyService(context) {
  const { db } = context;

  function getActiveDebts(userId) {
    const debts = db.data.debts.filter((debt) => debt.userId === userId && debt.balance > 0);
    if (debts.length === 0) {
      throw new AppError(400, 'No active debts found for simulation.');
    }
    return debts;
  }

  function simulate(userId, payload) {
    const strategy = getString(payload, 'strategy', { minLength: 3 }).toLowerCase();
    const monthlyBudget = getNumber(payload, 'monthlyBudget', { min: 0.01 });
    const startDate = payload.startDate ? new Date(payload.startDate) : new Date();
    const debts = getActiveDebts(userId);
    const result = simulateStrategy(debts, { strategy, monthlyBudget, startDate });
    return {
      strategy: result.strategy,
      monthlyBudget,
      totalInterest: result.totalInterest,
      months: result.months,
      payoffDate: result.payoffDate,
      debtSummaries: result.debtSummaries,
      schedule: result.schedule,
    };
  }

  function compare(userId, payload) {
    const monthlyBudget = getNumber(payload, 'monthlyBudget', { min: 0.01 });
    const startDate = payload.startDate ? new Date(payload.startDate) : new Date();
    const debts = getActiveDebts(userId);
    const snowball = simulateStrategy(debts, { strategy: 'snowball', monthlyBudget, startDate });
    const avalanche = simulateStrategy(debts, { strategy: 'avalanche', monthlyBudget, startDate });
    return {
      monthlyBudget,
      snowball,
      avalanche,
      interestSavings: Number((snowball.totalInterest - avalanche.totalInterest).toFixed(2)),
      monthsDifference: snowball.months - avalanche.months,
    };
  }

  return {
    simulate,
    compare,
  };
}

export default createStrategyService;
