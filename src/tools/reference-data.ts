/**
 * Reference data tools for Prime MCP Server
 * These are mostly read-only lookup tables for filtering and categorization
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PrimeClient } from '../client/prime-client.js';
import {
  extractSingleResource,
  extractResourceList,
  extractPagination
} from '../client/json-api.js';
import { formatError, formatSuccess } from '../utils/error-handler.js';
import { buildListQuery, FilterBuilder } from '../utils/filter-builder.js';
import {
  ListJobStatusesInputSchema,
  GetJobStatusInputSchema,
  ListPerilsInputSchema,
  ListTradesInputSchema,
  ListDivisionsInputSchema,
  ListUsersInputSchema,
  GetUserInputSchema,
  ListWorkflowsInputSchema,
  ListJobTypesInputSchema,
  ListAllocationStatusesInputSchema,
  ListFilterTagsInputSchema
} from '../schemas/reference-data.js';

export function registerReferenceDataTools(server: McpServer, client: PrimeClient): void {
  // ============== Job Statuses ==============

  // prime_list_job_statuses
  server.tool(
    'prime_list_job_statuses',
    'List available job statuses. Filter by workflow to get relevant statuses.',
    ListJobStatusesInputSchema.shape,
    async (args) => {
      try {
        const filters = new FilterBuilder();
        if (args.workflow_id) filters.eq('workflowId', args.workflow_id);
        if (args.is_active !== undefined) filters.eq('isActive', args.is_active);

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          filters
        });

        const response = await client.get('statuses', query);
        const statuses = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(statuses, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_get_job_status
  server.tool(
    'prime_get_job_status',
    'Get job status details by ID.',
    GetJobStatusInputSchema.shape,
    async (args) => {
      try {
        const response = await client.get(`statuses/${args.status_id}`);
        const status = extractSingleResource(response);

        return formatSuccess(status);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============== Perils ==============

  // prime_list_perils
  server.tool(
    'prime_list_perils',
    'List peril types (causes of damage like Fire, Flood, Storm, etc.).',
    ListPerilsInputSchema.shape,
    async (args) => {
      try {
        const filters = new FilterBuilder();
        if (args.is_active !== undefined) filters.eq('isActive', args.is_active);

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          filters
        });

        const response = await client.get('perils', query);
        const perils = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(perils, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============== Trades ==============

  // prime_list_trades
  server.tool(
    'prime_list_trades',
    'List trade types (Plumbing, Electrical, Carpentry, etc.).',
    ListTradesInputSchema.shape,
    async (args) => {
      try {
        const filters = new FilterBuilder();
        if (args.is_active !== undefined) filters.eq('isActive', args.is_active);

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          filters
        });

        const response = await client.get('trades', query);
        const trades = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(trades, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============== Divisions ==============

  // prime_list_divisions
  server.tool(
    'prime_list_divisions',
    'List company divisions/branches.',
    ListDivisionsInputSchema.shape,
    async (args) => {
      try {
        const filters = new FilterBuilder();
        if (args.is_active !== undefined) filters.eq('isActive', args.is_active);
        if (args.region_id) filters.eq('regionId', args.region_id);

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          filters
        });

        const response = await client.get('divisions', query);
        const divisions = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(divisions, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============== Users ==============

  // prime_list_users
  server.tool(
    'prime_list_users',
    'List system users. Filter by division or active status.',
    ListUsersInputSchema.shape,
    async (args) => {
      try {
        const filters = new FilterBuilder();
        if (args.is_active !== undefined) filters.eq('isActive', args.is_active);
        if (args.division_id) filters.eq('divisionId', args.division_id);
        if (args.role) filters.eq('role', args.role);

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          filters
        });

        const response = await client.get('users', query);
        const users = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(users, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_get_user
  server.tool(
    'prime_get_user',
    'Get user details by ID.',
    GetUserInputSchema.shape,
    async (args) => {
      try {
        const response = await client.get(`users/${args.user_id}`);
        const user = extractSingleResource(response);

        return formatSuccess(user);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============== Workflows ==============

  // prime_list_workflows
  server.tool(
    'prime_list_workflows',
    'List available workflows. Workflows define the status flow for jobs.',
    ListWorkflowsInputSchema.shape,
    async (args) => {
      try {
        const filters = new FilterBuilder();
        if (args.is_active !== undefined) filters.eq('isActive', args.is_active);

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          filters
        });

        const response = await client.get('workflows', query);
        const workflows = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(workflows, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============== Job Types ==============

  // prime_list_job_types
  server.tool(
    'prime_list_job_types',
    'List available job types.',
    ListJobTypesInputSchema.shape,
    async (args) => {
      try {
        const filters = new FilterBuilder();
        if (args.is_active !== undefined) filters.eq('isActive', args.is_active);

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          filters
        });

        const response = await client.get('job-types', query);
        const jobTypes = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(jobTypes, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============== Allocation Statuses ==============

  // prime_list_allocation_statuses
  server.tool(
    'prime_list_allocation_statuses',
    'List available allocation statuses.',
    ListAllocationStatusesInputSchema.shape,
    async (args) => {
      try {
        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page
        });

        const response = await client.get('allocation-statuses', query);
        const statuses = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(statuses, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============== Filter Tags ==============

  // prime_list_filter_tags
  server.tool(
    'prime_list_filter_tags',
    'List filter tags for categorizing entities.',
    ListFilterTagsInputSchema.shape,
    async (args) => {
      try {
        const filters = new FilterBuilder();
        if (args.filter_type_id) filters.eq('filterTypeId', args.filter_type_id);

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          filters
        });

        const response = await client.get('filter-tags', query);
        const tags = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(tags, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============== Rate Limit Status ==============

  // prime_rate_limit_status
  server.tool(
    'prime_rate_limit_status',
    'Get current rate limit status showing remaining requests per minute and per day.',
    {},
    async () => {
      try {
        const status = client.getRateLimitStatus();

        return formatSuccess({
          tokens_remaining: status.tokensRemaining,
          daily_remaining: status.dailyRemaining,
          concurrent_active: status.concurrentActive,
          next_refill: status.nextRefill.toISOString(),
          daily_reset: status.dailyReset.toISOString(),
          is_near_limit: client.isNearRateLimit()
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
