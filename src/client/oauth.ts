/**
 * OAuth2 client for Prime API authentication
 *
 * Handles:
 * - OAuth2 password grant token acquisition
 * - Automatic token refresh before expiry
 * - Token caching
 */

import { getConfig } from '../config/index.js';

export interface OAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export class OAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errorCode?: string
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

export class OAuthClient {
  private token: OAuthToken | null = null;
  private tokenExpiresAt: number = 0;
  private refreshPromise: Promise<string> | null = null;

  // Refresh token 5 minutes before expiry
  private readonly REFRESH_BUFFER_MS = 5 * 60 * 1000;

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    // If currently refreshing, wait for that to complete
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Check if we have a valid token
    if (this.token && Date.now() < this.tokenExpiresAt - this.REFRESH_BUFFER_MS) {
      return this.token.access_token;
    }

    // Need to get a new token
    this.refreshPromise = this.acquireToken();

    try {
      const accessToken = await this.refreshPromise;
      return accessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Acquire a new token using password grant
   */
  private async acquireToken(): Promise<string> {
    const config = getConfig();

    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      username: config.username,
      password: config.password
    });

    try {
      const response = await fetch(config.primeOAuthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/vnd.api.v2+json'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `OAuth authentication failed: ${response.status}`;
        let errorCode: string | undefined;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error_description || errorJson.message || errorMessage;
          errorCode = errorJson.error;
        } catch {
          // Use default error message
        }

        throw new OAuthError(errorMessage, response.status, errorCode);
      }

      const tokenData = await response.json() as OAuthToken;

      this.token = tokenData;
      // Calculate expiry time (current time + expires_in seconds)
      this.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);

      console.error(`OAuth token acquired, expires in ${tokenData.expires_in} seconds`);

      return tokenData.access_token;
    } catch (error) {
      if (error instanceof OAuthError) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new OAuthError('Failed to connect to OAuth server. Check your network connection.');
      }

      throw new OAuthError(`OAuth error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Force token refresh (useful after 401 errors)
   */
  async refreshToken(): Promise<string> {
    this.token = null;
    this.tokenExpiresAt = 0;
    return this.getAccessToken();
  }

  /**
   * Check if we have a valid token
   */
  hasValidToken(): boolean {
    return this.token !== null && Date.now() < this.tokenExpiresAt - this.REFRESH_BUFFER_MS;
  }

  /**
   * Get token expiry info
   */
  getTokenInfo(): { hasToken: boolean; expiresIn: number | null } {
    if (!this.token) {
      return { hasToken: false, expiresIn: null };
    }

    const expiresIn = Math.max(0, Math.floor((this.tokenExpiresAt - Date.now()) / 1000));
    return { hasToken: true, expiresIn };
  }

  /**
   * Clear cached token
   */
  clearToken(): void {
    this.token = null;
    this.tokenExpiresAt = 0;
  }
}

// Singleton instance
let oauthClientInstance: OAuthClient | null = null;

/**
 * Get the singleton OAuthClient instance
 */
export function getOAuthClient(): OAuthClient {
  if (!oauthClientInstance) {
    oauthClientInstance = new OAuthClient();
  }
  return oauthClientInstance;
}

/**
 * Reset the OAuth client (useful for testing)
 */
export function resetOAuthClient(): void {
  if (oauthClientInstance) {
    oauthClientInstance.clearToken();
  }
  oauthClientInstance = null;
}
