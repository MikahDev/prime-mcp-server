/**
 * Estimate-related Zod schemas for Prime API
 *
 * Prime has two types of estimates:
 * - Unlocked estimates: Editable, can be modified
 * - Locked estimates (snapshots): Read-only, historical records
 */

import { z } from 'zod';
import {
  UuidSchema,
  PaginationInputSchema,
  OrderingSchema,
  DateTimeSchema,
  VersionSchema,
  CurrencySchema
} from './common.js';

/**
 * List estimates input schema
 */
export const ListEstimatesInputSchema = z.object({
  ...PaginationInputSchema.shape,
  ...OrderingSchema.shape,
  job_id: UuidSchema.optional().describe('Filter by job ID'),
  locked: z.boolean().default(false).describe('If true, fetch locked (snapshot) estimates; otherwise fetch unlocked'),
  created_after: DateTimeSchema.optional().describe('Filter estimates created after this date'),
  created_before: DateTimeSchema.optional().describe('Filter estimates created before this date'),
  includes: z.array(z.string()).optional().describe('Related resources to include: job, categories, items')
});

/**
 * Get estimate input schema
 */
export const GetEstimateInputSchema = z.object({
  estimate_id: UuidSchema.describe('The estimate ID to retrieve'),
  locked: z.boolean().default(false).describe('If true, fetch from locked (snapshot) estimates'),
  includes: z.array(z.string()).optional().describe('Related resources to include')
});

/**
 * Create estimate input schema
 */
export const CreateEstimateInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID this estimate belongs to'),
  name: z.string().max(255).optional().describe('Estimate name/title'),
  description: z.string().max(2000).optional().describe('Estimate description'),
  notes: z.string().max(5000).optional().describe('Internal notes')
});

/**
 * Update estimate input schema
 */
export const UpdateEstimateInputSchema = z.object({
  estimate_id: UuidSchema.describe('The estimate ID to update'),
  version: VersionSchema.describe('Current version for optimistic locking'),
  name: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional()
});

/**
 * Delete estimate input schema
 */
export const DeleteEstimateInputSchema = z.object({
  estimate_id: UuidSchema.describe('The estimate ID to delete')
});

// Estimate Categories

/**
 * List estimate categories input schema
 */
export const ListEstimateCategoriesInputSchema = z.object({
  ...PaginationInputSchema.shape,
  estimate_id: UuidSchema.describe('The estimate ID to get categories for'),
  locked: z.boolean().default(false).describe('If true, fetch from locked estimates')
});

/**
 * Create estimate category input schema
 */
export const CreateEstimateCategoryInputSchema = z.object({
  estimate_id: UuidSchema.describe('The estimate ID to add category to'),
  name: z.string().max(255).describe('Category name'),
  description: z.string().max(2000).optional().describe('Category description'),
  sort_order: z.number().int().min(0).optional().describe('Sort order for display')
});

/**
 * Update estimate category input schema
 */
export const UpdateEstimateCategoryInputSchema = z.object({
  category_id: UuidSchema.describe('The category ID to update'),
  version: VersionSchema.describe('Current version for optimistic locking'),
  name: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
  sort_order: z.number().int().min(0).optional()
});

/**
 * Delete estimate category input schema
 */
export const DeleteEstimateCategoryInputSchema = z.object({
  category_id: UuidSchema.describe('The category ID to delete')
});

// Estimate Items

/**
 * List estimate items input schema
 */
export const ListEstimateItemsInputSchema = z.object({
  ...PaginationInputSchema.shape,
  estimate_id: UuidSchema.optional().describe('Filter by estimate ID'),
  category_id: UuidSchema.optional().describe('Filter by category ID'),
  locked: z.boolean().default(false).describe('If true, fetch from locked estimates')
});

/**
 * Create estimate item input schema
 */
export const CreateEstimateItemInputSchema = z.object({
  estimate_id: UuidSchema.describe('The estimate ID this item belongs to'),
  category_id: UuidSchema.optional().describe('The category ID this item belongs to'),

  // Item details
  description: z.string().max(2000).describe('Item description'),
  quantity: z.number().min(0).default(1).describe('Quantity'),
  unit: z.string().max(50).optional().describe('Unit of measure'),
  unit_price: CurrencySchema.describe('Price per unit'),

  // Optional details
  trade_id: UuidSchema.optional().describe('Trade type ID'),
  notes: z.string().max(2000).optional().describe('Item notes'),
  sort_order: z.number().int().min(0).optional().describe('Sort order for display'),

  // Tax
  is_taxable: z.boolean().default(true).describe('Whether item is taxable'),
  tax_rate: z.number().min(0).max(100).optional().describe('Tax rate percentage')
});

/**
 * Update estimate item input schema
 */
export const UpdateEstimateItemInputSchema = z.object({
  item_id: UuidSchema.describe('The item ID to update'),
  version: VersionSchema.describe('Current version for optimistic locking'),

  category_id: UuidSchema.optional(),
  description: z.string().max(2000).optional(),
  quantity: z.number().min(0).optional(),
  unit: z.string().max(50).optional(),
  unit_price: CurrencySchema.optional(),
  trade_id: UuidSchema.optional(),
  notes: z.string().max(2000).optional(),
  sort_order: z.number().int().min(0).optional(),
  is_taxable: z.boolean().optional(),
  tax_rate: z.number().min(0).max(100).optional()
});

/**
 * Delete estimate item input schema
 */
export const DeleteEstimateItemInputSchema = z.object({
  item_id: UuidSchema.describe('The item ID to delete')
});

// Type exports
export type ListEstimatesInput = z.infer<typeof ListEstimatesInputSchema>;
export type GetEstimateInput = z.infer<typeof GetEstimateInputSchema>;
export type CreateEstimateInput = z.infer<typeof CreateEstimateInputSchema>;
export type UpdateEstimateInput = z.infer<typeof UpdateEstimateInputSchema>;
export type CreateEstimateItemInput = z.infer<typeof CreateEstimateItemInputSchema>;
export type UpdateEstimateItemInput = z.infer<typeof UpdateEstimateItemInputSchema>;
