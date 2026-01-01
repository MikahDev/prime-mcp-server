/**
 * Invoice-related Zod schemas for Prime API
 *
 * Prime has three types of invoices:
 * - Accounts Payable (AP): Invoices from suppliers/contractors
 * - Accounts Receivable (AR): Invoices to clients/insurers
 * - Job Expense Invoices: Internal expense tracking
 */

import { z } from 'zod';
import {
  UuidSchema,
  PaginationInputSchema,
  OrderingSchema,
  DateSchema,
  VersionSchema,
  PositiveCurrencySchema
} from './common.js';

// Accounts Payable Invoices

/**
 * List AP invoices input schema
 */
export const ListAPInvoicesInputSchema = z.object({
  ...PaginationInputSchema.shape,
  ...OrderingSchema.shape,
  job_id: UuidSchema.optional().describe('Filter by job ID'),
  supplier_id: UuidSchema.optional().describe('Filter by supplier contact ID'),
  status_id: UuidSchema.optional().describe('Filter by invoice status ID'),
  invoice_date_after: DateSchema.optional().describe('Filter invoices dated after'),
  invoice_date_before: DateSchema.optional().describe('Filter invoices dated before'),
  includes: z.array(z.string()).optional().describe('Related resources to include: job, supplier, status')
});

/**
 * Get AP invoice input schema
 */
export const GetAPInvoiceInputSchema = z.object({
  invoice_id: UuidSchema.describe('The invoice ID to retrieve'),
  includes: z.array(z.string()).optional().describe('Related resources to include')
});

/**
 * Create AP invoice input schema
 */
export const CreateAPInvoiceInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID this invoice belongs to'),
  supplier_id: UuidSchema.describe('Supplier contact ID'),
  status_id: UuidSchema.describe('Initial invoice status ID'),

  invoice_number: z.string().max(100).describe('Supplier invoice number'),
  invoice_date: DateSchema.describe('Invoice date (YYYY-MM-DD)'),
  due_date: DateSchema.optional().describe('Payment due date (YYYY-MM-DD)'),

  subtotal: PositiveCurrencySchema.describe('Invoice subtotal before tax'),
  tax_amount: PositiveCurrencySchema.default(0).describe('Tax amount'),
  total: PositiveCurrencySchema.describe('Total invoice amount'),

  description: z.string().max(2000).optional().describe('Invoice description'),
  notes: z.string().max(5000).optional().describe('Internal notes'),

  allocation_id: UuidSchema.optional().describe('Related allocation ID')
});

/**
 * Update AP invoice input schema
 */
export const UpdateAPInvoiceInputSchema = z.object({
  invoice_id: UuidSchema.describe('The invoice ID to update'),
  version: VersionSchema.describe('Current version for optimistic locking'),

  invoice_number: z.string().max(100).optional(),
  invoice_date: DateSchema.optional(),
  due_date: DateSchema.optional(),
  subtotal: PositiveCurrencySchema.optional(),
  tax_amount: PositiveCurrencySchema.optional(),
  total: PositiveCurrencySchema.optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional()
});

/**
 * Update AP invoice status input schema
 */
export const UpdateAPInvoiceStatusInputSchema = z.object({
  invoice_id: UuidSchema.describe('The invoice ID to update'),
  status_id: UuidSchema.describe('New status ID')
});

// Accounts Receivable Invoices

/**
 * List AR invoices input schema
 */
export const ListARInvoicesInputSchema = z.object({
  ...PaginationInputSchema.shape,
  ...OrderingSchema.shape,
  job_id: UuidSchema.optional().describe('Filter by job ID'),
  client_id: UuidSchema.optional().describe('Filter by client contact ID'),
  status_id: UuidSchema.optional().describe('Filter by invoice status ID'),
  invoice_date_after: DateSchema.optional().describe('Filter invoices dated after'),
  invoice_date_before: DateSchema.optional().describe('Filter invoices dated before'),
  includes: z.array(z.string()).optional().describe('Related resources to include: job, client, status')
});

/**
 * Get AR invoice input schema
 */
export const GetARInvoiceInputSchema = z.object({
  invoice_id: UuidSchema.describe('The invoice ID to retrieve'),
  includes: z.array(z.string()).optional().describe('Related resources to include')
});

/**
 * Update AR invoice status input schema
 */
export const UpdateARInvoiceStatusInputSchema = z.object({
  invoice_id: UuidSchema.describe('The invoice ID to update'),
  status_id: UuidSchema.describe('New status ID')
});

// Job Expense Invoices

/**
 * List job expense invoices input schema
 */
export const ListJobExpenseInvoicesInputSchema = z.object({
  ...PaginationInputSchema.shape,
  ...OrderingSchema.shape,
  job_id: UuidSchema.optional().describe('Filter by job ID'),
  status_id: UuidSchema.optional().describe('Filter by invoice status ID'),
  includes: z.array(z.string()).optional().describe('Related resources to include')
});

/**
 * Create job expense invoice input schema
 */
export const CreateJobExpenseInvoiceInputSchema = z.object({
  job_id: UuidSchema.describe('The job ID this expense belongs to'),
  status_id: UuidSchema.describe('Initial status ID'),

  expense_date: DateSchema.describe('Expense date (YYYY-MM-DD)'),
  amount: PositiveCurrencySchema.describe('Expense amount'),
  description: z.string().max(2000).describe('Expense description'),
  notes: z.string().max(5000).optional().describe('Internal notes')
});

/**
 * Update job expense invoice input schema
 */
export const UpdateJobExpenseInvoiceInputSchema = z.object({
  invoice_id: UuidSchema.describe('The invoice ID to update'),
  version: VersionSchema.describe('Current version for optimistic locking'),

  expense_date: DateSchema.optional(),
  amount: PositiveCurrencySchema.optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional()
});

/**
 * Update job expense invoice status input schema
 */
export const UpdateJobExpenseInvoiceStatusInputSchema = z.object({
  invoice_id: UuidSchema.describe('The invoice ID to update'),
  status_id: UuidSchema.describe('New status ID')
});

// Type exports
export type ListAPInvoicesInput = z.infer<typeof ListAPInvoicesInputSchema>;
export type CreateAPInvoiceInput = z.infer<typeof CreateAPInvoiceInputSchema>;
export type ListARInvoicesInput = z.infer<typeof ListARInvoicesInputSchema>;
