import type { Request } from 'express';
import type { UploadedFile } from './document-files.js';
import { DocumentService } from './document.service.js';
export declare class DocumentController {
    private readonly documents;
    constructor(documents: DocumentService);
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
    upload(projectId: string, files: UploadedFile[], req: Request & {
        user: {
            id: string;
        };
    }): Promise<{
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
}
