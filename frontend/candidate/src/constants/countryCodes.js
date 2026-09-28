/**
 * Comprehensive List of Major Country Dialing Codes with Flags and Names
 */
export const COUNTRY_CODES = [
  { code: '+91', name: 'India', flag: '🇮🇳', iso: 'IN' },
  { code: '+1', name: 'United States', flag: '🇺🇸', iso: 'US' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', iso: 'GB' },
  { code: '+1-CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦', iso: 'CA' },
  { code: '+61', name: 'Australia', flag: '🇦🇺', iso: 'AU' },
  { code: '+49', name: 'Germany', flag: '🇩🇪', iso: 'DE' },
  { code: '+33', name: 'France', flag: '🇫🇷', iso: 'FR' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', iso: 'SG' },
  { code: '+971', name: 'United Arab Emirates', flag: '🇦🇪', iso: 'AE' },
  { code: '+81', name: 'Japan', flag: '🇯🇵', iso: 'JP' },
  { code: '+86', name: 'China', flag: '🇨🇳', iso: 'CN' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭', iso: 'CH' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱', iso: 'NL' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪', iso: 'SE' },
  { code: '+47', name: 'Norway', flag: '🇳🇴', iso: 'NO' },
  { code: '+45', name: 'Denmark', flag: '🇩🇰', iso: 'DK' },
  { code: '+353', name: 'Ireland', flag: '🇮🇪', iso: 'IE' },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿', iso: 'NZ' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷', iso: 'KR' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', iso: 'SA' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦', iso: 'QA' },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼', iso: 'KW' },
  { code: '+968', name: 'Oman', flag: '🇴🇲', iso: 'OM' },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭', iso: 'BH' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾', iso: 'MY' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩', iso: 'ID' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭', iso: 'PH' },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳', iso: 'VN' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭', iso: 'TH' },
  { code: '+852', name: 'Hong Kong', flag: '🇭🇰', iso: 'HK' },
  { code: '+886', name: 'Taiwan', flag: '🇹🇼', iso: 'TW' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷', iso: 'BR' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽', iso: 'MX' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷', iso: 'AR' },
  { code: '+56', name: 'Chile', flag: '🇨🇱', iso: 'CL' },
  { code: '+57', name: 'Colombia', flag: '🇨🇴', iso: 'CO' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦', iso: 'ZA' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬', iso: 'NG' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪', iso: 'KE' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬', iso: 'EG' },
  { code: '+34', name: 'Spain', flag: '🇪🇸', iso: 'ES' },
  { code: '+39', name: 'Italy', flag: '🇮🇹', iso: 'IT' },
  { code: '+48', name: 'Poland', flag: '🇵🇱', iso: 'PL' },
  { code: '+358', name: 'Finland', flag: '🇫🇮', iso: 'FI' },
  { code: '+43', name: 'Austria', flag: '🇦🇹', iso: 'AT' },
  { code: '+32', name: 'Belgium', flag: '🇧🇪', iso: 'BE' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹', iso: 'PT' },
  { code: '+30', name: 'Greece', flag: '🇬🇷', iso: 'GR' },
  { code: '+420', name: 'Czech Republic', flag: '🇨🇿', iso: 'CZ' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰', iso: 'PK' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩', iso: 'BD' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰', iso: 'LK' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵', iso: 'NP' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷', iso: 'TR' },
  { code: '+972', name: 'Israel', flag: '🇮🇱', iso: 'IL' },
  { code: '+7', name: 'Russia', flag: '🇷🇺', iso: 'RU' }
];

/**
 * Parses any existing phone string into country dial code + number
 * @param {string} rawPhone 
 * @returns {{ dialCode: string, number: string }}
 */
export function parsePhoneNumber(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { dialCode: '+91', number: '' };
  }
  const clean = rawPhone.trim();
  if (!clean) return { dialCode: '+91', number: '' };

  // Sort dial codes by descending length so +971 is matched before +97, +880 before +88, etc.
  const uniqueDialCodes = Array.from(
    new Set(COUNTRY_CODES.map(c => c.dialCode || c.code))
  ).sort((a, b) => b.length - a.length);

  for (const dc of uniqueDialCodes) {
    if (clean.startsWith(dc)) {
      const rest = clean.slice(dc.length).trim().replace(/^[-.\s]+/, '');
      return { dialCode: dc, number: rest };
    }
  }

  // If starts with + but not in list
  if (clean.startsWith('+')) {
    const spaceIdx = clean.search(/[\s-]/);
    if (spaceIdx > 1) {
      return {
        dialCode: clean.slice(0, spaceIdx),
        number: clean.slice(spaceIdx + 1).trim()
      };
    }
  }

  // Plain number without prefix
  return { dialCode: '+91', number: clean };
}
