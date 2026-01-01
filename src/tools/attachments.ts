/**
 * Attachment management tools for Prime MCP Server
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
  ListAttachmentsInputSchema,
  GetAttachmentInputSchema,
  CreateAttachmentInputSchema,
  UpdateAttachmentInputSchema
} from '../schemas/attachment.js';

export function registerAttachmentTools(server: McpServer, client: PrimeClient): void {
  // prime_list_attachments
  server.tool(
    'prime_list_attachments',
    'List attachments for jobs. Filter by job, allocation, or attachment type.',
    ListAttachmentsInputSchema.shape,
    async (args) => {
      try {
        const filters = new FilterBuilder();
        if (args.job_id) filters.eq('jobId', args.job_id);
        if (args.allocation_id) filters.eq('allocationId', args.allocation_id);
        if (args.attachment_type_id) filters.eq('attachmentTypeId', args.attachment_type_id);
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

        const response = await client.get('attachments', query);
        const attachments = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(attachments, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_get_attachment
  server.tool(
    'prime_get_attachment',
    'Get attachment details by ID.',
    GetAttachmentInputSchema.shape,
    async (args) => {
      try {
        const query: Record<string, string | undefined> = {};
        if (args.includes && args.includes.length > 0) {
          query.includes = args.includes.join(',');
        }

        const response = await client.get(`attachments/${args.attachment_id}`, query);
        const attachment = extractSingleResource(response);

        return formatSuccess(attachment);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_create_attachment
  server.tool(
    'prime_create_attachment',
    'Create a new attachment record for a job. Note: File upload may require separate handling.',
    CreateAttachmentInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          jobId: args.job_id,
          fileName: args.file_name
        };

        if (args.attachment_type_id) attributes.attachmentTypeId = args.attachment_type_id;
        if (args.file_url) attributes.fileUrl = args.file_url;
        if (args.file_size) attributes.fileSize = args.file_size;
        if (args.mime_type) attributes.mimeType = args.mime_type;
        if (args.title) attributes.title = args.title;
        if (args.description) attributes.description = args.description;
        if (args.notes) attributes.notes = args.notes;
        if (args.allocation_id) attributes.allocationId = args.allocation_id;
        if (args.estimate_id) attributes.estimateId = args.estimate_id;

        const body = buildJsonApiBody('attachment', attributes);
        const response = await client.post('attachments', body);
        const attachment = extractSingleResource(response);

        return formatSuccess(attachment);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_update_attachment
  server.tool(
    'prime_update_attachment',
    'Update attachment metadata. Requires version for optimistic locking.',
    UpdateAttachmentInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          version: args.version
        };

        if (args.attachment_type_id !== undefined) attributes.attachmentTypeId = args.attachment_type_id;
        if (args.title !== undefined) attributes.title = args.title;
        if (args.description !== undefined) attributes.description = args.description;
        if (args.notes !== undefined) attributes.notes = args.notes;

        const body = buildJsonApiBody('attachment', attributes, args.attachment_id);
        const response = await client.put(`attachments/${args.attachment_id}`, body);
        const attachment = extractSingleResource(response);

        return formatSuccess(attachment);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
