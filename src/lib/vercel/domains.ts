/**
 * Vercel Domains API client — used to add/verify/remove custom
 * domains on the Vercel project hosting this app.
 *
 * The shop owner sets up DNS:
 *   A record:    cname.vercel-dns.com (apex)  —or— www CNAME → cname.vercel-dns.com
 *   then comes back here and clicks "verify". Vercel issues an SSL
 *   certificate via Let's Encrypt automatically once verified.
 *
 * Docs:
 *   https://vercel.com/docs/rest-api/endpoints/projects#add-a-domain-to-a-project
 *   https://vercel.com/docs/rest-api/endpoints/projects#verify-project-domain
 */

const BASE = 'https://api.vercel.com';

interface VercelConfig {
  token: string;
  projectId: string;
  teamId: string | null;
}

export function getVercelConfig(): VercelConfig | null {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return null;
  return { token, projectId, teamId: process.env.VERCEL_TEAM_ID || null };
}

function teamQuery(cfg: VercelConfig): string {
  return cfg.teamId ? `?teamId=${cfg.teamId}` : '';
}

interface VercelError {
  error: { code: string; message: string };
}
type VercelResponse<T> = T | VercelError;

function isError<T>(r: VercelResponse<T>): r is VercelError {
  return Boolean(r && typeof r === 'object' && 'error' in r);
}

export interface AddDomainResult {
  ok: boolean;
  /** Already exists on the project (idempotent re-add) */
  alreadyExists?: boolean;
  /** True once DNS is correct + cert issued */
  verified?: boolean;
  /** Verification challenges Vercel gave us */
  verification?: Array<{ type: string; domain: string; value: string; reason: string }>;
  error?: string;
}

export async function addDomain(domain: string): Promise<AddDomainResult> {
  const cfg = getVercelConfig();
  if (!cfg) return { ok: false, error: 'VERCEL_API_TOKEN ยังไม่ได้ตั้งค่า' };

  const res = await fetch(
    `${BASE}/v10/projects/${cfg.projectId}/domains${teamQuery(cfg)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    },
  );
  const data = (await res.json()) as VercelResponse<{
    name: string;
    verified: boolean;
    verification?: AddDomainResult['verification'];
  }>;

  if (isError(data)) {
    if (data.error.code === 'domain_already_in_use_by_different_project') {
      return { ok: false, error: 'โดเมนนี้ถูกใช้กับโปรเจ็คอื่นแล้ว' };
    }
    if (data.error.code === 'domain_already_exists') {
      // Already on this project — treat as success
      return { ok: true, alreadyExists: true };
    }
    return { ok: false, error: data.error.message };
  }

  return {
    ok: true,
    verified: data.verified,
    verification: data.verification,
  };
}

export async function verifyDomain(domain: string): Promise<{
  ok: boolean;
  verified: boolean;
  verification?: AddDomainResult['verification'];
  error?: string;
}> {
  const cfg = getVercelConfig();
  if (!cfg) return { ok: false, verified: false, error: 'VERCEL_API_TOKEN ยังไม่ได้ตั้งค่า' };

  const res = await fetch(
    `${BASE}/v9/projects/${cfg.projectId}/domains/${encodeURIComponent(domain)}/verify${teamQuery(cfg)}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}` },
    },
  );
  const data = (await res.json()) as VercelResponse<{
    verified: boolean;
    verification?: AddDomainResult['verification'];
  }>;

  if (isError(data)) {
    return { ok: false, verified: false, error: data.error.message };
  }
  return {
    ok: true,
    verified: data.verified,
    verification: data.verification,
  };
}

export async function removeDomain(domain: string): Promise<{ ok: boolean; error?: string }> {
  const cfg = getVercelConfig();
  if (!cfg) return { ok: false, error: 'VERCEL_API_TOKEN ยังไม่ได้ตั้งค่า' };

  const res = await fetch(
    `${BASE}/v9/projects/${cfg.projectId}/domains/${encodeURIComponent(domain)}${teamQuery(cfg)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${cfg.token}` },
    },
  );
  if (res.ok || res.status === 404) return { ok: true };
  const data = (await res.json()) as VercelResponse<unknown>;
  if (isError(data)) return { ok: false, error: data.error.message };
  return { ok: false, error: `HTTP ${res.status}` };
}

/**
 * Friendly DNS instructions for the tenant. We always recommend a
 * CNAME for both apex and subdomain — Vercel supports apex via ALIAS
 * but most consumer DNS providers don't, so we tell users to either
 * use a subdomain OR follow Vercel's apex A record approach.
 */
export function getDnsInstructions(domain: string): {
  type: 'apex' | 'subdomain';
  records: Array<{ type: string; host: string; value: string; ttl?: string }>;
} {
  const isApex = domain.split('.').length === 2;
  if (isApex) {
    return {
      type: 'apex',
      records: [
        { type: 'A', host: '@', value: '76.76.21.21', ttl: '300' },
      ],
    };
  }
  return {
    type: 'subdomain',
    records: [
      {
        type: 'CNAME',
        host: domain.split('.')[0],
        value: 'cname.vercel-dns.com',
        ttl: '300',
      },
    ],
  };
}
