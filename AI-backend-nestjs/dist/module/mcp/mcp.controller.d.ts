import type { Request, Response } from 'express';
import { McpService } from './mcp.service.js';
export declare class McpController {
    private readonly mcp;
    private readonly onlyLocalhost;
    constructor(mcp: McpService);
    handle(req: Request, res: Response): Promise<void>;
    notAllowed(res: Response): void;
}
