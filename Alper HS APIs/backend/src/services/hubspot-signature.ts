import crypto from 'crypto';

export function validateHubSpotSignature(
  body: string,
  signature: string | undefined,
  clientSecret: string
): boolean {
  if (!signature) return false;

  const hash = crypto
    .createHmac('sha256', clientSecret)
    .update(body)
    .digest('hex');

  return hash === signature;
}
