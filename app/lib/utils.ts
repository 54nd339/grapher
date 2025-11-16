/**
 * Generate a random color for equations
 */
export const generateRandomColor = (): string => {
  const colors = [
    '#ef4444', // red
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#14b8a6', // teal
    '#6366f1', // indigo
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Format a number for display with appropriate precision
 * @param num - Number to format
 * @param precision - Decimal precision (default: 4)
 * @returns Formatted number string
 */
export const formatNumber = (num: number, precision: number = 4): string => {
  if (!Number.isFinite(num)) return 'undefined';
  if (Math.abs(num) < 1e-10) return '0';
  if (Math.abs(num) > 1e6 || Math.abs(num) < 1e-3) {
    return num.toExponential(precision);
  }
  return num.toFixed(precision).replace(/\.?0+$/, '');
};

/**
 * Format a matrix for display
 */
export const formatMatrix = (matrix: number[][]): string => {
  return matrix
    .map((row) => `[${row.map((val) => formatNumber(val, 2)).join(', ')}]`)
    .join('\n');
};

/**
 * Format a vector for display
 */
export const formatVector = (vector: number[]): string => {
  return `[${vector.map((val) => formatNumber(val, 2)).join(', ')}]`;
};

/**
 * Validate mathematical expression
 */
export const validateExpression = (expression: string): { valid: boolean; error?: string } => {
  if (!expression || expression.trim() === '') {
    return { valid: false, error: 'Expression cannot be empty' };
  }

  // Check for balanced parentheses
  let count = 0;
  for (const char of expression) {
    if (char === '(') count++;
    if (char === ')') count--;
    if (count < 0) return { valid: false, error: 'Unbalanced parentheses' };
  }
  if (count !== 0) return { valid: false, error: 'Unbalanced parentheses' };

  // Check for invalid characters (basic check)
  const validChars = /^[0-9a-zA-Z+\-*/^().,\s=<>!|&]+$/;
  if (!validChars.test(expression)) {
    return { valid: false, error: 'Invalid characters in expression' };
  }

  return { valid: true };
};

/**
 * Parse matrix from string input
 */
export const parseMatrix = (input: string): number[][] => {
  try {
    // Expected format: [[1,2],[3,4]] or "1,2;3,4"
    if (input.includes('[')) {
      return JSON.parse(input);
    }
    
    // Parse semicolon-separated format
    const rows = input.split(';');
    return rows.map((row) =>
      row.split(',').map((val) => parseFloat(val.trim()))
    );
  } catch {
    throw new Error('Invalid matrix format');
  }
};

/**
 * Parse vector from string input
 */
export const parseVector = (input: string): number[] => {
  try {
    // Expected format: [1,2,3] or "1,2,3"
    if (input.includes('[')) {
      return JSON.parse(input);
    }
    
    return input.split(',').map((val) => parseFloat(val.trim()));
  } catch {
    throw new Error('Invalid vector format');
  }
};

/**
 * Download data as file
 * @param data - The data to download
 * @param filename - The filename for the download
 * @param type - The MIME type (default: 'text/plain')
 */
export const downloadAsFile = (data: string, filename: string, type: string = 'text/plain'): void => {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export equations to JSON format
 * @param equations - Array of equations to export
 * @returns JSON string representation
 */
export const exportEquations = (equations: unknown[]): string => {
  return JSON.stringify(equations, null, 2);
};

/**
 * Debounce function to limit function execution frequency
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function to limit function execution rate
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
