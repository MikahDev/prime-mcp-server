/**
 * Work order management tools for Prime MCP Server
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
import { buildListQuery, FilterBuilder } from '../utils/filter-builder.js';
import {
  ListWorkOrdersInputSchema,
  GetWorkOrderInputSchema,
  UpdateWorkOrderInputSchema
} from '../schemas/work-order.js';

export function registerWorkOrderTools(server: McpServer, client: PrimeClient): void {
  // prime_list_work_orders
  server.tool(
    'prime_list_work_orders',
    'List work orders. Filter by job, allocation, assigned contact, or status.',
    ListWorkOrdersInputSchema.shape,
    async (args) => {
      try {
        const filters = new FilterBuilder();
        if (args.job_id) filters.eq('jobId', args.job_id);
        if (args.allocation_id) filters.eq('allocationId', args.allocation_id);
        if (args.assigned_contact_id) filters.eq('assignedContactId', args.assigned_contact_id);
        if (args.status) filters.eq('status', args.status);
        if (args.created_after) filters.gte('createdAt', args.created_after);
        if (args.created_before) filters.lte('createdAt', args.created_before);

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          orderBy: args.order_by || 'createdAt',
          orderDir: args.order_dir,
          includes: args.includes,
          filters
        });

        const response = await client.get('work-orders', query);
        const workOrders = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(workOrders, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_get_work_order
  server.tool(
    'prime_get_work_order',
    'Get work order details by ID.',
    GetWorkOrderInputSchema.shape,
    async (args) => {
      try {
        const query: Record<string, string | undefined> = {};
        if (args.includes && args.includes.length > 0) {
          query.includes = args.includes.join(',');
        }

        const response = await client.get(`work-orders/${args.work_order_id}`, query);
        const workOrder = extractSingleResource(response);

        return formatSuccess(workOrder);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_update_work_order
  server.tool(
    'prime_update_work_order',
    'Update a work order. Requires version for optimistic locking.',
    UpdateWorkOrderInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          version: args.version
        };

        if (args.description !== undefined) attributes.description = args.description;
        if (args.notes !== undefined) attributes.notes = args.notes;
        if (args.assigned_contact_id !== undefined) attributes.assignedContactId = args.assigned_contact_id;
        if (args.status !== undefined) attributes.status = args.status;

        const body = buildJsonApiBody('workOrder', attributes, args.work_order_id);
        const response = await client.put(`work-orders/${args.work_order_id}`, body);
        const workOrder = extractSingleResource(response);

        return formatSuccess(workOrder);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
