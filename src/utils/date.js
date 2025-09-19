function formatISODate(date) {
  return new Date(date).toISOString();
}

function addMonths(date, months) {
  const result = new Date(date);
  const d = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() !== d) {
    result.setDate(0);
  }
  return result;
}

function startOfMonth(date) {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatYearMonth(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function differenceInDays(later, earlier) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((later.getTime() - earlier.getTime()) / msPerDay);
}

function clampToZero(value) {
  if (Math.abs(value) < 0.005) {
    return 0;
  }
  return Number(value.toFixed(2));
}

export {
  formatISODate,
  addMonths,
  startOfMonth,
  formatYearMonth,
  differenceInDays,
  clampToZero,
};
