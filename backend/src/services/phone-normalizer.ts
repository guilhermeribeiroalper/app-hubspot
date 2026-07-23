// ============================================================================
// phone-normalizer.ts
//
// Pure function that normalizes a raw phone string into clean digits + DDI
// metadata. No side effects, easy to unit-test.
//
// Rules (per spec):
//   1. If the input starts with "+" and has a "-" after, everything between
//      the "+" and the first "-" is the country code (DDI) and is removed.
//   2. All non-digit characters (spaces, parens, dots, dashes) are removed.
//   3. If the input has no "+" OR no "-" after the "+", the original digits
//      are returned with the "+" stripped, no DDI detected.
//   4. Empty / null / non-string inputs return an empty result with a
//      populated `error_message`.
// ============================================================================

export interface NormalizedPhone {
  phone_clean: string;
  country_code: string;
  digit_count: number;
  had_plus: 'true' | 'false';
  error_message: string;
}

export function normalizePhone(raw: unknown): NormalizedPhone {
  if (raw === null || raw === undefined) {
    return {
      phone_clean: '',
      country_code: '',
      digit_count: 0,
      had_plus: 'false',
      error_message: 'raw_phone is null or undefined',
    };
  }

  if (typeof raw !== 'string') {
    return {
      phone_clean: '',
      country_code: '',
      digit_count: 0,
      had_plus: 'false',
      error_message: `raw_phone must be a string, got ${typeof raw}`,
    };
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return {
      phone_clean: '',
      country_code: '',
      digit_count: 0,
      had_plus: 'false',
      error_message: 'raw_phone is empty',
    };
  }

  const had_plus: 'true' | 'false' = trimmed.startsWith('+') ? 'true' : 'false';

  let country_code = '';
  let rest = trimmed;

  if (had_plus === 'true') {
    const afterPlus = trimmed.slice(1);
    const dashIndex = afterPlus.indexOf('-');

    if (dashIndex >= 0) {
      country_code = afterPlus.slice(0, dashIndex).trim();
      rest = afterPlus.slice(dashIndex + 1);
    } else {
      // No "-" after "+" — ambiguous. Per spec, return the full digit
      // string with the "+" stripped, no country code detected.
      rest = afterPlus;
    }
  }

  const phone_clean = rest.replace(/\D+/g, '');

  return {
    phone_clean,
    country_code,
    digit_count: phone_clean.length,
    had_plus,
    error_message: '',
  };
}
