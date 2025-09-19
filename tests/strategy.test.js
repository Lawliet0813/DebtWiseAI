import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateStrategy } from '../src/algorithms/debtStrategies.js';

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

test('snowball strategy prioritises the smallest balances first', () => {
  const result = simulateStrategy(sampleDebts, { strategy: 'snowball', monthlyBudget: 700, startDate: new Date('2024-01-01') });
  const creditCard = result.debtSummaries.find((item) => item.debtId === 'debt-1');
  const autoLoan = result.debtSummaries.find((item) => item.debtId === 'debt-3');
  const studentLoan = result.debtSummaries.find((item) => item.debtId === 'debt-2');
  assert.ok(
    creditCard.monthsToPayoff <= autoLoan.monthsToPayoff,
    'Credit card (smallest balance) should not take longer than auto loan'
  );
  assert.ok(
    autoLoan.monthsToPayoff <= studentLoan.monthsToPayoff,
    'Auto loan should be paid off before or alongside the larger student loan'
  );
  assert.equal(result.strategy, 'snowball');
  assert.equal(result.schedule[0].date.startsWith('2024-01'), true);
});

test('avalanche strategy prioritises the highest APR balances', () => {
  const snowball = simulateStrategy(sampleDebts, { strategy: 'snowball', monthlyBudget: 700, startDate: new Date('2024-01-01') });
  const avalanche = simulateStrategy(sampleDebts, { strategy: 'avalanche', monthlyBudget: 700, startDate: new Date('2024-01-01') });

  const creditCardAvalanche = avalanche.debtSummaries.find((item) => item.debtId === 'debt-1');
  const autoLoanAvalanche = avalanche.debtSummaries.find((item) => item.debtId === 'debt-3');
  const studentLoanAvalanche = avalanche.debtSummaries.find((item) => item.debtId === 'debt-2');

  assert.ok(
    creditCardAvalanche.monthsToPayoff <= autoLoanAvalanche.monthsToPayoff,
    'Highest APR debt should not take longer than lower APR debts'
  );
  assert.ok(
    autoLoanAvalanche.monthsToPayoff <= studentLoanAvalanche.monthsToPayoff,
    'Next highest APR should be resolved before or alongside lower APR debts'
  );
  assert.ok(
    avalanche.totalInterest <= snowball.totalInterest,
    'Avalanche should not accrue more interest than snowball for the same inputs'
  );
});

test('simulation throws when monthly budget cannot cover minimums', () => {
  assert.throws(
    () => simulateStrategy(sampleDebts, { strategy: 'snowball', monthlyBudget: 100, startDate: new Date('2024-01-01') }),
    {
      name: 'DebtError',
      message: /月預算.*不足/
    }
  );
});
