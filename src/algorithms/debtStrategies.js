// 債務策略演算法 - 前端版本
import { addMonths, formatISO } from 'date-fns';

// 自定義錯誤類別
class DebtError extends Error {
  constructor(message, code = 400) {
    super(message);
    this.name = 'DebtError';
    this.code = code;
  }
}

// 數值安全處理
const clampToZero = (value) => Math.max(0, Number(value) || 0);

// 格式化日期為 ISO 字串
const formatISODate = (date) => formatISO(date, { representation: 'date' });

// 標準化債務資料
function normalizeDebts(debts) {
  if (!Array.isArray(debts) || debts.length === 0) {
    throw new DebtError('至少需要一筆債務才能進行模擬');
  }

  return debts.map((debt) => {
    const balance = Number(debt.principal || debt.balance);
    const apr = Number(debt.interestRate || debt.apr);
    const minimumPayment = Number(debt.minimumPayment);

    if (isNaN(balance) || balance <= 0) {
      throw new DebtError(`債務「${debt.name || debt.id}」必須有正數餘額`);
    }
    if (isNaN(apr) || apr < 0) {
      throw new DebtError(`債務「${debt.name || debt.id}」必須有有效的年利率`);
    }
    if (isNaN(minimumPayment) || minimumPayment <= 0) {
      throw new DebtError(`債務「${debt.name || debt.id}」必須有正數最低還款額`);
    }

    return {
      id: debt.id,
      name: debt.name,
      balance: Number(balance.toFixed(2)),
      apr,
      minimumPayment,
      type: debt.type,
      dueDate: debt.dueDate,
    };
  });
}

// 債務排序策略
function orderDebts(debts, strategy) {
  const cloned = debts.map((debt) => ({ ...debt }));
  
  if (strategy === 'snowball') {
    // 雪球法：按餘額由小到大排序
    cloned.sort((a, b) => a.balance - b.balance || a.apr - b.apr);
  } else if (strategy === 'avalanche') {
    // 雪崩法：按利率由高到低排序
    cloned.sort((a, b) => b.apr - a.apr || a.balance - b.balance);
  }
  
  return cloned;
}

// 主要策略模擬函數
function simulateStrategy(debtsInput, options = {}) {
  const debts = normalizeDebts(debtsInput);
  const { 
    strategy = 'snowball', 
    monthlyBudget, 
    startDate = new Date(),
    maxMonths = 600 
  } = options;

  // 驗證策略類型
  if (!['snowball', 'avalanche'].includes(strategy)) {
    throw new DebtError('策略必須是 snowball（雪球法）或 avalanche（雪崩法）');
  }

  // 驗證預算
  const budget = Number(monthlyBudget);
  if (!budget || budget <= 0) {
    throw new DebtError('月預算必須是正數');
  }

  // 初始化變數
  const activeDebts = debts.map((debt) => ({ ...debt }));
  const debtSummaries = new Map();
  let monthIndex = 0;
  const schedule = [];
  let totalInterest = 0;
  let totalPaid = 0;
  const start = new Date(startDate);

  // 檢查預算是否足夠
  const minimumRequired = activeDebts.reduce(
    (sum, debt) => sum + Math.min(debt.minimumPayment, debt.balance), 
    0
  );
  
  if (budget < minimumRequired) {
    throw new DebtError(
      `月預算 $${budget.toFixed(2)} 不足，最低需要 $${minimumRequired.toFixed(2)}`
    );
  }

  // 初始化債務摘要
  activeDebts.forEach((debt) => {
    debtSummaries.set(debt.id, {
      debtId: debt.id,
      debtName: debt.name,
      totalInterest: 0,
      totalPaid: 0,
      monthsToPayoff: null,
      payoffDate: null,
      startingBalance: debt.balance,
    });
  });

  // 主要模擬循環
  while (activeDebts.some((debt) => debt.balance > 0.01)) {
    if (monthIndex >= maxMonths) {
      throw new DebtError(`模擬超過最大支援期間（${Math.floor(maxMonths/12)} 年）`);
    }

    monthIndex += 1;
    const currentDate = addMonths(start, monthIndex - 1);
    const ordered = orderDebts(activeDebts, strategy);
    const interestMap = new Map();

    // 計算本月利息
    let monthInterest = 0;
    activeDebts.forEach((debt) => {
      const monthlyRate = debt.apr / 100 / 12;
      const interest = clampToZero(debt.balance * monthlyRate);
      debt.balance = clampToZero(debt.balance + interest);
      monthInterest += interest;
      interestMap.set(debt.id, interest);

      const summary = debtSummaries.get(debt.id);
      summary.totalInterest += interest;
    });

    // 分配還款
    let remainingBudget = budget;
    const payments = [];

    // 第一步：支付最低還款額
    for (const debt of activeDebts) {
      const minimumPayment = Math.min(debt.minimumPayment, debt.balance);
      const payment = Math.min(minimumPayment, remainingBudget);
      
      debt.balance = clampToZero(debt.balance - payment);
      remainingBudget = clampToZero(remainingBudget - payment);
      
      const summary = debtSummaries.get(debt.id);
      summary.totalPaid += payment;
      
      payments.push({
        debtId: debt.id,
        debtName: debt.name,
        payment: clampToZero(payment),
        interestAccrued: clampToZero(interestMap.get(debt.id) || 0),
        balanceRemaining: debt.balance,
      });
    }

    // 第二步：按策略分配額外還款
    for (const debt of ordered) {
      if (remainingBudget <= 0 || debt.balance <= 0) {
        continue;
      }

      const extraPayment = Math.min(debt.balance, remainingBudget);
      debt.balance = clampToZero(debt.balance - extraPayment);
      remainingBudget = clampToZero(remainingBudget - extraPayment);
      
      const summary = debtSummaries.get(debt.id);
      summary.totalPaid += extraPayment;
      
      const paymentRecord = payments.find((record) => record.debtId === debt.id);
      if (paymentRecord) {
        paymentRecord.payment = clampToZero(paymentRecord.payment + extraPayment);
        paymentRecord.balanceRemaining = debt.balance;
      }
    }

    // 計算本月統計
    const monthPaid = payments.reduce((sum, item) => sum + item.payment, 0);
    totalPaid += monthPaid;
    totalInterest += monthInterest;

    // 檢查已還清的債務
    activeDebts.forEach((debt) => {
      const summary = debtSummaries.get(debt.id);
      if (debt.balance <= 0.01 && summary.monthsToPayoff === null) {
        summary.monthsToPayoff = monthIndex;
        summary.payoffDate = formatISODate(currentDate);
        debt.balance = 0;
      }
    });

    const remainingBalance = activeDebts.reduce((sum, debt) => sum + debt.balance, 0);
    
    schedule.push({
      monthIndex,
      date: formatISODate(currentDate),
      totalInterest: clampToZero(monthInterest),
      totalPaid: clampToZero(monthPaid),
      remainingBalance: clampToZero(remainingBalance),
      payments: payments.map((payment) => ({
        ...payment,
        payment: clampToZero(payment.payment),
        interestAccrued: clampToZero(payment.interestAccrued),
        balanceRemaining: clampToZero(payment.balanceRemaining),
      })),
    });
  }

  return {
    strategy,
    months: monthIndex,
    totalInterest: clampToZero(totalInterest),
    totalPaid: clampToZero(totalPaid),
    payoffDate: schedule.length > 0 ? schedule[schedule.length - 1].date : formatISODate(start),
    schedule,
    debtSummaries: Array.from(debtSummaries.values()).map((summary) => ({
      debtId: summary.debtId,
      debtName: summary.debtName,
      totalInterest: clampToZero(summary.totalInterest),
      totalPaid: clampToZero(summary.totalPaid),
      monthsToPayoff: summary.monthsToPayoff,
      payoffDate: summary.payoffDate,
      startingBalance: clampToZero(summary.startingBalance),
    })),
  };
}

