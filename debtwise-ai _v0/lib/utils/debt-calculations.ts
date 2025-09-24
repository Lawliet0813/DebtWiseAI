// 債務計算工具函數
export function calculateTotalDebt(debts: Array<{ current_balance: number }>): number {
  return debts.reduce((total, debt) => total + debt.current_balance, 0)
}

export function calculateMonthlyMinimum(debts: Array<{ minimum_payment: number }>): number {
  return debts.reduce((total, debt) => total + debt.minimum_payment, 0)
}

export function calculateWeightedInterestRate(
  debts: Array<{ current_balance: number; interest_rate: number }>,
): number {
  const totalBalance = calculateTotalDebt(debts)
  if (totalBalance === 0) return 0

  const weightedSum = debts.reduce((sum, debt) => {
    return sum + debt.current_balance * debt.interest_rate
  }, 0)

  return weightedSum / totalBalance
}

export function calculatePayoffTime(balance: number, monthlyPayment: number, interestRate: number): number {
  if (monthlyPayment <= 0 || balance <= 0) return 0

  const monthlyRate = interestRate / 100 / 12
  if (monthlyRate === 0) return Math.ceil(balance / monthlyPayment)

  const months = -Math.log(1 - (balance * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate)
  return Math.ceil(months)
}

export function calculateInterestSaved(
  balance: number,
  minimumPayment: number,
  extraPayment: number,
  interestRate: number,
): number {
  const monthlyRate = interestRate / 100 / 12

  // 只付最低還款的總利息
  const minimumMonths = calculatePayoffTime(balance, minimumPayment, interestRate)
  const minimumTotalInterest = minimumPayment * minimumMonths - balance

  // 額外還款的總利息
  const extraMonths = calculatePayoffTime(balance, minimumPayment + extraPayment, interestRate)
  const extraTotalInterest = (minimumPayment + extraPayment) * extraMonths - balance

  return Math.max(0, minimumTotalInterest - extraTotalInterest)
}

// 雪球法排序（按餘額從小到大）
export function sortBySnowball<T extends { current_balance: number }>(debts: T[]): T[] {
  return [...debts].sort((a, b) => a.current_balance - b.current_balance)
}

// 雪崩法排序（按利率從高到低）
export function sortByAvalanche<T extends { interest_rate: number }>(debts: T[]): T[] {
  return [...debts].sort((a, b) => b.interest_rate - a.interest_rate)
}
