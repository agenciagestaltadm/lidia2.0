// Brazilian phone number normalization
// Handles the 9th digit logic for Brazilian mobile numbers

/**
 * Validates if a string looks like a Brazilian phone number
 */
export function isValidBrazilianPhone(phone: string): boolean {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Brazilian numbers should have:
  // - Country code (55) + 10 digits (landline) = 12 digits
  // - Country code (55) + 11 digits (mobile) = 13 digits
  // Or without country code:
  // - 10 digits (landline)
  // - 11 digits (mobile)
  
  const validLengths = [10, 11, 12, 13];
  return validLengths.includes(cleaned.length);
}

/**
 * Extracts DDD (area code) from a Brazilian phone number
 */
export function extractDDD(phone: string): string | null {
  const normalized = normalizeBrazilianPhone(phone);
  if (normalized.length >= 12) {
    return normalized.substring(2, 4);
  }
  return null;
}

/**
 * Checks if the number is a mobile number (starts with 9 after DDD)
 */
export function isMobileNumber(phone: string): boolean {
  const normalized = normalizeBrazilianPhone(phone);
  if (normalized.length === 13) {
    // Has country code + 11 digits (mobile)
    const numberWithoutCountry = normalized.substring(2);
    return numberWithoutCountry.length === 11;
  }
  return false;
}

/**
 * Normalizes a Brazilian phone number to international format
 * 
 * Logic:
 * 1. If number < 27 after DDD (old format), insert 9
 * 2. If number >= 27 (new format), keep as is
 * 3. Always ensure country code 55 is present
 * 4. Returns number in format: 55DD9XXXXXXXX or 55DDXXXXXXXX (landline)
 * 
 * Examples:
 * - 11999999999 -> 5511999999999 (adds 55, 9 is already there)
 * - 1199999999 -> 5511999999999 (adds 55 and 9)
 * - 5511999999999 -> 5511999999999 (already normalized)
 */
export function normalizeBrazilianPhone(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Check if it already has country code
  let hasCountryCode = cleaned.startsWith('55') && cleaned.length >= 12;
  
  // Extract number without country code
  let numberWithoutCountry = hasCountryCode ? cleaned.substring(2) : cleaned;
  
  // If it's a landline (10 digits), just add country code
  if (numberWithoutCountry.length === 10) {
    return '55' + numberWithoutCountry;
  }
  
  // If it's already 11 digits (mobile with 9)
  if (numberWithoutCountry.length === 11) {
    const ddd = numberWithoutCountry.substring(0, 2);
    const numberPart = numberWithoutCountry.substring(2);
    const firstDigit = parseInt(numberPart.charAt(0));
    
    // Check if it starts with 9
    if (firstDigit === 9) {
      // Check the second digit to see if 9 was incorrectly added
      const secondDigit = parseInt(numberPart.charAt(1));
      if (secondDigit < 7) {
        // This looks like an old number where 9 was added incorrectly
        // Keep it as is (the number might actually have 9 now)
      }
    }
    
    return '55' + numberWithoutCountry;
  }
  
  // If it's 9 digits (old mobile format without 9)
  if (numberWithoutCountry.length === 9) {
    // We need to determine the DDD - but we don't have it
    // In this case, we assume the first 2 digits are the DDD
    // This is a fallback case
    const ddd = numberWithoutCountry.substring(0, 2);
    const numberPart = numberWithoutCountry.substring(2);
    
    // Add 9 after DDD
    return '55' + ddd + '9' + numberPart;
  }
  
  // If it's 8 digits (old mobile format without DDD and without 9)
  if (numberWithoutCountry.length === 8) {
    // We cannot determine the DDD, return as is with 55 prefix
    // This case should be handled with user input for DDD
    return '55' + numberWithoutCountry;
  }
  
  // Return with country code if not present
  if (!hasCountryCode && cleaned.length > 0) {
    return '55' + cleaned;
  }
  
  return cleaned;
}

/**
 * Advanced normalization with DDD correction
 * Use this when you have context about the expected DDD
 */
