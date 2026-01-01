/**
 * Tool registration orchestrator for Prime MCP Server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PrimeClient } from '../client/prime-client.js';
import { registerJobTools } from './jobs.js';
import { registerContactTools } from './contacts.js';
import { registerAllocationTools } from './allocations.js';
import { registerEstimateTools } from './estimates.js';
import { registerScheduleTools } from './schedules.js';
import { registerInvoiceTools } from './invoices.js';
import { registerWorkOrderTools } from './work-orders.js';
import { registerAttachmentTools } from './attachments.js';
import { registerNotificationTools } from './notifications.js';
import { registerReferenceDataTools } from './reference-data.js';

/**
 * Register all Prime MCP tools with the server
 */
export function registerAllTools(server: McpServer, client: PrimeClient): void {
  // Core entity tools
  registerJobTools(server, client);
  registerContactTools(server, client);
  registerAllocationTools(server, client);
  registerEstimateTools(server, client);

  // Supporting entity tools
  registerScheduleTools(server, client);
  registerInvoiceTools(server, client);
  registerWorkOrderTools(server, client);
  registerAttachmentTools(server, client);
  registerNotificationTools(server, client);

  // Reference data and utility tools
  registerReferenceDataTools(server, client);
}

export {
  registerJobTools,
  registerContactTools,
  registerAllocationTools,
  registerEstimateTools,
  registerScheduleTools,
  registerInvoiceTools,
  registerWorkOrderTools,
  registerAttachmentTools,
  registerNotificationTools,
  registerReferenceDataTools
};
