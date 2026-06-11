import { describe, expect, it, vi } from 'vitest';
import { buildStoredSession } from './session';

function encodeJwtPayload(payload: Record<string, unknown>) {
  const base64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `header.${base64}.signature`;
}

describe('session helpers', () => {
  it('builds a session from login response and JWT payload', () => {
    vi.stubGlobal('window', {
      atob: (value: string) => Buffer.from(value, 'base64').toString('binary'),
    });

    const token = encodeJwtPayload({
      sub: 'user_123',
      orgId: 'org_456',
      role: 'admin',
      exp: 4102444800,
    });

    expect(buildStoredSession({ token, userId: 'user_123', orgId: 'org_456' }, 'admin@example.com')).toEqual({
      token,
      exp: 4102444800,
      user: {
        userId: 'user_123',
        orgId: 'org_456',
        role: 'admin',
        email: 'admin@example.com',
        isSuperadmin: false,
      },
    });
  });
});
