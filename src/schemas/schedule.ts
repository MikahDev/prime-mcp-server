/**
 * Schedule-related Zod schemas for Prime API
 */

import { z } from 'zod';
import {
  UuidSchema,
  PaginationInputSchema,
  DateTimeSchema,
  VersionSchema
} from './common.js';

/**
 * Get job schedule input schema
 */
export const GetJobScheduleInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID to get schedule for'),
  includes: z.array(z.string()).optional().describe('Related resources to include: items')
});

/**
 * Get schedule input schema
 */
export const GetScheduleInputSchema = z.object({
  schedule_id: UuidSchema.describe('The schedule ID to retrieve'),
  includes: z.array(z.string()).optional().describe('Related resources to include')
});

/**
 * Create schedule input schema
 */
export const CreateScheduleInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID this schedule belongs to'),
  name: z.string().max(255).optional().describe('Schedule name'),
  description: z.string().max(2000).optional().describe('Schedule description'),
  start_date: DateTimeSchema.optional().describe('Schedule start date'),
  end_date: DateTimeSchema.optional().describe('Schedule end date')
});

/**
 * Update schedule input schema
 */
export const UpdateScheduleInputSchema = z.object({
  schedule_id: UuidSchema.describe('The schedule ID to update'),
  version: VersionSchema.describe('Current version for optimistic locking'),
  name: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
  start_date: DateTimeSchema.optional(),
  end_date: DateTimeSchema.optional()
});

// Schedule Items

/**
 * List schedule items input schema
 */
export const ListScheduleItemsInputSchema = z.object({
  ...PaginationInputSchema.shape,
  job_id: UuidSchema.describe('The job ID to get schedule items for'),
  schedule_id: UuidSchema.optional().describe('Filter by schedule ID'),
  start_after: DateTimeSchema.optional().describe('Filter items starting after this date'),
  start_before: DateTimeSchema.optional().describe('Filter items starting before this date')
});

/**
 * Get schedule item input schema
 */
export const GetScheduleItemInputSchema = z.object({
  schedule_item_id: UuidSchema.describe('The schedule item ID to retrieve')
});

/**
 * Create schedule item input schema
 */
export const CreateScheduleItemInputSchema = z.object({
  schedule_id: UuidSchema.describe('The schedule ID this item belongs to'),
  name: z.string().max(255).describe('Item name/title'),
  description: z.string().max(2000).optional().describe('Item description'),

  // Dates
  start_date: DateTimeSchema.describe('Start date/time'),
  end_date: DateTimeSchema.describe('End date/time'),

  // Assignment
  assigned_id: UuidSchema.optional().describe('Assigned user ID'),
  assigned_contact_id: UuidSchema.optional().describe('Assigned contact ID'),

  // Progress
  progress: z.number().min(0).max(100).default(0).describe('Completion percentage'),

  // Dependencies
  depends_on: z.array(UuidSchema).optional().describe('IDs of schedule items this depends on')
});

/**
 * Update schedule item input schema
 */
export const UpdateScheduleItemInputSchema = z.object({
  schedule_item_id: UuidSchema.describe('The schedule item ID to update'),
  version: VersionSchema.describe('Current version for optimistic locking'),

  name: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
  start_date: DateTimeSchema.optional(),
  end_date: DateTimeSchema.optional(),
  assigned_id: UuidSchema.optional(),
  assigned_contact_id: UuidSchema.optional(),
  progress: z.number().min(0).max(100).optional()
});

/**
 * Delete schedule item input schema
 */
export const DeleteScheduleItemInputSchema = z.object({
  schedule_item_id: UuidSchema.describe('The schedule item ID to delete')
});

/**
 * Create schedule item link input schema
 */
export const CreateScheduleItemLinkInputSchema = z.object({
  predecessor_id: UuidSchema.describe('The predecessor schedule item ID'),
  successor_id: UuidSchema.describe('The successor schedule item ID'),
  link_type: z.enum(['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'])
    .default('finish_to_start')
    .describe('Type of dependency link')
});

/**
 * Delete schedule item link input schema
 */
export const DeleteScheduleItemLinkInputSchema = z.object({
  predecessor_id: UuidSchema.describe('The predecessor schedule item ID'),
  successor_id: UuidSchema.describe('The successor schedule item ID')
});

// Type exports
export type GetJobScheduleInput = z.infer<typeof GetJobScheduleInputSchema>;
export type CreateScheduleItemInput = z.infer<typeof CreateScheduleItemInputSchema>;
export type UpdateScheduleItemInput = z.infer<typeof UpdateScheduleItemInputSchema>;
