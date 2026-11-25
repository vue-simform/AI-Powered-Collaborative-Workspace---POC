import { GenerateTaskDto } from './ai.dto.js';
import { AiService } from './ai.service.js';
export declare class AiController {
    private readonly ai;
    constructor(ai: AiService);
    generateTask(dto: GenerateTaskDto): Promise<import("./ai.result.js").GenerateTaskResult>;
}
