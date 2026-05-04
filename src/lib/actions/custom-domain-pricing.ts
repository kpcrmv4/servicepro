/**
 * Pricing constants + shared types for the Custom Domain add-on.
 * Lives in a separate module from custom-domain.ts because
 * 'use server' files can only export async functions in Next 15+.
 */
export const CUSTOM_DOMAIN_PRICE_YEARLY = 1000;

export interface DomainStatus {
  domain: string | null;
  status: string | null;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
  dns_instructions?: {
    type: 'apex' | 'subdomain';
    records: Array<{ type: string; host: string; value: string; ttl?: string }>;
  };
  added_at: string | null;
  verified_at: string | null;
}
