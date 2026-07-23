// ============================================================================
// phone-normalizer.js
// Endpoint: POST /workflow-action/phone-normalizer
//
// HubSpot Custom Workflow Action handler that normalizes phone numbers.
//
// Input (from HubSpot):
//   { raw_phone: "+55-99999-0000" | "+1-415-555-0123" | "1199990000" | ... }
//
// Output (back to HubSpot):
//   {
//     error_message: "",
//     phone_clean:   "999990000",         // digits only, no country code
//     country_code:  "55" | "1" | "",     // empty when no leading "+"
//     digit_count:   9,                   // total digits after cleaning
//     had_plus:      "true" | "false"
//   }
//
// Rules:
//   - If the input starts with "+" followed by a country code and a "-",
//     strip the country code (everything between "+" and the first "-").
//   - All other characters (spaces, parens, dots, etc.) are removed.
//   - If the input has no "+" (or no "-" after the country code), the
//     original digits are returned unchanged.
// ============================================================================

'use strict';

/**
 * Normalize a raw phone string into clean digits + metadata.
 * Pure function — no side effects, easy to unit-test.
 *
 * @param {string} raw
 * @returns {{
 *   phone_clean: string,
 *   country_code: string,
 *   digit_count: number,
 *   had_plus: 'true' | 'false',
 *   error_message: string
 * }}
 */
function normalizePhone(raw) {
  const error_message = '';

  // Guard: null / undefined / non-string
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

  const had_plus = trimmed.startsWith('+') ? 'true' : 'false';

  let country_code = '';
  let rest = trimmed;

  if (had_plus === 'true') {
    // Look at what comes after the leading "+".
    const afterPlus = trimmed.slice(1);

    // Preferred rule: split at the FIRST "-" to separate the country code
    // from the local number. The phone spec uses "-55-99999-0000" form, so
    // this is the canonical case.
    const dashIndex = afterPlus.indexOf('-');

    if (dashIndex >= 0) {
      country_code = afterPlus.slice(0, dashIndex).trim();
      rest = afterPlus.slice(dashIndex + 1);
    } else {
      // No "-" after "+" — ambiguous: we can't know where the country code
      // ends and the local number begins. Per spec, return the full digit
      // string with the "+" stripped, no country code detected.
      rest = afterPlus;
    }
  }

  // Remove everything that is not a digit (spaces, parens, dots, dashes, etc.)
  const phone_clean = rest.replace(/\D+/g, '');

  return {
    phone_clean,
    country_code,
    digit_count: phone_clean.length,
    had_plus,
    error_message,
  };
}

/**
 * Express / Fastify route handler.
 * Mount this at POST /workflow-action/phone-normalizer.
 *
 * @param {import('fastify').FastifyRequest} req
 * @param {import('fastify').FastifyReply} reply
 */
async function phoneNormalizerHandler(req, reply) {
  // HubSpot wraps the action inputs in one of these shapes depending on
  // platform version. We accept both for forward-compat.
  const body = req.body || {};
  const inputFields = body.inputFields || body.fields || body;
  const raw_phone = inputFields.raw_phone ?? body.raw_phone ?? '';

  const result = normalizePhone(raw_phone);

  // The shape HubSpot expects back from a custom workflow action callback
  // is { outputFields: { ... } }. The HubSpot workflow tool maps these by
  // the output field names defined in the *-hsmeta.json file.
  return reply.send({
    outputFields: {
      error_message: result.error_message,
      phone_clean: result.phone_clean,
      country_code: result.country_code,
      digit_count: result.digit_count,
      had_plus: result.had_plus,
    },
  });
}

module.exports = { normalizePhone, phoneNormalizerHandler };
