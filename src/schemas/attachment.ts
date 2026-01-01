/**
 * Attachment-related Zod schemas for Prime API
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
 * List attachments input schema
 */
export const ListAttachmentsInputSchema = z.object({
  ...PaginationInputSchema.shape,
  ...OrderingSchema.shape,
  job_id: UuidSchema.optional().describe('Filter by job ID'),
  allocation_id: UuidSchema.optional().describe('Filter by allocation ID'),
  attachment_type_id: UuidSchema.optional().describe('Filter by attachment type ID'),
  created_after: DateTimeSchema.optional().describe('Filter attachments created after'),
  created_before: DateTimeSchema.optional().describe('Filter attachments created before'),
  includes: z.array(z.string()).optional().describe('Related resources to include: job, attachmentType, uploadedBy')
});

/**
 * Get attachment input schema
 */
export const GetAttachmentInputSchema = z.object({
  attachment_id: UuidSchema.describe('The attachment ID to retrieve'),
  includes: z.array(z.string()).optional().describe('Related resources to include')
});

/**
 * Create attachment input schema
 */
export const CreateAttachmentInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID this attachment belongs to'),
  attachment_type_id: UuidSchema.optional().describe('Attachment type ID'),

  // File info (for URL-based uploads)
  file_name: z.string().max(255).describe('Original file name'),
  file_url: z.string().url().optional().describe('URL of the file (if already uploaded)'),
  file_size: z.number().int().positive().optional().describe('File size in bytes'),
  mime_type: z.string().max(100).optional().describe('MIME type of the file'),

  // Metadata
  title: z.string().max(255).optional().describe('Attachment title/description'),
  description: z.string().max(2000).optional().describe('Detailed description'),
  notes: z.string().max(5000).optional().describe('Internal notes'),

  // Related entities
  allocation_id: UuidSchema.optional().describe('Related allocation ID'),
  estimate_id: UuidSchema.optional().describe('Related estimate ID')
});

/**
 * Update attachment input schema
 */
export const UpdateAttachmentInputSchema = z.object({
  attachment_id: UuidSchema.describe('The attachment ID to update'),
  version: VersionSchema.describe('Current version for optimistic locking'),

  attachment_type_id: UuidSchema.optional(),
  title: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional()
});

// Attachment Types (read-only reference data)

/**
 * List attachment types input schema
 */
export const ListAttachmentTypesInputSchema = z.object({
  ...PaginationInputSchema.shape
});

/**
 * Get attachment type input schema
 */
export const GetAttachmentTypeInputSchema = z.object({
  attachment_type_id: UuidSchema.describe('The attachment type ID to retrieve')
});

// Type exports
export type ListAttachmentsInput = z.infer<typeof ListAttachmentsInputSchema>;
export type GetAttachmentInput = z.infer<typeof GetAttachmentInputSchema>;
export type CreateAttachmentInput = z.infer<typeof CreateAttachmentInputSchema>;
export type UpdateAttachmentInput = z.infer<typeof UpdateAttachmentInputSchema>;
