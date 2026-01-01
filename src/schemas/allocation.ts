/**
 * Allocation-related Zod schemas for Prime API
 *
 * Allocations represent work assignments within a job, such as:
 * - Make Safe
 * - Plumbing Report
 * - Electrical Report
 * - Roof Report
 * - Engineering Report
 * - Assessment Report
 * - Restoration
 * - Quote
 * etc.
 */

import { z } from 'zod';
import {
  UuidSchema,
  PaginationInputSchema,
  OrderingSchema,
  DateTimeSchema,
  VersionSchema,
  PositiveCurrencySchema
} from './common.js';

/**
 * Allocation types supported by Prime
 */
export const AllocationTypeSchema = z.enum([
  'Make Safe',
  'Plumbing Report',
  'Electrical Report',
  'Roof Report',
  'Engineering Report',
  'Assessment Report',
  'Flooring Report',
  'Restoration',
  'Do & Charge',
  'Decontamination',
  'Architecture Design',
  'Work Order',
  'Building Report',
  'Quote',
  'Asbestos Report',
  'PRV Report',
  'Painting'
]).describe('Type of allocation');

/**
 * List allocations input schema
 */
export const ListAllocationsInputSchema = z.object({
  ...PaginationInputSchema.shape,
  ...OrderingSchema.shape,
  job_id: UuidSchema.optional().describe('Filter by job ID'),
  assigned_contact_id: UuidSchema.optional().describe('Filter by assigned contact ID'),
  assigned_id: UuidSchema.optional().describe('Filter by assigned user ID'),
  allocation_status_id: UuidSchema.optional().describe('Filter by allocation status ID'),
  allocation_type: AllocationTypeSchema.optional().describe('Filter by allocation type'),
  completed_after: DateTimeSchema.optional().describe('Filter by completion date after'),
  completed_before: DateTimeSchema.optional().describe('Filter by completion date before'),
  includes: z.array(z.string()).optional().describe('Related resources to include: job, assignedContact, assigned, allocationStatus')
});

/**
 * Get allocation input schema
 */
export const GetAllocationInputSchema = z.object({
  allocation_id: UuidSchema.describe('The allocation ID to retrieve'),
  includes: z.array(z.string()).optional().describe('Related resources to include')
});

/**
 * Create allocation input schema
 */
export const CreateAllocationInputSchema = z.object({
  // Required fields
  job_id: UuidSchema.describe('The job ID this allocation belongs to'),
  allocation_status_id: UuidSchema.describe('Initial allocation status ID'),
  allocation_type: AllocationTypeSchema.describe('Type of allocation'),
  allocation_number: z.string().max(50).describe('Allocation number/reference'),
  label: z.string().max(255).describe('Allocation label/title'),

  // Optional fields
  description: z.string().max(2000).optional().describe('Allocation description'),
  assigned_contact_id: UuidSchema.optional().describe('Assigned contractor/supplier contact ID'),
  assigned_id: UuidSchema.optional().describe('Assigned internal user ID'),
  limit: PositiveCurrencySchema.optional().describe('Budget limit for this allocation'),

  // Dates
  site_attended: DateTimeSchema.optional().describe('Date/time site was attended'),
  completed: DateTimeSchema.optional().describe('Date/time allocation was completed'),
  first_customer_contact_at: DateTimeSchema.optional().describe('Date/time of first customer contact')
});

/**
 * Update allocation input schema
 */
export const UpdateAllocationInputSchema = z.object({
  allocation_id: UuidSchema.describe('The allocation ID to update'),
  version: VersionSchema.describe('Current version for optimistic locking'),

  // Updateable fields
  allocation_status_id: UuidSchema.optional(),
  label: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
  assigned_contact_id: UuidSchema.optional(),
  assigned_id: UuidSchema.optional(),
  limit: PositiveCurrencySchema.optional(),
  site_attended: DateTimeSchema.optional(),
  completed: DateTimeSchema.optional(),
  first_customer_contact_at: DateTimeSchema.optional()
});

/**
 * Update allocation filter tags input schema
 */
export const UpdateAllocationFilterTagsInputSchema = z.object({
  allocation_id: UuidSchema.describe('The allocation ID to update'),
  filter_tag_ids: z.array(UuidSchema).describe('Array of filter tag IDs to assign')
});

// Type exports
export type ListAllocationsInput = z.infer<typeof ListAllocationsInputSchema>;
export type GetAllocationInput = z.infer<typeof GetAllocationInputSchema>;
export type CreateAllocationInput = z.infer<typeof CreateAllocationInputSchema>;
export type UpdateAllocationInput = z.infer<typeof UpdateAllocationInputSchema>;
