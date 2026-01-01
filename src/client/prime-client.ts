/**
 * Prime API HTTP Client
 *
 * Handles all HTTP communication with the Prime API including:
 * - OAuth2 authentication (password grant)
 * - Automatic token refresh
 * - Rate limiting (60/min, 5000/day, 5 concurrent)
 * - JSON:API request/response formatting
 * - Error handling and classification
 */

import { RateLimiter, RateLimitError, type RateLimitStatus } from './rate-limiter.js';
import { OAuthClient, OAuthError, getOAuthClient } from './oauth.js';
import {
  parseJsonApiResponse,
  isErrorResponse,
  extractErrorMessages,
  type JsonApiResponse
} from './json-api.js';
import { getConfig } from '../config/index.js';

export interface PrimeRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown>;
  retryOnAuthError?: boolean;
}

export class PrimeApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PrimeApiError';
  }
}

export class PrimeClient {
  private readonly baseUrl: string;
  private readonly rateLimiter: RateLimiter;
  private readonly oauthClient: OAuthClient;

  constructor() {
    const config = getConfig();
    this.baseUrl = config.primeApiUrl;
    this.rateLimiter = new RateLimiter();
    this.oauthClient = getOAuthClient();
  }

  /**
   * Make an authenticated request to the Prime API
   */
  async request<T>(options: PrimeRequestOptions): Promise<JsonApiResponse<T>> {
    await this.rateLimiter.acquire();

    try {
      // Get access token (will refresh if needed)
      const accessToken = await this.oauthClient.getAccessToken();

      const url = this.buildUrl(options.endpoint, options.query);

      const response = await fetch(url, {
        method: options.method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.api.v2+json',
          'Content-Type': 'application/json'
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      // Update rate limiter from response headers
      this.rateLimiter.updateFromHeaders(response.headers);

      // Handle 401 with token refresh retry
      if (response.status === 401 && options.retryOnAuthError !== false) {
        console.error('Received 401, refreshing OAuth token and retrying...');
        await this.oauthClient.refreshToken();
        return this.request({ ...options, retryOnAuthError: false });
      }

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return { data: [] } as JsonApiResponse<T>;
      }

      const data = await response.json();

      // Check for JSON:API error format
      if (isErrorResponse(data)) {
        const messages = extractErrorMessages(data);
        throw new PrimeApiError(
          messages.join('; '),
          'VALIDATION_ERROR',
          response.status,
          { errors: data.errors }
        );
      }

      return parseJsonApiResponse<T>(data);
    } catch (error) {
      // Re-throw OAuth errors with proper context
      if (error instanceof OAuthError) {
        throw new PrimeApiError(
          error.message,
          'AUTH_ERROR',
          error.statusCode || 401
        );
      }
      throw error;
    } finally {
      this.rateLimiter.release();
    }
  }

  /**
   * Convenience method for GET requests
   */
  async get<T>(
    endpoint: string,
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<JsonApiResponse<T>> {
    return this.request<T>({ method: 'GET', endpoint, query });
  }

  /**
   * Convenience method for POST requests
   */
  async post<T>(
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<JsonApiResponse<T>> {
    return this.request<T>({ method: 'POST', endpoint, body });
  }

  /**
   * Convenience method for PUT requests
   */
  async put<T>(
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<JsonApiResponse<T>> {
    return this.request<T>({ method: 'PUT', endpoint, body });
  }

  /**
   * Convenience method for PATCH requests
   */
  async patch<T>(
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<JsonApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', endpoint, body });
  }

  /**
   * Convenience method for DELETE requests
   */
  async delete<T>(endpoint: string): Promise<JsonApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', endpoint });
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(
    endpoint: string,
    query?: Record<string, string | number | boolean | undefined>
  ): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = new URL(`${this.baseUrl}/${cleanEndpoint}`);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Handle HTTP error responses
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    const status = response.status;
    let message = `Prime API error: ${status} ${response.statusText}`;
    let details: Record<string, unknown> | undefined;

    try {
      const errorBody: unknown = await response.json();

      if (isErrorResponse(errorBody)) {
        message = extractErrorMessages(errorBody).join('; ');
        details = { errors: errorBody.errors };
      } else if (typeof errorBody === 'object' && errorBody !== null && 'message' in errorBody) {
        message = String((errorBody as { message: unknown }).message);
      }
    } catch {
      // Use default message if body parsing fails
    }

    switch (status) {
      case 401:
        throw new PrimeApiError(
          'Authentication failed. Check your OAuth credentials.',
          'UNAUTHORIZED',
          status
        );
      case 403:
        throw new PrimeApiError(
          'Permission denied for this operation.',
          'FORBIDDEN',
          status
        );
      case 404:
        throw new PrimeApiError(
          'Resource not found.',
          'NOT_FOUND',
          status
        );
      case 422:
        throw new PrimeApiError(
          `Validation failed: ${message}`,
          'VALIDATION_ERROR',
          status,
          details
        );
      case 429:
        const retryAfter = response.headers.get('retry-after');
        const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        throw new RateLimitError(
          'Prime API rate limit exceeded. Please wait before retrying.',
          retrySeconds
        );
      case 500:
      case 502:
      case 503:
      case 504:
        throw new PrimeApiError(
          `Server error: ${message}`,
          'SERVER_ERROR',
          status
        );
      default:
        throw new PrimeApiError(message, 'API_ERROR', status, details);
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): RateLimitStatus {
    return this.rateLimiter.getStatus();
  }

  /**
   * Check if approaching rate limits
   */
  isNearRateLimit(): boolean {
    return this.rateLimiter.isNearLimit();
  }

  /**
   * Get OAuth token info
   */
  getTokenInfo(): { hasToken: boolean; expiresIn: number | null } {
    return this.oauthClient.getTokenInfo();
  }
}

// Singleton instance
let clientInstance: PrimeClient | null = null;

/**
 * Get the singleton PrimeClient instance
 */
export function getPrimeClient(): PrimeClient {
  if (!clientInstance) {
    clientInstance = new PrimeClient();
  }
  return clientInstance;
}

/**
 * Reset the client instance (useful for testing)
 */
export function resetPrimeClient(): void {
  clientInstance = null;
}
