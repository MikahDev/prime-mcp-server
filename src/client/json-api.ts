/**
 * JSON:API response types and utilities for Prime API
 *
 * Prime API uses JSON:API specification with:
 * - Content-Type: application/vnd.api.v2+json
 * - Standard data/attributes/relationships structure
 * - Pagination in meta.pagination
 */

export interface JsonApiResource<T = Record<string, unknown>> {
  type: string;
  id: string;
  attributes: T;
  relationships?: Record<string, JsonApiRelationship>;
  links?: Record<string, string>;
}

export interface JsonApiRelationship {
  data: JsonApiResourceIdentifier | JsonApiResourceIdentifier[] | null;
  links?: Record<string, string>;
}

export interface JsonApiResourceIdentifier {
  type: string;
  id: string;
}

export interface JsonApiPagination {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
}

export interface JsonApiLinks {
  self?: string;
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
}

export interface JsonApiResponse<T = Record<string, unknown>> {
  data: JsonApiResource<T> | JsonApiResource<T>[];
  meta?: {
    pagination?: JsonApiPagination;
  };
  links?: JsonApiLinks;
  included?: JsonApiResource[];
}

export interface JsonApiError {
  id?: string;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
}

export interface JsonApiErrorResponse {
  errors: JsonApiError[];
}

/**
 * Parse raw API response into typed JsonApiResponse
 */
export function parseJsonApiResponse<T>(raw: unknown): JsonApiResponse<T> {
  return raw as JsonApiResponse<T>;
}

/**
 * Extract data from a single resource response, flattening attributes
 */
export function extractSingleResource<T>(response: JsonApiResponse<T>): T & { id: string; type: string } {
  if (Array.isArray(response.data)) {
    throw new Error('Expected single resource but got array');
  }

  return {
    id: response.data.id,
    type: response.data.type,
    ...response.data.attributes
  } as T & { id: string; type: string };
}

/**
 * Extract data from a list response, flattening attributes
 */
export function extractResourceList<T>(response: JsonApiResponse<T>): Array<T & { id: string; type: string }> {
  if (!Array.isArray(response.data)) {
    throw new Error('Expected array but got single resource');
  }

  return response.data.map(item => ({
    id: item.id,
    type: item.type,
    ...item.attributes
  })) as Array<T & { id: string; type: string }>;
}

/**
 * Extract pagination info from response
 */
export function extractPagination(response: JsonApiResponse<unknown>): JsonApiPagination | null {
  return response.meta?.pagination ?? null;
}

/**
 * Extract included resources by type
 */
export function extractIncluded<T>(
  response: JsonApiResponse<unknown>,
  type: string
): Array<T & { id: string; type: string }> {
  if (!response.included) {
    return [];
  }

  return response.included
    .filter(item => item.type === type)
    .map(item => ({
      id: item.id,
      type: item.type,
      ...item.attributes
    })) as Array<T & { id: string; type: string }>;
}

/**
 * Find a related resource by ID from included array
 */
export function findIncludedById<T>(
  response: JsonApiResponse<unknown>,
  type: string,
  id: string
): (T & { id: string; type: string }) | null {
  if (!response.included) {
    return null;
  }

  const found = response.included.find(item => item.type === type && item.id === id);
  if (!found) {
    return null;
  }

  return {
    id: found.id,
    type: found.type,
    ...found.attributes
  } as T & { id: string; type: string };
}

/**
 * Build JSON:API request body for create/update operations
 */
export function buildJsonApiBody(
  type: string,
  attributes: Record<string, unknown>,
  id?: string
): { data: { type: string; id?: string; attributes: Record<string, unknown> } } {
  const body: { data: { type: string; id?: string; attributes: Record<string, unknown> } } = {
    data: {
      type,
      attributes
    }
  };

  if (id) {
    body.data.id = id;
  }

  return body;
}

/**
 * Build JSON:API relationship update body
 */
export function buildRelationshipBody(
  type: string,
  id: string
): { data: { type: string; id: string } } {
  return {
    data: { type, id }
  };
}

/**
 * Check if response is an error response
 */
export function isErrorResponse(response: unknown): response is JsonApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'errors' in response &&
    Array.isArray((response as JsonApiErrorResponse).errors)
  );
}

/**
 * Extract error messages from error response
 */
export function extractErrorMessages(response: JsonApiErrorResponse): string[] {
  return response.errors.map(error => error.detail || error.title || 'Unknown error');
}