// 比較策略
function compareStrategies(debts, monthlyBudget, startDate = new Date()) {
  try {
    const snowballResult = simulateStrategy(debts, {
      strategy: 'snowball',
      monthlyBudget,
      startDate
    });

    const avalancheResult = simulateStrategy(debts, {
      strategy: 'avalanche',
      monthlyBudget,
      startDate
    });

    const interestSavings = snowballResult.totalInterest - avalancheResult.totalInterest;
    const timeSavings = snowballResult.months - avalancheResult.months;

    return {
      snowball: snowballResult,
      avalanche: avalancheResult,
      comparison: {
        interestSavings: clampToZero(interestSavings),
        timeSavings,
        recommendedStrategy: interestSavings > 1000 ? 'avalanche' : 'snowball',
        reasoning: interestSavings > 1000 
          ? `雪崩法可節省 $${Math.abs(interestSavings).toFixed(0)} 利息`
          : '雪球法能提供更好的心理激勵，建議優先使用'
      }
    };
  } catch (error) {
    throw new DebtError(`策略比較失敗：${error.message}`);
  }
}

// 計算額外還款效果
function calculateExtraPaymentEffect(debts, baseMonthlyBudget, extraAmount, strategy = 'avalanche') {
  const baseResult = simulateStrategy(debts, {
    strategy,
    monthlyBudget: baseMonthlyBudget
  });

  const extraResult = simulateStrategy(debts, {
    strategy,
    monthlyBudget: baseMonthlyBudget + extraAmount
  });

  const interestSavings = baseResult.totalInterest - extraResult.totalInterest;
  const timeSavings = baseResult.months - extraResult.months;

  return {
    baseScenario: baseResult,
    extraPaymentScenario: extraResult,
    benefits: {
      interestSavings: clampToZero(interestSavings),
      timeSavings,
      yearsTimeSavings: Math.round(timeSavings / 12 * 10) / 10,
      roi: extraAmount > 0 ? (interestSavings / (extraAmount * extraResult.months)) * 100 : 0
    }
  };
}

export {
  simulateStrategy,
  compareStrategies,
  calculateExtraPaymentEffect,
  DebtError
};