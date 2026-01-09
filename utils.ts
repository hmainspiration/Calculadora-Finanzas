export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
};

export const safeCalculate = (expression: string): number | null => {
  try {
    // Basic sanitization to allow only numbers and operators
    const sanitized = expression.replace(/[^0-9+\-*/.]/g, '');
    if (!sanitized) return null;
    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + sanitized)();
    return isFinite(result) ? result : null;
  } catch (e) {
    return null;
  }
};

export const getSundaysInMonth = (date: Date): number => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  let sundayCount = 0;

  for (let day = 1; day <= totalDays; day++) {
    const current = new Date(year, month, day);
    if (current.getDay() === 0) {
      sundayCount++;
    }
  }
  return sundayCount;
};

// Generates a random ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};