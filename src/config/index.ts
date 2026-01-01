/**
 * Configuration management for Prime MCP Server
 *
 * Loads configuration from environment variables with validation
 * Supports OAuth2 password grant authentication
 */

import { z } from 'zod';

const ConfigSchema = z.object({
  // API URLs
  primeApiUrl: z.string().url().default('https://www.primeeco.tech/api.prime/v2'),
  primeOAuthUrl: z.string().url().default('https://www.primeeco.tech/api.prime/v2/oauth/token'),

  // OAuth2 credentials
  clientId: z.string().min(1, 'PRIME_CLIENT_ID is required'),
  clientSecret: z.string().min(1, 'PRIME_CLIENT_SECRET is required'),
  username: z.string().min(1, 'PRIME_USERNAME is required'),
  password: z.string().min(1, 'PRIME_PASSWORD is required'),

  // Optional settings
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

export type Config = z.infer<typeof ConfigSchema>;

let configInstance: Config | null = null;

/**
 * Load and validate configuration from environment
 */
export function loadConfig(): Config {
  if (configInstance) {
    return configInstance;
  }

  const result = ConfigSchema.safeParse({
    primeApiUrl: process.env.PRIME_API_URL,
    primeOAuthUrl: process.env.PRIME_OAUTH_URL,
    clientId: process.env.PRIME_CLIENT_ID,
    clientSecret: process.env.PRIME_CLIENT_SECRET,
    username: process.env.PRIME_USERNAME,
    password: process.env.PRIME_PASSWORD,
    logLevel: process.env.LOG_LEVEL
  });

  if (!result.success) {
    const errors = result.error.errors
      .map(e => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    console.error('Configuration error:\n' + errors);
    console.error('\nRequired environment variables:');
    console.error('  PRIME_CLIENT_ID     - OAuth2 client ID');
    console.error('  PRIME_CLIENT_SECRET - OAuth2 client secret');
    console.error('  PRIME_USERNAME      - Your Prime username');
    console.error('  PRIME_PASSWORD      - Your Prime password');
    process.exit(1);
  }

  configInstance = result.data;
  return configInstance;
}

/**
 * Get the current configuration (loads if not already loaded)
 */
export function getConfig(): Config {
  return loadConfig();
}

/**
 * Reset configuration (useful for testing)
 */
export function resetConfig(): void {
  configInstance = null;
}
