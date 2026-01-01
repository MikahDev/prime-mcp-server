/**
 * Notification management tools for Prime MCP Server
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
  ListNotificationsInputSchema,
  GetNotificationInputSchema,
  CreateNotificationInputSchema,
  ListNotificationTemplatesInputSchema,
  GetNotificationTemplateInputSchema
} from '../schemas/notification.js';

export function registerNotificationTools(server: McpServer, client: PrimeClient): void {
  // prime_list_notifications
  server.tool(
    'prime_list_notifications',
    'List notifications sent for jobs. Filter by job or template.',
    ListNotificationsInputSchema.shape,
    async (args) => {
      try {
        const filters = new FilterBuilder();
        if (args.job_id) filters.eq('jobId', args.job_id);
        if (args.template_id) filters.eq('templateId', args.template_id);
        if (args.sent_after) filters.gte('sentAt', args.sent_after);
        if (args.sent_before) filters.lte('sentAt', args.sent_before);

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          orderBy: args.order_by || 'createdAt',
          orderDir: args.order_dir,
          includes: args.includes,
          filters
        });

        const response = await client.get('notifications', query);
        const notifications = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(notifications, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_get_notification
  server.tool(
    'prime_get_notification',
    'Get notification details by ID.',
    GetNotificationInputSchema.shape,
    async (args) => {
      try {
        const query: Record<string, string | undefined> = {};
        if (args.includes && args.includes.length > 0) {
          query.includes = args.includes.join(',');
        }

        const response = await client.get(`notifications/${args.notification_id}`, query);
        const notification = extractSingleResource(response);

        return formatSuccess(notification);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_create_notification
  server.tool(
    'prime_create_notification',
    'Send a notification for a job. Use a template or provide custom subject/body.',
    CreateNotificationInputSchema.shape,
    async (args) => {
      try {
        const attributes: Record<string, unknown> = {
          jobId: args.job_id
        };

        // Template or custom content
        if (args.template_id) {
          attributes.templateId = args.template_id;
        } else {
          if (args.subject) attributes.subject = args.subject;
          if (args.body) attributes.body = args.body;
        }

        // Recipients
        if (args.recipient_emails && args.recipient_emails.length > 0) {
          attributes.recipientEmails = args.recipient_emails;
        }
        if (args.recipient_contact_ids && args.recipient_contact_ids.length > 0) {
          attributes.recipientContactIds = args.recipient_contact_ids;
        }

        // Send options
        if (args.send_immediately !== undefined) attributes.sendImmediately = args.send_immediately;
        if (args.scheduled_at) attributes.scheduledAt = args.scheduled_at;

        // Attachments
        if (args.attachment_ids && args.attachment_ids.length > 0) {
          attributes.attachmentIds = args.attachment_ids;
        }

        const body = buildJsonApiBody('notification', attributes);
        const response = await client.post('notifications', body);
        const notification = extractSingleResource(response);

        return formatSuccess(notification);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_list_notification_templates
  server.tool(
    'prime_list_notification_templates',
    'List available notification templates. Filter by active status or category.',
    ListNotificationTemplatesInputSchema.shape,
    async (args) => {
      try {
        const filters = new FilterBuilder();
        if (args.is_active !== undefined) filters.eq('isActive', args.is_active);
        if (args.category) filters.eq('category', args.category);

        const query = buildListQuery({
          page: args.page,
          perPage: args.per_page,
          orderBy: args.order_by || 'name',
          orderDir: args.order_dir,
          filters
        });

        const response = await client.get('notification-templates', query);
        const templates = extractResourceList(response);
        const pagination = extractPagination(response);

        return formatSuccess(templates, pagination ?? undefined);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // prime_get_notification_template
  server.tool(
    'prime_get_notification_template',
    'Get notification template details by ID.',
    GetNotificationTemplateInputSchema.shape,
    async (args) => {
      try {
        const response = await client.get(`notification-templates/${args.template_id}`);
        const template = extractSingleResource(response);

        return formatSuccess(template);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
