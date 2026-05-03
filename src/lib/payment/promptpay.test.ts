import { describe, it, expect } from 'vitest';
import {
  normalizePromptPayId,
  isValidPromptPayId,
  getPromptPayQrUrl,
} from './promptpay';

describe('promptpay', () => {
  it('strips non-digits when normalizing', () => {
    expect(normalizePromptPayId('081-234-5678')).toBe('0812345678');
    expect(normalizePromptPayId('  +66 81 234 5678  ')).toBe('66812345678');
    expect(normalizePromptPayId('1-234-56789-0123')).toBe('1234567890123');
  });

  it('validates 10-digit phone numbers starting with 0', () => {
    expect(isValidPromptPayId('0812345678')).toBe(true);
    expect(isValidPromptPayId('081-234-5678')).toBe(true);
    expect(isValidPromptPayId('1234567890')).toBe(false);
  });

  it('validates 13-digit national / tax IDs', () => {
    expect(isValidPromptPayId('1234567890123')).toBe(true);
    expect(isValidPromptPayId('123456789012')).toBe(false); // 12 digits
  });

  it('builds promptpay.io URL with amount', () => {
    expect(getPromptPayQrUrl('0812345678', 1500)).toBe(
      'https://promptpay.io/0812345678/1500.00.png',
    );
  });

  it('builds promptpay.io URL without amount', () => {
    expect(getPromptPayQrUrl('0812345678')).toBe(
      'https://promptpay.io/0812345678.png',
    );
  });

  it('handles formatted IDs in QR builder', () => {
    expect(getPromptPayQrUrl('081-234-5678', 100)).toBe(
      'https://promptpay.io/0812345678/100.00.png',
    );
  });
});
