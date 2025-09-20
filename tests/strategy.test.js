import { describe, it, expect } from 'vitest';
import { simulateStrategy, compareStrategies } from '../src/algorithms/debtStrategies.js';

const sampleDebts = [
  {
    id: 'debt-1',
    name: 'Credit Card',
    balance: 1500,
    apr: 18,
    minimumPayment: 50,
  },
  {
    id: 'debt-2',
    name: 'Student Loan',
    balance: 6000,
    apr: 4.5,
    minimumPayment: 120,
  },
  {
    id: 'debt-3',
    name: 'Auto Loan',
    balance: 3200,
    apr: 7.9,
    minimumPayment: 90,
  },
];

describe('simulateStrategy', () => {
  it('prioritises the smallest balances first with the snowball strategy', () => {
    const result = simulateStrategy(sampleDebts, {
      strategy: 'snowball',
      monthlyBudget: 700,
      startDate: new Date('2024-01-01'),
    });

    const creditCard = result.debtSummaries.find((item) => item.debtId === 'debt-1');
    const autoLoan = result.debtSummaries.find((item) => item.debtId === 'debt-3');
    const studentLoan = result.debtSummaries.find((item) => item.debtId === 'debt-2');

    expect(creditCard?.monthsToPayoff).toBeLessThanOrEqual(autoLoan?.monthsToPayoff ?? Infinity);
    expect(autoLoan?.monthsToPayoff).toBeLessThanOrEqual(studentLoan?.monthsToPayoff ?? Infinity);
    expect(result.strategy).toBe('snowball');
    expect(result.schedule[0]?.date).toMatch(/^2024-01/);
  });

  it('prioritises the highest APR balances with the avalanche strategy', () => {
    const snowball = simulateStrategy(sampleDebts, {
      strategy: 'snowball',
      monthlyBudget: 700,
      startDate: new Date('2024-01-01'),
    });

    const avalanche = simulateStrategy(sampleDebts, {
      strategy: 'avalanche',
      monthlyBudget: 700,
      startDate: new Date('2024-01-01'),
    });

    const creditCardAvalanche = avalanche.debtSummaries.find((item) => item.debtId === 'debt-1');
    const autoLoanAvalanche = avalanche.debtSummaries.find((item) => item.debtId === 'debt-3');
    const studentLoanAvalanche = avalanche.debtSummaries.find((item) => item.debtId === 'debt-2');

    expect(creditCardAvalanche?.monthsToPayoff).toBeLessThanOrEqual(autoLoanAvalanche?.monthsToPayoff ?? Infinity);
    expect(autoLoanAvalanche?.monthsToPayoff).toBeLessThanOrEqual(studentLoanAvalanche?.monthsToPayoff ?? Infinity);
    expect(avalanche.totalInterest).toBeLessThanOrEqual(snowball.totalInterest);
  });

  it('throws when monthly budget cannot cover minimums', () => {
    expect(() =>
      simulateStrategy(sampleDebts, {
        strategy: 'snowball',
        monthlyBudget: 100,
        startDate: new Date('2024-01-01'),
      }),
    ).toThrowError(/月預算.*不足/);
  });

  it('throws when using an unsupported strategy', () => {
    expect(() =>
      simulateStrategy(sampleDebts, {
        strategy: 'unknown',
        monthlyBudget: 700,
      }),
    ).toThrowError(/策略必須是 snowball/);
  });
});

describe('compareStrategies', () => {
  it('returns comparison insights for both strategies', () => {
    const result = compareStrategies(sampleDebts, 700, new Date('2024-01-01'));

    expect(result.snowball.strategy).toBe('snowball');
    expect(result.avalanche.strategy).toBe('avalanche');
    expect(result.comparison).toMatchObject({
      interestSavings: expect.any(Number),
      timeSavings: expect.any(Number),
      recommendedStrategy: expect.any(String),
    });
    expect(result.comparison.recommendedStrategy === 'snowball' || result.comparison.recommendedStrategy === 'avalanche').toBe(true);
  });
});
