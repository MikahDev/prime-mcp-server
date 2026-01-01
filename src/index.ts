#!/usr/bin/env node

/**
 * Prime MCP Server Entry Point
 *
 * MCP server for Prime Ecosystem API - Insurance/Construction job management
 *
 * Usage:
 *   PRIME_API_TOKEN=your-token node dist/index.js
 *
 * Or add to Claude Desktop config:
 *   {
 *     "mcpServers": {
 *       "prime": {
 *         "command": "node",
 *         "args": ["/path/to/prime-mcp-server/dist/index.js"],
 *         "env": { "PRIME_API_TOKEN": "your-token" }
 *       }
 *     }
 *   }
 */

import { startServer } from './server.js';

startServer().catch((error) => {
  console.error('Failed to start Prime MCP Server:', error);
  process.exit(1);
});
