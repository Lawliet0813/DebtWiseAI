import { clampToZero, formatYearMonth } from '../utils/date.js';

function createAnalyticsService(context) {
  const { db } = context;

  function getSummary(userId) {
    const debts = db.data.debts.filter((debt) => debt.userId === userId);
    const totalPrincipal = debts.reduce((sum, debt) => sum + (debt.principal || 0), 0);
    const totalBalance = debts.reduce((sum, debt) => sum + (debt.balance || 0), 0);
    const totalPaid = debts.reduce((sum, debt) => sum + (debt.totalPaid || 0), 0);
    const progress = totalPrincipal > 0 ? clampToZero(((totalPrincipal - totalBalance) / totalPrincipal) * 100) : 0;
    const nextDueDebt = debts
      .filter((debt) => debt.balance > 0)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
    const averageApr = debts.length > 0 ? clampToZero(debts.reduce((sum, debt) => sum + debt.apr, 0) / debts.length) : 0;

    return {
      totals: {
        principal: clampToZero(totalPrincipal),
        balance: clampToZero(totalBalance),
        paid: clampToZero(totalPaid),
        averageApr,
      },
      progress,
      nextDueDebt: nextDueDebt
        ? {
            id: nextDueDebt.id,
            name: nextDueDebt.name,
            dueDate: nextDueDebt.dueDate,
            balance: clampToZero(nextDueDebt.balance),
          }
        : null,
      debtsCount: debts.length,
    };
  }

  function getDistribution(userId) {
    const debts = db.data.debts.filter((debt) => debt.userId === userId);
    const grouped = debts.reduce((acc, debt) => {
      const key = debt.type || 'other';
      if (!acc[key]) {
        acc[key] = { type: key, principal: 0, balance: 0 };
      }
      acc[key].principal += debt.principal || 0;
      acc[key].balance += debt.balance || 0;
      return acc;
    }, {});
    return Object.values(grouped).map((item) => ({
      type: item.type,
      principal: clampToZero(item.principal),
      balance: clampToZero(item.balance),
    }));
  }

  function getTrends(userId) {
    const payments = db.data.payments.filter((payment) => payment.userId === userId);
    const grouped = payments.reduce((acc, payment) => {
      const key = formatYearMonth(payment.paidAt);
      if (!acc[key]) {
        acc[key] = { month: key, paid: 0, payments: 0 };
      }
      acc[key].paid += payment.amount;
      acc[key].payments += 1;
      return acc;
    }, {});
    const series = Object.values(grouped)
      .map((item) => ({
        month: item.month,
        paid: clampToZero(item.paid),
        payments: item.payments,
      }))
      .sort((a, b) => (a.month > b.month ? 1 : -1));
    return {
      months: series.map((item) => item.month),
      paid: series.map((item) => item.paid),
      payments: series.map((item) => item.payments),
    };
  }

  return {
    getSummary,
    getDistribution,
    getTrends,
  };
}

export default createAnalyticsService;
