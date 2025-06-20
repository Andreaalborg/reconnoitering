export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  // Minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Maximum length (prevent DoS attacks)
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  // Contains uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Contains lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Contains number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Contains special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty123', 'admin123',
    'letmein', 'welcome123', 'monkey123', 'dragon123'
  ];
  
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('Password is too common or weak');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  const validation = validatePassword(password);
  
  if (!validation.isValid) {
    return 'weak';
  }
  
  let strength = 0;
  
  // Length bonus
  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;
  
  // Complexity bonus
  if (/[A-Z].*[A-Z]/.test(password)) strength++; // Multiple uppercase
  if (/[a-z].*[a-z]/.test(password)) strength++; // Multiple lowercase
  if (/[0-9].*[0-9]/.test(password)) strength++; // Multiple numbers
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++; // Multiple special
  
  if (strength >= 4) return 'strong';
  if (strength >= 2) return 'medium';
  return 'weak';
}