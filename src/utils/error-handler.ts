/**
 * Error handling utilities for MCP tool responses
 *
 * Formats errors into consistent MCP-compatible responses
 */

import { PrimeApiError } from '../client/prime-client.js';
import { RateLimitError } from '../client/rate-limiter.js';
import { z } from 'zod';

export interface ErrorResponse {
  error: true;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryAfter?: number;
}

export interface McpErrorResult {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
}

/**
 * Format any error into an MCP tool result
 */
export function formatError(error: unknown): McpErrorResult {
  const errorResponse = classifyError(error);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(errorResponse, null, 2)
    }],
    isError: true
  };
}

/**
 * Classify and format an error into a consistent structure
 */
export function classifyError(error: unknown): ErrorResponse {
  // Rate limit errors
  if (error instanceof RateLimitError) {
    return {
      error: true,
      code: 'RATE_LIMITED',
      message: error.message,
      retryAfter: error.retryAfter
    };
  }

  // Prime API errors
  if (error instanceof PrimeApiError) {
    return {
      error: true,
      code: error.code,
      message: error.message,
      details: error.details
    };
  }

  // Zod validation errors
  if (error instanceof z.ZodError) {
    const fieldErrors = error.errors.reduce((acc, err) => {
      const path = err.path.join('.');
      acc[path] = err.message;
      return acc;
    }, {} as Record<string, string>);

    return {
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Invalid input parameters',
      details: { fields: fieldErrors }
    };
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      error: true,
      code: 'NETWORK_ERROR',
      message: 'Failed to connect to Prime API. Check your network connection.'
    };
  }

  // Generic errors
  if (error instanceof Error) {
    return {
      error: true,
      code: 'INTERNAL_ERROR',
      message: error.message
    };
  }

  // Unknown errors
  return {
    error: true,
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred'
  };
}

/**
 * Format a successful result with optional pagination
 */
export function formatSuccess<T>(
  data: T,
  pagination?: {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  }
): { content: Array<{ type: 'text'; text: string }> } {
  const result: { data: T; pagination?: typeof pagination } = { data };

  if (pagination) {
    result.pagination = pagination;
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}

/**
 * Format a simple message response
 */
export function formatMessage(message: string): { content: Array<{ type: 'text'; text: string }> } {
  return {
    content: [{
      type: 'text',
      text: message
    }]
  };
}
