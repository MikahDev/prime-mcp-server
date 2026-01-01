/**
 * Schedule management tools for Prime MCP Server
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
  GetJobScheduleInputSchema,
  ListScheduleItemsInputSchema,
  CreateScheduleItemInputSchema,
  UpdateScheduleItemInputSchema,
  DeleteScheduleItemInputSchema
} from '../schemas/schedule.js';

export function registerScheduleTools(server: McpServer, client: PrimeClient): void {
  // prime_get_job_schedule
  server.tool(
    'prime_get_job_schedule',
    'Get the schedule for a specific job, including all schedule items.',
    GetJobScheduleInputSchema.shape,
    async (args) => {
      try {
        const query: Record<string, string | undefined> = {
          job: args.job_id
        };
        if (args.includes && args.includes.length > 0) {
          query.includes = args.includes.join(',');
        }

        const response = await client.get('schedules', query);
        const schedules = extractResourceList(response);

        return formatSuccess(schedules);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_list_schedule_items
  server.tool(
    'prime_list_schedule_items',
    'List schedule items for a job. Can filter by schedule or date range.',
    ListScheduleItemsInputSchema.shape,
    async (args) => {
      try {
        const filters = new FilterBuilder();
        if (args.schedule_id) filters.eq('scheduleId', args.schedule_id);
        if (args.start_after) filters.gte('startDate', args.start_after);
        if (args.start_before) filters.lte('startDate', args.start_before);

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          filters
        });

        // Add job filter
        query.job = args.job_id;

        const response = await client.get('schedule-items', query);
        const items = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(items, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_create_schedule_item
  server.tool(
    'prime_create_schedule_item',
    'Create a new schedule item (task) with start/end dates and optional assignment.',
    CreateScheduleItemInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          scheduleId: args.schedule_id,
          name: args.name,
          startDate: args.start_date,
          endDate: args.end_date
        };

        if (args.description) attributes.description = args.description;
        if (args.assigned_id) attributes.assignedId = args.assigned_id;
        if (args.assigned_contact_id) attributes.assignedContactId = args.assigned_contact_id;
        if (args.progress !== undefined) attributes.progress = args.progress;

        const body = buildJsonApiBody('scheduleItem', attributes);
        const response = await client.post('schedule-items', body);
        const item = extractSingleResource(response);

        return formatSuccess(item);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_update_schedule_item
  server.tool(
    'prime_update_schedule_item',
    'Update a schedule item. Requires version for optimistic locking.',
    UpdateScheduleItemInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          version: args.version
        };

        if (args.name !== undefined) attributes.name = args.name;
        if (args.description !== undefined) attributes.description = args.description;
        if (args.start_date !== undefined) attributes.startDate = args.start_date;
        if (args.end_date !== undefined) attributes.endDate = args.end_date;
        if (args.assigned_id !== undefined) attributes.assignedId = args.assigned_id;
        if (args.assigned_contact_id !== undefined) attributes.assignedContactId = args.assigned_contact_id;
        if (args.progress !== undefined) attributes.progress = args.progress;

        const body = buildJsonApiBody('scheduleItem', attributes, args.schedule_item_id);
        const response = await client.put(`schedule-items/${args.schedule_item_id}`, body);
        const item = extractSingleResource(response);

        return formatSuccess(item);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_delete_schedule_item
  server.tool(
    'prime_delete_schedule_item',
    'Delete a schedule item.',
    DeleteScheduleItemInputSchema.shape,
    async (args) => {
      try {
        await client.delete(`schedule-items/${args.schedule_item_id}`);

        return formatSuccess({
          schedule_item_id: args.schedule_item_id,
          message: 'Schedule item deleted successfully'
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
