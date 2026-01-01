/**
 * Work Order-related Zod schemas for Prime API
 */

import { z } from 'zod';
import {
  UuidSchema,
  PaginationInputSchema,
  OrderingSchema,
  DateTimeSchema,
  VersionSchema
} from './common.js';

/**
 * List work orders input schema
 */
export const ListWorkOrdersInputSchema = z.object({
  ...PaginationInputSchema.shape,
  ...OrderingSchema.shape,
  job_id: UuidSchema.optional().describe('Filter by job ID'),
  allocation_id: UuidSchema.optional().describe('Filter by allocation ID'),
  assigned_contact_id: UuidSchema.optional().describe('Filter by assigned contact ID'),
  status: z.string().optional().describe('Filter by status'),
  created_after: DateTimeSchema.optional().describe('Filter work orders created after'),
  created_before: DateTimeSchema.optional().describe('Filter work orders created before'),
  includes: z.array(z.string()).optional().describe('Related resources to include: job, allocation, assignedContact')
});

/**
 * Get work order input schema
 */
export const GetWorkOrderInputSchema = z.object({
  work_order_id: UuidSchema.describe('The work order ID to retrieve'),
  includes: z.array(z.string()).optional().describe('Related resources to include')
});

/**
 * Update work order input schema
 */
export const UpdateWorkOrderInputSchema = z.object({
  work_order_id: UuidSchema.describe('The work order ID to update'),
  version: VersionSchema.describe('Current version for optimistic locking'),

  description: z.string().max(2000).optional().describe('Work order description'),
  notes: z.string().max(5000).optional().describe('Internal notes'),
  assigned_contact_id: UuidSchema.optional().describe('Assigned contact ID'),
  status: z.string().max(50).optional().describe('Work order status')
});

/**
 * Update work order filter tags input schema
 */
export const UpdateWorkOrderFilterTagsInputSchema = z.object({
  work_order_id: UuidSchema.describe('The work order ID to update'),
  filter_tag_ids: z.array(UuidSchema).describe('Array of filter tag IDs to assign')
});

// Upstream Work Orders (from external systems)

/**
 * List upstream work orders input schema
 */
export const ListUpstreamWorkOrdersInputSchema = z.object({
  ...PaginationInputSchema.shape,
  ...OrderingSchema.shape,
  job_id: UuidSchema.optional().describe('Filter by job ID'),
  includes: z.array(z.string()).optional().describe('Related resources to include')
});

/**
 * Get upstream work order input schema
 */
export const GetUpstreamWorkOrderInputSchema = z.object({
  work_order_id: UuidSchema.describe('The upstream work order ID to retrieve'),
  includes: z.array(z.string()).optional().describe('Related resources to include')
});

// Type exports
export type ListWorkOrdersInput = z.infer<typeof ListWorkOrdersInputSchema>;
export type GetWorkOrderInput = z.infer<typeof GetWorkOrderInputSchema>;
export type UpdateWorkOrderInput = z.infer<typeof UpdateWorkOrderInputSchema>;
