/**
 * Allocation management tools for Prime MCP Server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PrimeClient } from '../client/prime-client.js';
import {
  extractSingleResource,
  extractResourceList,
  extractPagination,
  buildJsonApiBody
} from '../client/json-api.js';
import { formatError, formatSuccess } from '../utils/error-handler.js';
import { CommonFilters, buildListQuery } from '../utils/filter-builder.js';
import {
  ListAllocationsInputSchema,
  GetAllocationInputSchema,
  CreateAllocationInputSchema,
  UpdateAllocationInputSchema
} from '../schemas/allocation.js';

export function registerAllocationTools(server: McpServer, client: PrimeClient): void {
  // prime_list_allocations
  server.tool(
    'prime_list_allocations',
    'List work allocations. Filter by job, assigned contact, status, or type. Types include Make Safe, Quote, Restoration, etc.',
    ListAllocationsInputSchema.shape,
    async (args) => {
      try {
        const filters = CommonFilters.allocations({
          jobId: args.job_id,
          assignedContactId: args.assigned_contact_id,
          allocationStatusId: args.allocation_status_id,
          allocationType: args.allocation_type
        });

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          orderBy: args.order_by || 'createdAt',
          orderDir: args.order_dir,
          includes: args.includes,
          filters
        });

        const response = await client.get('allocations', query);
        const allocations = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(allocations, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_get_allocation
  server.tool(
    'prime_get_allocation',
    'Get detailed allocation information by ID.',
    GetAllocationInputSchema.shape,
    async (args) => {
      try {
        const query: Record<string, string | undefined> = {};
        if (args.includes && args.includes.length > 0) {
          query.includes = args.includes.join(',');
        }

        const response = await client.get(`allocations/${args.allocation_id}`, query);
        const allocation = extractSingleResource(response);

        return formatSuccess(allocation);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_create_allocation
  server.tool(
    'prime_create_allocation',
    'Create a new work allocation for a job. Requires job_id, allocation_status_id, allocation_type, allocation_number, and label.',
    CreateAllocationInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          jobId: args.job_id,
          allocationStatusId: args.allocation_status_id,
          allocationType: args.allocation_type,
          allocationNumber: args.allocation_number,
          label: args.label
        };

        if (args.description) attributes.description = args.description;
        if (args.assigned_contact_id) attributes.assignedContactId = args.assigned_contact_id;
        if (args.assigned_id) attributes.assignedId = args.assigned_id;
        if (args.limit !== undefined) attributes.limit = args.limit;
        if (args.site_attended) attributes.siteAttended = args.site_attended;
        if (args.completed) attributes.completed = args.completed;
        if (args.first_customer_contact_at) attributes.firstCustomerContactAt = args.first_customer_contact_at;

        const body = buildJsonApiBody('allocation', attributes);
        const response = await client.post('allocations', body);
        const allocation = extractSingleResource(response);

        return formatSuccess(allocation);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_update_allocation
  server.tool(
    'prime_update_allocation',
    'Update an allocation. Requires allocation_id and version for optimistic locking.',
    UpdateAllocationInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          version: args.version
        };

        if (args.allocation_status_id !== undefined) attributes.allocationStatusId = args.allocation_status_id;
        if (args.label !== undefined) attributes.label = args.label;
        if (args.description !== undefined) attributes.description = args.description;
        if (args.assigned_contact_id !== undefined) attributes.assignedContactId = args.assigned_contact_id;
        if (args.assigned_id !== undefined) attributes.assignedId = args.assigned_id;
        if (args.limit !== undefined) attributes.limit = args.limit;
        if (args.site_attended !== undefined) attributes.siteAttended = args.site_attended;
        if (args.completed !== undefined) attributes.completed = args.completed;
        if (args.first_customer_contact_at !== undefined) attributes.firstCustomerContactAt = args.first_customer_contact_at;

        const body = buildJsonApiBody('allocation', attributes, args.allocation_id);
        const response = await client.put(`allocations/${args.allocation_id}`, body);
        const allocation = extractSingleResource(response);

        return formatSuccess(allocation);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
