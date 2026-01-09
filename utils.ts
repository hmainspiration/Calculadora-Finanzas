export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
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

// Returns the week number of the month (1-5) based on date
export const getWeekOfMonth = (date: Date): number => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    
    // We assume the week starts on Sunday for calculation consistency
    // However, logic: Date 1 + offset / 7
    const dayOfMonth = date.getDate();
    return Math.ceil((dayOfMonth + firstDay.getDay()) / 7);
};

// Returns a valid date string for a specific week number in the current month
export const getDateForSpecificWeek = (targetWeek: number): string => {
    const date = new Date();
    const currentMonth = date.getMonth();
    
    // Start at the 1st of the month
    date.setDate(1);
    
    // Loop days until we hit the target week
    // Safety check: ensure we don't bleed into next month
    while (getWeekOfMonth(date) < targetWeek && date.getMonth() === currentMonth) {
        date.setDate(date.getDate() + 1);
    }
    
    // Set time to noon to avoid timezone edge cases on display
    date.setHours(12, 0, 0, 0);
    
    return date.toISOString();
};

// Generates a random ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};