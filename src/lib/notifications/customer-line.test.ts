import { describe, it, expect } from 'vitest';
import {
  parseCustomerNotifyConfig,
  renderTemplate,
  DEFAULT_CUSTOMER_NOTIFY_CONFIG,
} from './customer-line';

describe('notifications/customer-line', () => {
  it('returns defaults on null', () => {
    expect(parseCustomerNotifyConfig(null)).toEqual(DEFAULT_CUSTOMER_NOTIFY_CONFIG);
  });

  it('preserves user template overrides', () => {
    const cfg = parseCustomerNotifyConfig({
      default_mode: 'auto',
      events: { in_progress: { enabled: true, auto: true, template: 'CUSTOM {{job_number}}' } },
    });
    expect(cfg.default_mode).toBe('auto');
    expect(cfg.events.in_progress?.template).toBe('CUSTOM {{job_number}}');
    // Other events keep defaults
    expect(cfg.events.completed?.enabled).toBe(true);
  });

  it('substitutes template variables', () => {
    expect(
      renderTemplate('Job {{job_number}} for {{vehicle}}', {
        job_number: 'J-1',
        vehicle: 'Civic',
      }),
    ).toBe('Job J-1 for Civic');
  });

  it('replaces missing variables with empty string', () => {
    expect(renderTemplate('A={{a}} B={{b}}', { a: 'x' })).toBe('A=x B=');
  });
});
