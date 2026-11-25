var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Delete, Get, Post, Req, Res } from '@nestjs/common';
import { localhostHostValidation, NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { McpService } from './mcp.service.js';
let McpController = class McpController {
    mcp;
    onlyLocalhost = localhostHostValidation();
    constructor(mcp) {
        this.mcp = mcp;
    }
    async handle(req, res) {
        if (!this.onlyLocalhost(req, res))
            return;
        const server = this.mcp.createServer();
        const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        res.on('close', () => {
            void transport.close();
            void server.close();
        });
        try {
            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        }
        catch {
            if (!res.headersSent) {
                res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
            }
        }
    }
    notAllowed(res) {
        res.status(405).set('Allow', 'POST').json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
    }
};
__decorate([
    Post(),
    __param(0, Req()),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], McpController.prototype, "handle", null);
__decorate([
    Get(),
    Delete(),
    __param(0, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], McpController.prototype, "notAllowed", null);
McpController = __decorate([
    Controller('mcp'),
    __metadata("design:paramtypes", [McpService])
], McpController);
export { McpController };
//# sourceMappingURL=mcp.controller.js.map