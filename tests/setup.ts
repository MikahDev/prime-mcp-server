/**
 * Test setup and utilities
 */

import { vi } from 'vitest';

// Mock environment variables for OAuth2
process.env.PRIME_CLIENT_ID = 'test-client-id';
process.env.PRIME_CLIENT_SECRET = 'test-client-secret';
process.env.PRIME_USERNAME = 'test-user';
process.env.PRIME_PASSWORD = 'test-password';
process.env.PRIME_API_URL = 'https://api.test.primeeco.tech/api.prime/v2';
process.env.PRIME_OAUTH_URL = 'https://api.test.primeeco.tech/api.prime/v2/oauth/token';

// Reset modules before each test
beforeEach(() => {
  vi.resetModules();
});
