/**
 * Notification-related Zod schemas for Prime API
 */

import { z } from 'zod';
import {
  UuidSchema,
  PaginationInputSchema,
  OrderingSchema,
  DateTimeSchema,
  EmailSchema
} from './common.js';

/**
 * List notifications input schema
 */
export const ListNotificationsInputSchema = z.object({
  ...PaginationInputSchema.shape,
  ...OrderingSchema.shape,
  job_id: UuidSchema.optional().describe('Filter by job ID'),
  template_id: UuidSchema.optional().describe('Filter by notification template ID'),
  sent_after: DateTimeSchema.optional().describe('Filter notifications sent after'),
  sent_before: DateTimeSchema.optional().describe('Filter notifications sent before'),
  includes: z.array(z.string()).optional().describe('Related resources to include: job, template')
});

/**
 * Get notification input schema
 */
export const GetNotificationInputSchema = z.object({
  notification_id: UuidSchema.describe('The notification ID to retrieve'),
  includes: z.array(z.string()).optional().describe('Related resources to include')
});

/**
 * Create notification input schema
 */
export const CreateNotificationInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID this notification is for'),

  // Template or custom content
  template_id: UuidSchema.optional().describe('Notification template ID (use template or custom content)'),

  // Custom content (if not using template)
  subject: z.string().max(255).optional().describe('Notification subject (required if no template)'),
  body: z.string().max(10000).optional().describe('Notification body content (required if no template)'),

  // Recipients
  recipient_emails: z.array(EmailSchema).optional().describe('Email addresses to send to'),
  recipient_contact_ids: z.array(UuidSchema).optional().describe('Contact IDs to send to'),

  // Send options
  send_immediately: z.boolean().default(true).describe('Send immediately or queue for later'),
  scheduled_at: DateTimeSchema.optional().describe('When to send if not immediately'),

  // Attachments
  attachment_ids: z.array(UuidSchema).optional().describe('Attachment IDs to include')
});

// Notification Templates (read-only reference data)

/**
 * List notification templates input schema
 */
export const ListNotificationTemplatesInputSchema = z.object({
  ...PaginationInputSchema.shape,
  ...OrderingSchema.shape,
  is_active: z.boolean().optional().describe('Filter by active status'),
  category: z.string().optional().describe('Filter by template category')
});

/**
 * Get notification template input schema
 */
export const GetNotificationTemplateInputSchema = z.object({
  template_id: UuidSchema.describe('The template ID to retrieve')
});

// Reminder schemas (similar to notifications but for internal reminders)

/**
 * List reminders input schema
 */
export const ListRemindersInputSchema = z.object({
  ...PaginationInputSchema.shape,
  ...OrderingSchema.shape,
  job_id: UuidSchema.optional().describe('Filter by job ID'),
  assigned_id: UuidSchema.optional().describe('Filter by assigned user ID'),
  is_completed: z.boolean().optional().describe('Filter by completion status'),
  due_after: DateTimeSchema.optional().describe('Filter reminders due after'),
  due_before: DateTimeSchema.optional().describe('Filter reminders due before')
});

/**
 * Create reminder input schema
 */
export const CreateReminderInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID this reminder is for'),

  title: z.string().max(255).describe('Reminder title'),
  description: z.string().max(2000).optional().describe('Reminder description'),

  due_at: DateTimeSchema.describe('When the reminder is due'),
  assigned_id: UuidSchema.optional().describe('User ID to assign reminder to'),

  reminder_template_id: UuidSchema.optional().describe('Reminder template ID')
});

/**
 * Update reminder input schema
 */
export const UpdateReminderInputSchema = z.object({
  reminder_id: UuidSchema.describe('The reminder ID to update'),

  title: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
  due_at: DateTimeSchema.optional(),
  assigned_id: UuidSchema.optional(),
  is_completed: z.boolean().optional().describe('Mark reminder as completed')
});

// Type exports
export type ListNotificationsInput = z.infer<typeof ListNotificationsInputSchema>;
export type CreateNotificationInput = z.infer<typeof CreateNotificationInputSchema>;
export type ListNotificationTemplatesInput = z.infer<typeof ListNotificationTemplatesInputSchema>;
