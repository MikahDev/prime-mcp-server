/**
 * Job-related Zod schemas for Prime API
 */

import { z } from 'zod';
import {
  UuidSchema,
  PaginationInputSchema,
  OrderingSchema,
  AddressSchema,
  DateSchema,
  DateTimeSchema,
  VersionSchema,
  EmailSchema,
  PhoneSchema,
  PositiveCurrencySchema
} from './common.js';

/**
 * Customer schema for job creation
 */
export const CustomerInputSchema = z.object({
  is_individual: z.boolean().describe('True for individual, false for organization'),
  first_name: z.string().max(100).optional().describe('First name (for individuals)'),
  last_name: z.string().max(100).optional().describe('Last name (for individuals)'),
  name: z.string().max(255).optional().describe('Organization name'),
  email: EmailSchema.optional().describe('Contact email'),
  mobile_number: PhoneSchema.describe('Mobile phone'),
  home_number: PhoneSchema.describe('Home phone'),
  work_number: PhoneSchema.describe('Work phone')
});

/**
 * Search jobs input schema
 */
export const SearchJobsInputSchema = z.object({
  ...PaginationInputSchema.shape,
  ...OrderingSchema.shape,
  query: z.string().max(200).optional().describe('Search term for job number, client reference, or description'),
  status_id: UuidSchema.optional().describe('Filter by job status ID'),
  division_id: UuidSchema.optional().describe('Filter by division ID'),
  assigned_id: UuidSchema.optional().describe('Filter by assigned user ID'),
  client_id: UuidSchema.optional().describe('Filter by client (insurer) ID'),
  customer_id: UuidSchema.optional().describe('Filter by customer ID'),
  peril_id: UuidSchema.optional().describe('Filter by peril type ID'),
  job_type_id: UuidSchema.optional().describe('Filter by job type ID'),
  workflow_id: UuidSchema.optional().describe('Filter by workflow ID'),
  catastrophe_code_id: UuidSchema.optional().describe('Filter by catastrophe code ID'),
  created_after: DateTimeSchema.optional().describe('Filter jobs created after this date (ISO 8601)'),
  created_before: DateTimeSchema.optional().describe('Filter jobs created before this date (ISO 8601)'),
  updated_after: DateTimeSchema.optional().describe('Filter jobs updated after this date (ISO 8601)'),
  incident_after: DateSchema.optional().describe('Filter by incident date after (YYYY-MM-DD)'),
  incident_before: DateSchema.optional().describe('Filter by incident date before (YYYY-MM-DD)'),
  includes: z.array(z.string()).optional().describe('Related resources to include: status, division, assigned, customer, client, peril, jobType, workflow')
});

/**
 * Search jobs by address - iterates through all pages to find matching addresses
 */
export const SearchJobsByAddressInputSchema = z.object({
  street: z.string().max(200).optional().describe('Street name to search for (partial match)'),
  suburb: z.string().max(100).optional().describe('Suburb/city to search for (partial match)'),
  state: z.string().max(50).optional().describe('State to filter by (e.g., VIC, NSW, QLD)'),
  postcode: z.string().max(20).optional().describe('Postcode to filter by'),
  max_pages: z.number().int().min(1).max(100).default(50).optional().describe('Maximum pages to search (default 50, each page has 100 jobs)'),
  includes: z.array(z.string()).optional().describe('Related resources to include: status, division, customer, client')
});

/**
 * Search jobs by customer name - finds customer first, then their jobs
 */
export const SearchJobsByCustomerInputSchema = z.object({
  customer_name: z.string().min(1).max(200).describe('Customer name to search for'),
  includes: z.array(z.string()).optional().describe('Related resources to include with jobs')
});

/**
 * Get job input schema
 */
export const GetJobInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID to retrieve'),
  includes: z.array(z.string()).optional().describe('Related resources to include')
});

/**
 * Create job input schema
 */
