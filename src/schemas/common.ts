/**
 * Common Zod schemas used across all Prime API resources
 */

import { z } from 'zod';

/**
 * UUID schema for Prime IDs
 */
export const UuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Pagination input parameters
 */
export const PaginationInputSchema = z.object({
  page: z.number().int().min(1).default(1).describe('Page number (starting from 1)'),
  per_page: z.number().int().min(1).max(100).default(15).describe('Items per page (max 100)')
});

/**
 * Ordering parameters
 */
export const OrderingSchema = z.object({
  order_by: z.string().optional().describe('Field to order by (e.g., "createdAt", "updatedAt")'),
  order_dir: z.enum(['ASC', 'DESC']).default('DESC').describe('Sort direction')
});

/**
 * Date/time string schema (ISO 8601)
 */
export const DateTimeSchema = z.string().datetime({ offset: true }).or(
  z.string().regex(/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/, 'Invalid date format. Use ISO 8601 or YYYY-MM-DD HH:MM:SS')
);

/**
 * Date only schema (YYYY-MM-DD)
 */
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD');

/**
 * Address schema
 */
export const AddressSchema = z.object({
  street_address: z.string().max(255).optional().describe('Street address'),
  suburb: z.string().max(100).optional().describe('Suburb/city'),
  state: z.string().max(50).optional().describe('State/province'),
  postcode: z.string().max(20).optional().describe('Postal/ZIP code'),
  country: z.string().max(100).optional().describe('Country'),
  latitude: z.number().min(-90).max(90).optional().describe('Latitude coordinate'),
  longitude: z.number().min(-180).max(180).optional().describe('Longitude coordinate')
});

/**
 * Version for optimistic locking (epoch timestamp)
 */
export const VersionSchema = z.number().int().positive().describe('Version number for optimistic locking (epoch timestamp)');

/**
 * Phone number schema (flexible format)
 */
export const PhoneSchema = z.string().max(30).optional().describe('Phone number');

/**
 * Email schema
 */
export const EmailSchema = z.string().email('Invalid email format').max(255);

/**
 * Currency amount (decimal)
 */
export const CurrencySchema = z.number().describe('Currency amount');

/**
 * Positive currency amount
 */
export const PositiveCurrencySchema = z.number().min(0).describe('Currency amount (must be >= 0)');

/**
 * Response format option
 */
export const ResponseFormatSchema = z.enum(['json', 'markdown']).default('json').describe('Output format');

/**
 * Base output schema with ID
 */
export const BaseResourceSchema = z.object({
  id: UuidSchema,
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  version: z.number().optional()
});

/**
 * Pagination output in responses
 */
export const PaginationOutputSchema = z.object({
  total: z.number().describe('Total number of items'),
  count: z.number().describe('Number of items in this response'),
  per_page: z.number().describe('Items per page'),
  current_page: z.number().describe('Current page number'),
  total_pages: z.number().describe('Total number of pages')
});

/**
 * Standard list response wrapper
 */
export function createListResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    pagination: PaginationOutputSchema.optional()
  });
}

/**
 * Filter tag schema
 */
export const FilterTagSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  colour: z.string().optional()
});

/**
 * Common includes for API requests
 */
export const IncludesSchema = z.array(z.string()).optional().describe('Related resources to include in response');
