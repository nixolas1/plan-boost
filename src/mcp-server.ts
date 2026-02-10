import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { startWebServer } from './server/web.js';
import { registerTools } from './server/tools.js';

async function main() {
  let port = 3456;

  const server = new McpServer({
    name: 'boost',
    version: '1.0.0',
  });

  registerTools(server, () => port);

  // Start web server
  try {
    port = await startWebServer();
  } catch (err) {
    console.error('[boost] Failed to start web server:', err);
    process.exit(1);
  }

  // Start MCP on stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[boost] MCP server running on stdio');
}

main().catch((err) => {
  console.error('[boost] Fatal error:', err);
  process.exit(1);
});
