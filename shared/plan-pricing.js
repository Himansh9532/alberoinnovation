export const PLAN_BILLING_TERMS = [
  { months: 1, label: "1 month" },
  { months: 3, label: "3 months", savings: "Save 11%" },
  { months: 6, label: "6 months", savings: "Save 16%" },
  { months: 12, label: "1 year", savings: "Save 25%" },
];

export const PLAN_PRICES_INR = {
  plus: { 1: 299, 3: 799, 6: 1499, 12: 2699 },
  pro: { 1: 599, 3: 1599, 6: 2999, 12: 5399 },
};

export function getPlanPricePaise(plan, months) {
  const price = PLAN_PRICES_INR[plan]?.[months];
  return Number.isInteger(price) ? price * 100 : null;
}

export function addCalendarMonths(date, months) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}