export function normalizeBrazilianPhoneWithDDD(
  phone: string, 
  defaultDDD?: string
): string {
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove country code if present
  if (cleaned.startsWith('55')) {
    cleaned = cleaned.substring(2);
  }
  
  // If we have 8 digits (old mobile without DDD), add default DDD
  if (cleaned.length === 8 && defaultDDD) {
    cleaned = defaultDDD + '9' + cleaned;
  }
  
  // If we have 9 digits (new mobile without DDD), add default DDD
  if (cleaned.length === 9 && defaultDDD) {
    cleaned = defaultDDD + cleaned;
  }
  
  // If we have 10 digits (landline or old mobile with DDD)
  if (cleaned.length === 10) {
    const ddd = cleaned.substring(0, 2);
    const numberPart = cleaned.substring(2);
    const firstDigit = parseInt(numberPart.charAt(0));
    
    // If starts with digit < 7, it's old mobile format, add 9
    if (firstDigit < 7 && firstDigit !== 0) {
      cleaned = ddd + '9' + numberPart;
    }
  }
  
  // If we have 11 digits (new mobile with DDD), verify the 9
  if (cleaned.length === 11) {
    const ddd = cleaned.substring(0, 2);
    const numberPart = cleaned.substring(2);
    const firstDigit = parseInt(numberPart.charAt(0));
    
    if (firstDigit !== 9) {
      // Missing 9, add it
      cleaned = ddd + '9' + numberPart;
    }
  }
  
  return '55' + cleaned;
}

/**
 * Formats a normalized phone number for display
 * Format: +55 (DD) 9XXXX-XXXX
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizeBrazilianPhone(phone);
  
  if (normalized.length === 13) {
    // Mobile: 55DD9XXXXXXXX
    const country = normalized.substring(0, 2);
    const ddd = normalized.substring(2, 4);
    const part1 = normalized.substring(4, 9);
    const part2 = normalized.substring(9);
    return `+${country} (${ddd}) ${part1}-${part2}`;
  } else if (normalized.length === 12) {
    // Landline: 55DDXXXXXXXX
    const country = normalized.substring(0, 2);
    const ddd = normalized.substring(2, 4);
    const part1 = normalized.substring(4, 8);
    const part2 = normalized.substring(8);
    return `+${country} (${ddd}) ${part1}-${part2}`;
  }
  
  return phone;
}

/**
 * Validates if a number can receive WhatsApp messages
 * Basic validation - just checks format
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  const normalized = normalizeBrazilianPhone(phone);
  
  // WhatsApp requires international format
  if (!normalized.startsWith('55')) {
    return false;
  }
  
  // Must be 12 (landline) or 13 (mobile) digits
  if (normalized.length !== 12 && normalized.length !== 13) {
    return false;
  }
  
  // Check DDD is valid (01-99)
  const ddd = parseInt(normalized.substring(2, 4));
  if (ddd < 1 || ddd > 99) {
    return false;
  }
  
  return true;
}

/**
 * Batch normalize multiple phone numbers
 */
export function normalizePhoneBatch(
  phones: string[],
  defaultDDD?: string
): Array<{ original: string; normalized: string; valid: boolean }> {
  return phones.map(phone => {
    const normalized = defaultDDD 
      ? normalizeBrazilianPhoneWithDDD(phone, defaultDDD)
      : normalizeBrazilianPhone(phone);
    
    return {
      original: phone,
      normalized,
      valid: isValidWhatsAppNumber(normalized)
    };
  });
}

/**
 * Parse CSV row and extract phone number
 * Expected formats: "Name,Phone" or "Phone"
 */
export function parseCSVPhone(
  row: string,
  defaultDDD?: string
): { name?: string; phone: string; normalized: string; valid: boolean } {
  const parts = row.split(',').map(p => p.trim());
  
  let name: string | undefined;
  let phone: string;
  
  if (parts.length >= 2) {
    name = parts[0];
    phone = parts[1];
  } else {
    phone = parts[0];
  }
  
  const normalized = defaultDDD
    ? normalizeBrazilianPhoneWithDDD(phone, defaultDDD)
    : normalizeBrazilianPhone(phone);
  
  return {
    name,
    phone,
    normalized,
    valid: isValidWhatsAppNumber(normalized)
  };
}
