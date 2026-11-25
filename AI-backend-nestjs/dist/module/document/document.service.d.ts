import { OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service.js';
import { ProjectService } from '../project/project.service.js';
import { type UploadedFile } from './document-files.js';
import { KnowledgeService } from './knowledge.service.js';
export declare class DocumentService implements OnApplicationBootstrap {
    private readonly prisma;
    private readonly projects;
    private readonly knowledge;
    private readonly logger;
    private readonly storage;
    constructor(prisma: PrismaService, projects: ProjectService, knowledge: KnowledgeService, config: ConfigService);
    onApplicationBootstrap(): Promise<void>;
    list(projectId: string): Promise<{
        id: string;
        createdAt: Date;
        projectId: string;
        fileName: string;
        fileType: string;
        fileSize: number;
        status: import("@prisma/client").$Enums.DocumentStatus;
        errorMessage: string | null;
        uploadedBy: {
            name: string;
            id: string;
        } | null;
    }[]>;
    upload(projectId: string, files: UploadedFile[] | undefined, userId: string): Promise<{
        id: string;
        createdAt: Date;
        projectId: string;
        fileName: string;
        fileType: string;
        fileSize: number;
        status: import("@prisma/client").$Enums.DocumentStatus;
        errorMessage: string | null;
        uploadedBy: {
            name: string;
            id: string;
        } | null;
    }[]>;
    remove(projectId: string, documentId: string): Promise<void>;
    retry(projectId: string, documentId: string): Promise<{
        id: string;
        createdAt: Date;
        projectId: string;
        fileName: string;
        fileType: string;
        fileSize: number;
        status: import("@prisma/client").$Enums.DocumentStatus;
        errorMessage: string | null;
        uploadedBy: {
            name: string;
            id: string;
        } | null;
    }>;
    process(documentId: string): Promise<void>;
    private findInProject;
    private setStatus;
}
