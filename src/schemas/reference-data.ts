/**
 * Reference data Zod schemas for Prime API
 *
 * These are mostly read-only lookup tables used for filtering and categorization
 */

import { z } from 'zod';
import { UuidSchema, PaginationInputSchema } from './common.js';

/**
 * Generic list reference data input schema
 */
export const ListReferenceDataInputSchema = z.object({
  ...PaginationInputSchema.shape,
  is_active: z.boolean().optional().describe('Filter by active status'),
  query: z.string().max(100).optional().describe('Search by name/label')
});

// Job Statuses

/**
 * List job statuses input schema
 */
export const ListJobStatusesInputSchema = z.object({
  ...PaginationInputSchema.shape,
  workflow_id: UuidSchema.optional().describe('Filter by workflow ID'),
  is_active: z.boolean().optional().describe('Filter by active status')
});

/**
 * Get job status input schema
 */
export const GetJobStatusInputSchema = z.object({
  status_id: UuidSchema.describe('The status ID to retrieve')
});

// Perils (Causes of damage)

/**
 * List perils input schema
 */
export const ListPerilsInputSchema = z.object({
  ...PaginationInputSchema.shape,
  is_active: z.boolean().optional().describe('Filter by active status')
});

/**
 * Get peril input schema
 */
export const GetPerilInputSchema = z.object({
  peril_id: UuidSchema.describe('The peril ID to retrieve')
});

// Trades

/**
 * List trades input schema
 */
export const ListTradesInputSchema = z.object({
  ...PaginationInputSchema.shape,
  is_active: z.boolean().optional().describe('Filter by active status')
});

/**
 * Get trade input schema
 */
export const GetTradeInputSchema = z.object({
  trade_id: UuidSchema.describe('The trade ID to retrieve')
});

// Divisions

/**
 * List divisions input schema
 */
export const ListDivisionsInputSchema = z.object({
  ...PaginationInputSchema.shape,
  is_active: z.boolean().optional().describe('Filter by active status'),
  region_id: UuidSchema.optional().describe('Filter by region ID')
});

/**
 * Get division input schema
 */
export const GetDivisionInputSchema = z.object({
  division_id: UuidSchema.describe('The division ID to retrieve')
});

// Users

/**
 * List users input schema
 */
export const ListUsersInputSchema = z.object({
  ...PaginationInputSchema.shape,
  is_active: z.boolean().optional().describe('Filter by active status'),
  division_id: UuidSchema.optional().describe('Filter by division ID'),
  role: z.string().optional().describe('Filter by role')
});

/**
 * Get user input schema
 */
export const GetUserInputSchema = z.object({
  user_id: UuidSchema.describe('The user ID to retrieve')
});

// Regions

/**
 * List regions input schema
 */
export const ListRegionsInputSchema = z.object({
  ...PaginationInputSchema.shape,
  is_active: z.boolean().optional().describe('Filter by active status')
});

// Job Types

/**
 * List job types input schema
 */
export const ListJobTypesInputSchema = z.object({
  ...PaginationInputSchema.shape,
  is_active: z.boolean().optional().describe('Filter by active status')
});

// Workflows

/**
 * List workflows input schema
 */
export const ListWorkflowsInputSchema = z.object({
  ...PaginationInputSchema.shape,
  is_active: z.boolean().optional().describe('Filter by active status')
});

// Catastrophe Codes

/**
 * List catastrophe codes input schema
 */
export const ListCatastropheCodesInputSchema = z.object({
  ...PaginationInputSchema.shape,
  is_active: z.boolean().optional().describe('Filter by active status')
});

// Allocation Statuses

/**
 * List allocation statuses input schema
 */
export const ListAllocationStatusesInputSchema = z.object({
  ...PaginationInputSchema.shape
});

// Filter Tags

/**
 * List filter tags input schema
 */
export const ListFilterTagsInputSchema = z.object({
  ...PaginationInputSchema.shape,
  filter_type_id: UuidSchema.optional().describe('Filter by filter type ID')
});

// Filter Types

/**
 * List filter types input schema
 */
export const ListFilterTypesInputSchema = z.object({
  ...PaginationInputSchema.shape
});

// Milestones

/**
 * List milestones input schema
 */
export const ListMilestonesInputSchema = z.object({
  ...PaginationInputSchema.shape,
  workflow_id: UuidSchema.optional().describe('Filter by workflow ID')
});

// Custom Fields

/**
 * List custom fields input schema
 */
export const ListCustomFieldsInputSchema = z.object({
  ...PaginationInputSchema.shape,
  entity_type: z.enum(['job', 'contact', 'allocation']).optional().describe('Filter by entity type')
});

// Reserve Categories

/**
 * List reserve categories input schema
 */
export const ListReserveCategoriesInputSchema = z.object({
  ...PaginationInputSchema.shape
});

// Type exports
export type ListJobStatusesInput = z.infer<typeof ListJobStatusesInputSchema>;
export type ListPerilsInput = z.infer<typeof ListPerilsInputSchema>;
export type ListTradesInput = z.infer<typeof ListTradesInputSchema>;
export type ListDivisionsInput = z.infer<typeof ListDivisionsInputSchema>;
export type ListUsersInput = z.infer<typeof ListUsersInputSchema>;
