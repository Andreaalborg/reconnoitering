import * as Sentry from '@sentry/nextjs';

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// MongoDB ObjectId validation
export function isValidObjectId(id: string): boolean {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
}

// String length validation
export function isValidStringLength(str: string, min: number, max: number): boolean {
  return str.length >= min && str.length <= max;
}

// Alphanumeric with spaces validation (for names, titles, etc.)
export function isValidAlphanumeric(str: string): boolean {
  const alphanumericRegex = /^[a-zA-Z0-9\s\-.,!?'"()]+$/;
  return alphanumericRegex.test(str);
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Date validation
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Number range validation
export function isInRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}

// Sanitize HTML input
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate and sanitize input
export function validateInput<T>(
  input: any,
  validations: {
    [K in keyof T]?: {
      required?: boolean;
      type?: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'objectId' | 'url';
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: RegExp;
      sanitize?: boolean;
    };
  }
): { isValid: boolean; errors: string[]; sanitized: Partial<T> } {
  const errors: string[] = [];
  const sanitized: Partial<T> = {};

  for (const [field, rules] of Object.entries(validations) as [keyof T, any][]) {
    const value = input[field];

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${String(field)} is required`);
      continue;
    }

    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    if (rules.type) {
      switch (rules.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${String(field)} must be a string`);
            continue;
          }
          break;
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`${String(field)} must be a number`);
            continue;
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${String(field)} must be a boolean`);
            continue;
          }
          break;
        case 'date':
          if (!isValidDate(value)) {
            errors.push(`${String(field)} must be a valid date`);
            continue;
          }
          break;
        case 'email':
          if (!isValidEmail(value)) {
            errors.push(`${String(field)} must be a valid email`);
            continue;
          }
          break;
        case 'objectId':
          if (!isValidObjectId(value)) {
            errors.push(`${String(field)} must be a valid ID`);
            continue;
          }
          break;
        case 'url':
          if (!isValidUrl(value)) {
            errors.push(`${String(field)} must be a valid URL`);
            continue;
          }
          break;
      }
    }

    // String length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${String(field)} must be at least ${rules.minLength} characters`);
      continue;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${String(field)} must be at most ${rules.maxLength} characters`);
      continue;
    }

    // Number range validation
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${String(field)} must be at least ${rules.min}`);
      continue;
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`${String(field)} must be at most ${rules.max}`);
      continue;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${String(field)} has invalid format`);
      continue;
    }

    // Sanitize if needed
    if (rules.sanitize && typeof value === 'string') {
      sanitized[field] = sanitizeHtml(value) as T[keyof T];
    } else {
      sanitized[field] = value;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

// Log validation errors to Sentry
export function logValidationError(endpoint: string, errors: string[], input: any) {
  Sentry.captureMessage('Input validation failed', {
    level: 'warning',
    tags: {
      endpoint,
      validation: 'failed'
    },
    extra: {
      errors,
      input: JSON.stringify(input).substring(0, 1000) // Limit size
    }
  });
}