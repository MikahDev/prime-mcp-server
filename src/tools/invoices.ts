/**
 * Invoice management tools for Prime MCP Server
 * Covers Accounts Payable (AP), Accounts Receivable (AR), and Job Expense invoices
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PrimeClient } from '../client/prime-client.js';
import {
  extractSingleResource,
  extractResourceList,
  extractPagination,
  buildJsonApiBody,
  buildRelationshipBody
} from '../client/json-api.js';
import { formatError, formatSuccess } from '../utils/error-handler.js';
import { buildListQuery, FilterBuilder } from '../utils/filter-builder.js';
import {
  ListAPInvoicesInputSchema,
  GetAPInvoiceInputSchema,
  CreateAPInvoiceInputSchema,
  UpdateAPInvoiceInputSchema,
  UpdateAPInvoiceStatusInputSchema,
  ListARInvoicesInputSchema,
  GetARInvoiceInputSchema,
  UpdateARInvoiceStatusInputSchema
} from '../schemas/invoice.js';

export function registerInvoiceTools(server: McpServer, client: PrimeClient): void {
  // ============== Accounts Payable (AP) Invoices ==============

  // prime_list_ap_invoices
  server.tool(
    'prime_list_ap_invoices',
    'List accounts payable invoices (from suppliers/contractors). Filter by job, supplier, or status.',
    ListAPInvoicesInputSchema.shape,
    async (args) => {
      try {
        const filters = new FilterBuilder();
        if (args.job_id) filters.eq('jobId', args.job_id);
        if (args.supplier_id) filters.eq('supplierId', args.supplier_id);
        // Note: statusId removed - API uses accountsPayableInvoiceStatus string field
        if (args.invoice_date_after) filters.gte('invoicedDate', args.invoice_date_after);
        if (args.invoice_date_before) filters.lte('invoicedDate', args.invoice_date_before);

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          orderBy: args.order_by || 'invoicedDate',
          orderDir: args.order_dir,
          includes: args.includes,
          filters
        });

        const response = await client.get('accounts-payable-invoices', query);
        const invoices = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(invoices, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_get_ap_invoice
  server.tool(
    'prime_get_ap_invoice',
    'Get accounts payable invoice details by ID.',
    GetAPInvoiceInputSchema.shape,
    async (args) => {
      try {
        const query: Record<string, string | undefined> = {};
        if (args.includes && args.includes.length > 0) {
          query.includes = args.includes.join(',');
        }

        const response = await client.get(`accounts-payable-invoices/${args.invoice_id}`, query);
        const invoice = extractSingleResource(response);

        return formatSuccess(invoice);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_create_ap_invoice
  server.tool(
    'prime_create_ap_invoice',
    'Create an accounts payable invoice for a job from a supplier.',
    CreateAPInvoiceInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          jobId: args.job_id,
          supplierId: args.supplier_id,
          statusId: args.status_id,
          invoiceNumber: args.invoice_number,
          invoiceDate: args.invoice_date,
          subtotal: args.subtotal,
          taxAmount: args.tax_amount,
          total: args.total
        };

        if (args.due_date) attributes.dueDate = args.due_date;
        if (args.description) attributes.description = args.description;
        if (args.notes) attributes.notes = args.notes;
        if (args.allocation_id) attributes.allocationId = args.allocation_id;

        const body = buildJsonApiBody('accountsPayableInvoice', attributes);
        const response = await client.post('accounts-payable-invoices', body);
        const invoice = extractSingleResource(response);

        return formatSuccess(invoice);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_update_ap_invoice
  server.tool(
    'prime_update_ap_invoice',
    'Update an accounts payable invoice. Requires version for optimistic locking.',
    UpdateAPInvoiceInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          version: args.version
        };

        if (args.invoice_number !== undefined) attributes.invoiceNumber = args.invoice_number;
        if (args.invoice_date !== undefined) attributes.invoiceDate = args.invoice_date;
        if (args.due_date !== undefined) attributes.dueDate = args.due_date;
        if (args.subtotal !== undefined) attributes.subtotal = args.subtotal;
        if (args.tax_amount !== undefined) attributes.taxAmount = args.tax_amount;
        if (args.total !== undefined) attributes.total = args.total;
        if (args.description !== undefined) attributes.description = args.description;
        if (args.notes !== undefined) attributes.notes = args.notes;

        const body = buildJsonApiBody('accountsPayableInvoice', attributes, args.invoice_id);
        const response = await client.put(`accounts-payable-invoices/${args.invoice_id}`, body);
        const invoice = extractSingleResource(response);

        return formatSuccess(invoice);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_update_ap_invoice_status
  server.tool(
    'prime_update_ap_invoice_status',
    'Update the status of an accounts payable invoice.',
    UpdateAPInvoiceStatusInputSchema.shape,
    async (args) => {
      try {
        const body = buildRelationshipBody('accountsPayableInvoiceStatus', args.status_id);
        await client.patch(
          `accounts-payable-invoices/${args.invoice_id}/relationships/accountsPayableInvoiceStatus`,
          body
        );

        return formatSuccess({
          invoice_id: args.invoice_id,
          status_id: args.status_id,
          message: 'AP invoice status updated successfully'
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============== Accounts Receivable (AR) Invoices ==============

  // prime_list_ar_invoices
  server.tool(
    'prime_list_ar_invoices',
    'List accounts receivable invoices (to clients/insurers). Filter by job, client, or status.',
    ListARInvoicesInputSchema.shape,
    async (args) => {
      try {
        const filters = new FilterBuilder();
        if (args.job_id) filters.eq('jobId', args.job_id);
        if (args.client_id) filters.eq('clientId', args.client_id);
        if (args.status_id) filters.eq('statusId', args.status_id);
        if (args.invoice_date_after) filters.gte('invoiceDate', args.invoice_date_after);
        if (args.invoice_date_before) filters.lte('invoiceDate', args.invoice_date_before);

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          orderBy: args.order_by || 'invoiceDate',
          orderDir: args.order_dir,
          includes: args.includes,
          filters
        });

        const response = await client.get('accounts-receivable-invoices', query);
        const invoices = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(invoices, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_get_ar_invoice
  server.tool(
    'prime_get_ar_invoice',
    'Get accounts receivable invoice details by ID.',
    GetARInvoiceInputSchema.shape,
    async (args) => {
      try {
        const query: Record<string, string | undefined> = {};
        if (args.includes && args.includes.length > 0) {
          query.includes = args.includes.join(',');
        }

        const response = await client.get(`accounts-receivable-invoices/${args.invoice_id}`, query);
        const invoice = extractSingleResource(response);

        return formatSuccess(invoice);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_update_ar_invoice_status
  server.tool(
    'prime_update_ar_invoice_status',
    'Update the status of an accounts receivable invoice.',
    UpdateARInvoiceStatusInputSchema.shape,
    async (args) => {
      try {
        const body = buildRelationshipBody('accountsReceivableInvoiceStatus', args.status_id);
        await client.patch(
          `accounts-receivable-invoices/${args.invoice_id}/relationships/accountsReceivableInvoiceStatus`,
          body
        );

        return formatSuccess({
          invoice_id: args.invoice_id,
          status_id: args.status_id,
          message: 'AR invoice status updated successfully'
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
