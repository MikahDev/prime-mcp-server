/**
 * Contact-related Zod schemas for Prime API
 */

import { z } from 'zod';
import {
  UuidSchema,
  PaginationInputSchema,
  OrderingSchema,
  AddressSchema,
  EmailSchema,
  PhoneSchema,
  VersionSchema
} from './common.js';

/**
 * Search contacts input schema
 */
export const SearchContactsInputSchema = z.object({
  ...PaginationInputSchema.shape,
  ...OrderingSchema.shape,
  query: z.string().max(200).optional().describe('Search term for name, email, or phone'),
  name: z.string().max(200).optional().describe('Filter by name (partial match)'),
  email: z.string().max(200).optional().describe('Filter by email (partial match)'),
  phone: z.string().max(50).optional().describe('Filter by phone number (partial match)'),
  is_active: z.boolean().optional().describe('Filter by active status'),
  contact_type_id: UuidSchema.optional().describe('Filter by contact type ID'),
  is_individual: z.boolean().optional().describe('Filter by individual vs organization'),
  includes: z.array(z.string()).optional().describe('Related resources to include: contactType, addresses, licences')
});

/**
 * Get contact input schema
 */
export const GetContactInputSchema = z.object({
  contact_id: UuidSchema.describe('The contact ID to retrieve'),
  includes: z.array(z.string()).optional().describe('Related resources to include')
});

/**
 * Create contact input schema
 */
export const CreateContactInputSchema = z.object({
  // Type
  is_individual: z.boolean().describe('True for individual, false for organization'),

  // Individual fields
  first_name: z.string().max(100).optional().describe('First name (for individuals)'),
  last_name: z.string().max(100).optional().describe('Last name (for individuals)'),
  title: z.string().max(50).optional().describe('Title/salutation (Mr, Mrs, Dr, etc.)'),

  // Organization fields
  name: z.string().max(255).optional().describe('Organization name or full name'),
  trading_name: z.string().max(255).optional().describe('Trading/business name'),
  abn: z.string().max(20).optional().describe('Australian Business Number'),
  acn: z.string().max(20).optional().describe('Australian Company Number'),

  // Contact details
  email: EmailSchema.optional().describe('Primary email address'),
  mobile_number: PhoneSchema.describe('Mobile phone'),
  home_number: PhoneSchema.describe('Home phone'),
  work_number: PhoneSchema.describe('Work phone'),
  fax_number: PhoneSchema.describe('Fax number'),

  // Address
  address: AddressSchema.optional().describe('Primary address'),

  // Classification
  contact_type_id: UuidSchema.optional().describe('Contact type ID'),

  // Status
  is_active: z.boolean().default(true).describe('Whether contact is active'),

  // Notes
  notes: z.string().max(5000).optional().describe('Internal notes')
});

/**
 * Update contact input schema
 */
export const UpdateContactInputSchema = z.object({
  contact_id: UuidSchema.describe('The contact ID to update'),
  version: VersionSchema.describe('Current version for optimistic locking'),

  // All fields optional for update
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  title: z.string().max(50).optional(),
  name: z.string().max(255).optional(),
  trading_name: z.string().max(255).optional(),
  abn: z.string().max(20).optional(),
  acn: z.string().max(20).optional(),

  email: EmailSchema.optional(),
  mobile_number: PhoneSchema,
  home_number: PhoneSchema,
  work_number: PhoneSchema,
  fax_number: PhoneSchema,

  address: AddressSchema.optional(),
  contact_type_id: UuidSchema.optional(),
  is_active: z.boolean().optional(),
  notes: z.string().max(5000).optional()
});

/**
 * Update contact filter tags input schema
 */
export const UpdateContactFilterTagsInputSchema = z.object({
  contact_id: UuidSchema.describe('The contact ID to update'),
  filter_tag_ids: z.array(UuidSchema).describe('Array of filter tag IDs to assign')
});

// Type exports
export type SearchContactsInput = z.infer<typeof SearchContactsInputSchema>;
export type GetContactInput = z.infer<typeof GetContactInputSchema>;
export type CreateContactInput = z.infer<typeof CreateContactInputSchema>;
export type UpdateContactInput = z.infer<typeof UpdateContactInputSchema>;
