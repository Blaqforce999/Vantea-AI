import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isTrustedOrigin } from '@/lib/csrf';

function req(headers: Record<string, string>): Request {
  return new Request('https://example.test/api', { method: 'POST', headers });
}

describe('isTrustedOrigin', () => {
  it('accepts a matching Origin', () => {
    assert.equal(isTrustedOrigin(req({ origin: 'https://app.vantea.io', host: 'app.vantea.io' })), true);
  });

  it('rejects a cross-site Origin', () => {
    assert.equal(isTrustedOrigin(req({ origin: 'https://evil.com', host: 'app.vantea.io' })), false);
  });

  it('prefers x-forwarded-host over host behind a proxy', () => {
    assert.equal(
      isTrustedOrigin(req({ origin: 'https://app.vantea.io', host: 'internal', 'x-forwarded-host': 'app.vantea.io' })),
      true,
    );
  });

  it('falls back to Referer when Origin is absent', () => {
    assert.equal(isTrustedOrigin(req({ referer: 'https://app.vantea.io/dashboard', host: 'app.vantea.io' })), true);
    assert.equal(isTrustedOrigin(req({ referer: 'https://evil.com/x', host: 'app.vantea.io' })), false);
  });

  it('rejects when neither Origin nor Referer is present', () => {
    assert.equal(isTrustedOrigin(req({ host: 'app.vantea.io' })), false);
  });

  it('rejects when Host is missing', () => {
    assert.equal(isTrustedOrigin(req({ origin: 'https://app.vantea.io' })), false);
  });

  it('rejects a malformed Origin', () => {
    assert.equal(isTrustedOrigin(req({ origin: 'not-a-url', host: 'app.vantea.io' })), false);
  });
});
