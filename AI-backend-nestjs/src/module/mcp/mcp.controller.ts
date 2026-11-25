import { Controller, Delete, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { localhostHostValidation, NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { McpService } from './mcp.service.js';

// The one door for MCP: POST /api/mcp (the global prefix adds "/api").
// This controller does no thinking. It only hands each request to the MCP library, which talks to the AI app.
// There is no login guard on purpose: Claude Code does not send our login cookie. For now this route only accepts
// requests that come from this computer (see the host check below), and its tools will be read-only.
@Controller('mcp')
export class McpController {
  // A ready-made check that only accepts the host names "localhost", "127.0.0.1" and "[::1]".
  // It blocks "DNS rebinding", a trick where a website in your browser tries to reach servers running on your computer.
  private readonly onlyLocalhost = localhostHostValidation();

  constructor(private readonly mcp: McpService) {}

  // Handles every MCP message from the AI app (list the tools, call a tool, ...).
  // @Req/@Res give us the raw Express request and response, because the MCP library writes the response itself.
  @Post()
  async handle(@Req() req: Request, @Res() res: Response) {
    // If the host is not localhost, the check has already answered with 403, so we stop here.
    if (!this.onlyLocalhost(req, res)) return;

    // Stateless mode: a fresh server and transport for each request, nothing shared between requests.
    // sessionIdGenerator: undefined is what switches off sessions.
    const server = this.mcp.createServer();
    const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    // When the response is finished, clean both up so nothing stays open.
    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    try {
      // Connect the server to the transport, then let the transport read the request and write the reply.
      // req.body is passed in because Nest already read and parsed the JSON, and a stream can only be read once.
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch {
      // Only answer if the library has not already started a response.
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
      }
    }
  }

  // Stateless mode has no long-lived stream (GET) and no session to end (DELETE),
  // so we answer "405 Method not allowed" the way the MCP spec describes.
  @Get()
  @Delete()
  notAllowed(@Res() res: Response) {
    res.status(405).set('Allow', 'POST').json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
  }
}
