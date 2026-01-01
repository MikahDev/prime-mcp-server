/**
 * Estimate management tools for Prime MCP Server
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
  ListEstimatesInputSchema,
  GetEstimateInputSchema,
  CreateEstimateInputSchema,
  UpdateEstimateInputSchema,
  CreateEstimateItemInputSchema,
  UpdateEstimateItemInputSchema,
  DeleteEstimateItemInputSchema
} from '../schemas/estimate.js';

export function registerEstimateTools(server: McpServer, client: PrimeClient): void {
  // prime_list_estimates
  server.tool(
    'prime_list_estimates',
    'List estimates for jobs. Set locked=true to get snapshot (read-only) estimates.',
    ListEstimatesInputSchema.shape,
    async (args) => {
      try {
        const filters = CommonFilters.estimates({
          jobId: args.job_id,
          createdAfter: args.created_after,
          createdBefore: args.created_before
        });

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          orderBy: args.order_by || 'createdAt',
          orderDir: args.order_dir,
          includes: args.includes,
          filters
        });

        // Use snapshot endpoint for locked estimates
        const endpoint = args.locked ? 'estimates-snapshot' : 'estimates';
        const response = await client.get(endpoint, query);
        const estimates = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(estimates, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_get_estimate
  server.tool(
    'prime_get_estimate',
    'Get estimate details by ID. Set locked=true for snapshot estimates.',
    GetEstimateInputSchema.shape,
    async (args) => {
      try {
        const query: Record<string, string | undefined> = {};
        if (args.includes && args.includes.length > 0) {
          query.includes = args.includes.join(',');
        }

        const endpoint = args.locked
          ? `estimates-snapshot/${args.estimate_id}`
          : `estimates/${args.estimate_id}`;

        const response = await client.get(endpoint, query);
        const estimate = extractSingleResource(response);

        return formatSuccess(estimate);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_create_estimate
  server.tool(
    'prime_create_estimate',
    'Create a new estimate for a job.',
    CreateEstimateInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          jobId: args.job_id
        };

        if (args.name) attributes.name = args.name;
        if (args.description) attributes.description = args.description;
        if (args.notes) attributes.notes = args.notes;

        const body = buildJsonApiBody('estimate', attributes);
        const response = await client.post('estimates', body);
        const estimate = extractSingleResource(response);

        return formatSuccess(estimate);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_update_estimate
  server.tool(
    'prime_update_estimate',
    'Update an estimate. Requires version for optimistic locking.',
    UpdateEstimateInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          version: args.version
        };

        if (args.name !== undefined) attributes.name = args.name;
        if (args.description !== undefined) attributes.description = args.description;
        if (args.notes !== undefined) attributes.notes = args.notes;

        const body = buildJsonApiBody('estimate', attributes, args.estimate_id);
        const response = await client.put(`estimates/${args.estimate_id}`, body);
        const estimate = extractSingleResource(response);

        return formatSuccess(estimate);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_add_estimate_item
  server.tool(
    'prime_add_estimate_item',
    'Add a line item to an estimate. Specify quantity, unit price, description, and optional category.',
    CreateEstimateItemInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          estimateId: args.estimate_id,
          description: args.description,
          quantity: args.quantity,
          unitPrice: args.unit_price
        };

        if (args.category_id) attributes.categoryId = args.category_id;
        if (args.unit) attributes.unit = args.unit;
        if (args.trade_id) attributes.tradeId = args.trade_id;
        if (args.notes) attributes.notes = args.notes;
        if (args.sort_order !== undefined) attributes.sortOrder = args.sort_order;
        if (args.is_taxable !== undefined) attributes.isTaxable = args.is_taxable;
        if (args.tax_rate !== undefined) attributes.taxRate = args.tax_rate;

        const body = buildJsonApiBody('estimateItem', attributes);
        const response = await client.post('estimate-items', body);
        const item = extractSingleResource(response);

        return formatSuccess(item);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_update_estimate_item
  server.tool(
    'prime_update_estimate_item',
    'Update an estimate line item. Requires version for optimistic locking.',
    UpdateEstimateItemInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          version: args.version
        };

        if (args.category_id !== undefined) attributes.categoryId = args.category_id;
        if (args.description !== undefined) attributes.description = args.description;
        if (args.quantity !== undefined) attributes.quantity = args.quantity;
        if (args.unit !== undefined) attributes.unit = args.unit;
        if (args.unit_price !== undefined) attributes.unitPrice = args.unit_price;
        if (args.trade_id !== undefined) attributes.tradeId = args.trade_id;
        if (args.notes !== undefined) attributes.notes = args.notes;
        if (args.sort_order !== undefined) attributes.sortOrder = args.sort_order;
        if (args.is_taxable !== undefined) attributes.isTaxable = args.is_taxable;
        if (args.tax_rate !== undefined) attributes.taxRate = args.tax_rate;

        const body = buildJsonApiBody('estimateItem', attributes, args.item_id);
        const response = await client.put(`estimate-items/${args.item_id}`, body);
        const item = extractSingleResource(response);

        return formatSuccess(item);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_delete_estimate_item
  server.tool(
    'prime_delete_estimate_item',
    'Delete an estimate line item.',
    DeleteEstimateItemInputSchema.shape,
    async (args) => {
      try {
        await client.delete(`estimate-items/${args.item_id}`);

        return formatSuccess({
          item_id: args.item_id,
          message: 'Estimate item deleted successfully'
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
