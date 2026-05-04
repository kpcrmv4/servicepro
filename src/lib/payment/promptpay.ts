/**
 * PromptPay QR generation via promptpay.io.
 *
 * promptpay.io is a free public service that returns a QR-code PNG when
 * called with `https://promptpay.io/<id>/<amount>.png`.
 * - <id> = phone number (10 digits, leading 0) or 13-digit national ID
 *   or 13-digit tax ID. Hyphens/spaces are stripped automatically.
 * - <amount> = amount in baht (decimal allowed, e.g. 1500 or 1500.50).
 *   Omit for "any amount" QR.
 *
 * No library or server-side rendering needed — we just build the URL
 * and let the browser fetch the PNG directly.
 */

export interface PromptPayConfig {
  id: string;          // phone or ID — required
  accountName?: string;
  bankName?: string;
  bankAccount?: string;
  acceptCreditCard?: boolean;
}

const SANITIZE_RE = /[^0-9]/g;

export function normalizePromptPayId(input: string): string {
  return input.replace(SANITIZE_RE, '');
}

export function isValidPromptPayId(input: string): boolean {
  const id = normalizePromptPayId(input);
  if (id.length === 10 && id.startsWith('0')) return true;     // phone
  if (id.length === 13) return true;                            // citizen ID / tax ID
  return false;
}

export function getPromptPayQrUrl(id: string, amount?: number): string {
  const clean = normalizePromptPayId(id);
  if (amount && amount > 0) {
    return `https://promptpay.io/${clean}/${amount.toFixed(2)}.png`;
  }
  return `https://promptpay.io/${clean}.png`;
}

/**
 * Read platform PromptPay/bank settings from env vars. These are used
 * for subscription renewal payments (KPServicePro itself receiving payment).
 */
export function getPlatformPaymentInfo(): PromptPayConfig | null {
  const id = process.env.PLATFORM_PROMPTPAY_ID;
  if (!id || !isValidPromptPayId(id)) return null;
  return {
    id,
    accountName: process.env.PLATFORM_PROMPTPAY_NAME || 'KPServicePro',
    bankName: process.env.PLATFORM_BANK_NAME || undefined,
    bankAccount: process.env.PLATFORM_BANK_ACCOUNT || undefined,
    acceptCreditCard: process.env.PLATFORM_ACCEPT_CREDIT_CARD === 'true',
  };
}