export const CreateJobInputSchema = z.object({
  // Required fields
  workflow_id: UuidSchema.describe('Workflow ID for the job'),
  status_id: UuidSchema.describe('Initial status ID'),
  client_id: UuidSchema.describe('Client (insurer) ID'),

  // Optional identifiers
  job_number: z.string().max(50).optional().describe('Job number (auto-generated if not provided)'),
  client_reference: z.string().max(100).optional().describe('Client/insurer reference number'),
  additional_reference: z.string().max(100).optional().describe('Additional reference number'),

  // Job details
  description: z.string().max(2000).optional().describe('Job description'),
  notes: z.string().max(5000).optional().describe('Internal notes'),

  // Classifications
  division_id: UuidSchema.optional().describe('Division ID'),
  job_type_id: UuidSchema.optional().describe('Job type ID'),
  peril_id: UuidSchema.optional().describe('Peril type ID'),
  catastrophe_code_id: UuidSchema.optional().describe('Catastrophe code ID'),

  // Assignments
  assigned_id: UuidSchema.optional().describe('Assigned user ID'),
  case_manager_id: UuidSchema.optional().describe('Case manager user ID'),
  supervisor_id: UuidSchema.optional().describe('Supervisor user ID'),
  estimator_id: UuidSchema.optional().describe('Estimator user ID'),

  // Customer (either ID or new customer details)
  customer_id: UuidSchema.optional().describe('Existing customer contact ID'),
  customer: CustomerInputSchema.optional().describe('New customer details (if not using customer_id)'),

  // Financial
  excess_amount: PositiveCurrencySchema.optional().describe('Excess/deductible amount'),

  // Dates
  incident_date: DateSchema.optional().describe('Date of incident (YYYY-MM-DD)'),

  // Location
  address: AddressSchema.optional().describe('Job site address')
});

/**
 * Update job input schema
 */
export const UpdateJobInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID to update'),
  version: VersionSchema.describe('Current version for optimistic locking'),

  // Updateable fields
  client_reference: z.string().max(100).optional(),
  additional_reference: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional(),

  division_id: UuidSchema.optional(),
  job_type_id: UuidSchema.optional(),
  peril_id: UuidSchema.optional(),
  catastrophe_code_id: UuidSchema.optional(),

  assigned_id: UuidSchema.optional(),
  case_manager_id: UuidSchema.optional(),
  supervisor_id: UuidSchema.optional(),
  estimator_id: UuidSchema.optional(),

  excess_amount: PositiveCurrencySchema.optional(),
  incident_date: DateSchema.optional(),
  address: AddressSchema.optional()
});

/**
 * Update job status input schema
 */
export const UpdateJobStatusInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID to update'),
  status_id: UuidSchema.describe('New status ID')
});

/**
 * Update job custom fields input schema
 */
export const UpdateJobCustomFieldsInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID to update'),
  custom_fields: z.record(z.string(), z.unknown()).describe('Custom field values as key-value pairs')
});

/**
 * Get job history input schema
 */
export const GetJobHistoryInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID to get history for'),
  ...PaginationInputSchema.shape
});

/**
 * Get job reserve transactions input schema
 */
export const GetJobReserveTransactionsInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID to get reserve transactions for')
});

/**
 * Sync job to Easybuild input schema
 */
export const SyncJobToEasybuildInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID to sync')
});

/**
 * Get job allocation summary - work orders grouped by trade
 */
export const GetJobAllocationSummaryInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID to get allocation summary for'),
  include_cancelled: z.boolean().default(false).optional().describe('Include cancelled work orders (default: false)'),
  status_filter: z.array(z.string()).optional().describe('Filter by work order statuses (e.g., ["Locked", "Draft"])')
});

/**
 * Get job trade comparison - WO vs Authorized Estimates by trade
 */
export const GetJobTradeComparisonInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID to compare'),
  wo_statuses: z.array(z.string()).default(['Locked', 'Draft']).optional().describe('Work order statuses to include (default: Locked, Draft)')
});

/**
 * Get job financial summary - full Est/WO/AP comparison by trade
 */
export const GetJobFinancialSummaryInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID to get financial summary for')
});

// Type exports
export type SearchJobsInput = z.infer<typeof SearchJobsInputSchema>;
export type SearchJobsByAddressInput = z.infer<typeof SearchJobsByAddressInputSchema>;
export type SearchJobsByCustomerInput = z.infer<typeof SearchJobsByCustomerInputSchema>;
export type GetJobInput = z.infer<typeof GetJobInputSchema>;
export type CreateJobInput = z.infer<typeof CreateJobInputSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobInputSchema>;
export type UpdateJobStatusInput = z.infer<typeof UpdateJobStatusInputSchema>;
export type GetJobAllocationSummaryInput = z.infer<typeof GetJobAllocationSummaryInputSchema>;
export type GetJobTradeComparisonInput = z.infer<typeof GetJobTradeComparisonInputSchema>;
export type GetJobFinancialSummaryInput = z.infer<typeof GetJobFinancialSummaryInputSchema>;
