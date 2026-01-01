#!/usr/bin/env node

/**
 * Prime MCP Server - HTTP Transport Entry Point
 *
 * Runs the MCP server with Streamable HTTP transport for:
 * - ChatGPT connectors and deep research
 * - Remote Claude connections
 * - Any MCP client supporting HTTP transport
 *
 * Usage:
 *   PRIME_CLIENT_ID=xxx PRIME_CLIENT_SECRET=xxx \
 *   PRIME_USERNAME=xxx PRIME_PASSWORD=xxx \
 *   node dist/http.js
 *
 * Environment variables:
 *   PORT - Server port (default: 3000)
 *   HOST - Server host (default: 0.0.0.0)
 *
 * For ChatGPT:
 *   1. Deploy this server to a public URL
 *   2. In ChatGPT: Settings → Connectors → Create
 *   3. Enter your server URL (e.g., https://your-server.com/mcp)
 */

import { createServer as createHttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createServer } from './server.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function startHttpServer(): Promise<void> {
  // Create the MCP server with all tools
  const mcpServer = createServer();

  // Create HTTP transport with session support
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  // Connect MCP server to transport
  await mcpServer.connect(transport);

  // Create HTTP server
  const httpServer = createHttpServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    // Health check endpoint
    if (url.pathname === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', transport: 'streamable-http' }));
      return;
    }

    // MCP endpoint - handle all MCP traffic at /mcp or root
    if (url.pathname === '/mcp' || url.pathname === '/') {
      try {
        await transport.handleRequest(req, res);
      } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      }
      return;
    }

    // 404 for unknown paths
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  // Start listening
  httpServer.listen(PORT, HOST, () => {
    console.log(`Prime MCP Server (HTTP) running at http://${HOST}:${PORT}`);
    console.log(`MCP endpoint: http://${HOST}:${PORT}/mcp`);
    console.log(`Health check: http://${HOST}:${PORT}/health`);
    console.log('');
    console.log('For ChatGPT integration:');
    console.log('  1. Deploy to a public URL (or use ngrok for testing)');
    console.log('  2. In ChatGPT: Settings → Connectors → Create');
    console.log('  3. Enter your public URL');
  });

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down...');
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startHttpServer().catch((error) => {
  console.error('Failed to start Prime MCP Server (HTTP):', error);
  process.exit(1);
});
