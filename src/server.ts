/**
 * Prime MCP Server
 *
 * MCP server for Prime Ecosystem API providing 35+ tools for:
 * - Job management (search, create, update, status changes)
 * - Contact management (customers, suppliers, contractors)
 * - Allocation management (work assignments)
 * - Estimate management (quotes, line items)
 * - Schedule management (project timelines)
 * - Invoice management (AP, AR, expenses)
 * - Work order management
 * - Attachment management
 * - Notification management
 * - Reference data (statuses, perils, trades, divisions, users)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PrimeClient } from './client/prime-client.js';
import { registerAllTools } from './tools/index.js';
import { loadConfig } from './config/index.js';

/**
 * Create and configure the MCP server
 */
export function createServer(): McpServer {
  // Load configuration (will exit if PRIME_API_TOKEN is missing)
  loadConfig();

  const server = new McpServer({
    name: 'prime-mcp-server',
    version: '1.0.0'
  });

  // Create Prime API client
  const client = new PrimeClient();

  // Register all tools
  registerAllTools(server, client);

  return server;
}

/**
 * Start the MCP server with stdio transport
 */
export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Log to stderr (stdout is used for MCP protocol)
  console.error('Prime MCP Server started successfully');
  console.error('Ready to accept connections via stdio');
}
