# Prime MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)

MCP (Model Context Protocol) server for the [Prime Ecosystem API](https://www.primeeco.tech/), providing AI assistants with access to insurance and construction job management functionality.

## Features

- **40+ tools** covering all major Prime API functionality
- **Financial analysis tools** for comparing estimates, work orders, and invoices
- **Smart search** by customer name or address with automatic pagination
- **Rate limiting** respects Prime's limits (60 req/min, 5000/day, 5 concurrent)
- **Full JSON:API support** with proper request/response handling
- **Zod validation** for all tool inputs
- **TypeScript** with full type safety

## Available Tools

### Job Management
- `prime_search_jobs` - Search and filter jobs with pagination
- `prime_search_jobs_by_address` - Search jobs by street, suburb, state, or postcode
- `prime_search_jobs_by_customer` - Search jobs by customer name
- `prime_get_job` - Get detailed job information by ID
- `prime_create_job` - Create a new job
- `prime_update_job` - Update job details
- `prime_update_job_status` - Change job status

### Financial Analysis
- `prime_get_job_allocation_summary` - Work order totals grouped by trade
- `prime_get_job_trade_comparison` - Compare work orders vs authorized estimates by trade
- `prime_get_job_financial_summary` - Full comparison: Estimates vs Work Orders vs AP Invoices with alerts

### Contact Management
- `prime_search_contacts` - Search contacts by name, email, phone
- `prime_get_contact` - Get contact details
- `prime_create_contact` - Create new contact (individual or organization)
- `prime_update_contact` - Update contact information

### Allocation Management
- `prime_list_allocations` - List work allocations
- `prime_get_allocation` - Get allocation details
- `prime_create_allocation` - Create work allocation
- `prime_update_allocation` - Update allocation

### Estimate Management
- `prime_list_estimates` - List estimates (locked or unlocked)
- `prime_get_estimate` - Get estimate with line items
- `prime_create_estimate` - Create new estimate
- `prime_add_estimate_item` - Add line item to estimate
- `prime_update_estimate_item` - Update estimate line item
- `prime_delete_estimate_item` - Delete estimate line item

### Schedule Management
- `prime_get_job_schedule` - Get schedule for a job
- `prime_list_schedule_items` - List schedule items
- `prime_create_schedule_item` - Create schedule item
- `prime_update_schedule_item` - Update schedule item
- `prime_delete_schedule_item` - Delete schedule item

### Invoice Management
- `prime_list_ap_invoices` - List accounts payable invoices
- `prime_get_ap_invoice` - Get AP invoice details
- `prime_create_ap_invoice` - Create AP invoice
- `prime_update_ap_invoice` - Update AP invoice
- `prime_update_ap_invoice_status` - Update AP invoice status
- `prime_list_ar_invoices` - List accounts receivable invoices
- `prime_get_ar_invoice` - Get AR invoice details
- `prime_update_ar_invoice_status` - Update AR invoice status

### Work Order Management
- `prime_list_work_orders` - List work orders
- `prime_get_work_order` - Get work order details
- `prime_update_work_order` - Update work order

### Attachment Management
- `prime_list_attachments` - List job attachments
- `prime_get_attachment` - Get attachment details
- `prime_create_attachment` - Create attachment record
- `prime_update_attachment` - Update attachment metadata

### Notification Management
- `prime_list_notifications` - List sent notifications
- `prime_get_notification` - Get notification details
- `prime_create_notification` - Send notification
- `prime_list_notification_templates` - List available templates
- `prime_get_notification_template` - Get template details

### Reference Data
- `prime_list_job_statuses` - List job statuses
- `prime_get_job_status` - Get status details
- `prime_list_perils` - List peril types (Fire, Flood, Storm, etc.)
- `prime_list_trades` - List trade types (Plumbing, Electrical, etc.)
- `prime_list_divisions` - List company divisions
- `prime_list_users` - List system users
- `prime_get_user` - Get user details
- `prime_list_workflows` - List workflows
- `prime_list_job_types` - List job types
- `prime_list_allocation_statuses` - List allocation statuses
- `prime_list_filter_tags` - List filter tags
- `prime_rate_limit_status` - Check current rate limit status

## Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/prime-mcp-server.git
cd prime-mcp-server

# Install dependencies
npm install

# Build
npm run build
```

> **Note:** Replace `YOUR_USERNAME` with your GitHub username after forking.

## Configuration

### Environment Variables

```bash
# Required: OAuth2 credentials
export PRIME_CLIENT_ID=your-client-id
export PRIME_CLIENT_SECRET=your-client-secret
export PRIME_USERNAME=your-username
export PRIME_PASSWORD=your-password

# Optional: Override API URLs (defaults to production)
export PRIME_API_URL=https://www.primeeco.tech/api.prime/v2
export PRIME_OAUTH_URL=https://www.primeeco.tech/api.prime/v2/oauth/token

# Optional: Log level (debug, info, warn, error)
export LOG_LEVEL=info
```

### Getting OAuth2 Credentials

Contact your Prime administrator to obtain:
- **Client ID** - Your application's client identifier
- **Client Secret** - Your application's secret key
- **Username** - Your Prime user account
- **Password** - Your Prime password

The server uses OAuth2 password grant flow and automatically handles token refresh.

## Usage

### Quick Start with npx

```bash
# Run directly without installing
npx prime-mcp-server
```

### With Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "prime": {
      "command": "npx",
      "args": ["prime-mcp-server"],
      "env": {
        "PRIME_CLIENT_ID": "your-client-id",
        "PRIME_CLIENT_SECRET": "your-client-secret",
        "PRIME_USERNAME": "your-username",
        "PRIME_PASSWORD": "your-password"
      }
    }
  }
}
```

Or with a local installation:

```json
{
  "mcpServers": {
    "prime": {
      "command": "node",
      "args": ["/path/to/prime-mcp-server/dist/index.js"],
      "env": {
        "PRIME_CLIENT_ID": "your-client-id",
        "PRIME_CLIENT_SECRET": "your-client-secret",
        "PRIME_USERNAME": "your-username",
        "PRIME_PASSWORD": "your-password"
      }
    }
  }
}
```

### With ChatGPT (HTTP Mode)

The server supports Streamable HTTP transport for ChatGPT integration.

**1. Start the HTTP server:**

```bash
# Set credentials
export PRIME_CLIENT_ID=your-client-id
export PRIME_CLIENT_SECRET=your-client-secret
export PRIME_USERNAME=your-username
export PRIME_PASSWORD=your-password

# Start HTTP server (default port 3000)
npm run start:http

# Or with custom port
PORT=8080 npm run start:http
```

**2. Expose to the internet** (for testing, use ngrok):

```bash
ngrok http 3000
```

**3. Connect in ChatGPT:**

1. Go to ChatGPT → Settings → Connectors → Create
2. Enter your public URL (e.g., `https://abc123.ngrok.io/mcp`)
3. The connector will auto-discover available tools

> **Note:** ChatGPT MCP support requires a Pro, Plus, or Business account with Developer Mode enabled (Settings → Connectors → Advanced → Developer mode).

### Standalone

```bash
# Set credentials
export PRIME_CLIENT_ID=your-client-id
export PRIME_CLIENT_SECRET=your-client-secret
export PRIME_USERNAME=your-username
export PRIME_PASSWORD=your-password

# Run stdio transport (for Claude)
npm start

# Run HTTP transport (for ChatGPT)
npm run start:http
```

### Development

```bash
# Run with hot reload
npm run dev

# Run tests
npm test

# Type check
npm run typecheck
```

## Rate Limits

The Prime API has the following rate limits:

| Limit | Value |
|-------|-------|
| Per Minute | 60 requests |
| Per Day | 5,000 requests |
| Concurrent | 5 requests |

The MCP server automatically handles rate limiting:
- Tracks tokens and waits when approaching limits
- Updates from response headers for accuracy
- Queues concurrent requests exceeding the limit
- Provides `prime_rate_limit_status` tool to check current status

## Error Handling

All tools return consistent error responses:

```json
{
  "error": true,
  "code": "VALIDATION_ERROR",
  "message": "Description of the error",
  "details": {
    "field": "specific field error"
  }
}
```

Error codes:
- `RATE_LIMITED` - Rate limit exceeded (includes `retryAfter`)
- `UNAUTHORIZED` - Invalid or missing API token
- `FORBIDDEN` - Permission denied
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input parameters
- `SERVER_ERROR` - Prime API server error
- `NETWORK_ERROR` - Connection failed
- `INTERNAL_ERROR` - Unexpected error

## Project Structure

```
prime-mcp-server/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # MCP server setup
│   ├── client/
│   │   ├── prime-client.ts   # HTTP client
│   │   ├── rate-limiter.ts   # Rate limiting
│   │   └── json-api.ts       # JSON:API utilities
│   ├── config/
│   │   └── index.ts          # Configuration
│   ├── schemas/              # Zod validation schemas
│   ├── tools/                # MCP tool implementations
│   └── utils/
│       ├── error-handler.ts  # Error formatting
│       └── filter-builder.ts # Query filter builder
├── tests/
│   └── unit/                 # Unit tests
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT
