import { Controller, Delete, Get, HttpCode, Param, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { UploadedFile } from './document-files.js';
import { DocumentService } from './document.service.js';

// Upload limits, so nobody can flood the server. MAX_UPLOAD_MB can be set in the .env file.
const MAX_FILES = 10; // per upload
const MAX_BYTES = Number(process.env.MAX_UPLOAD_MB ?? 10) * 1024 * 1024; // per file

// All routes live under /projects/<id>/documents, so every document belongs to one project.
@Controller('projects/:projectId/documents')
// Only logged-in users (valid JWT) may use these routes.
@UseGuards(JwtAuthGuard)
export class DocumentController {
  // Nest injects the DocumentService, which does the real work.
  constructor(private readonly documents: DocumentService) {}

  // GET: list all documents of the project.
  @Get()
  list(@Param('projectId') projectId: string) {
    return this.documents.list(projectId);
  }

  // POST: upload one or more files (form field name 'files'). The interceptor reads the files from the request
  // and enforces the size/count limits before our method runs.
  @Post()
  @UseInterceptors(FilesInterceptor('files', MAX_FILES, { limits: { fileSize: MAX_BYTES, files: MAX_FILES } }))
  upload(
    @Param('projectId') projectId: string,
    @UploadedFiles() files: UploadedFile[],
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.documents.upload(projectId, files, req.user.id);
  }

  // DELETE: remove one document. 204 = success with no response body.
  @Delete(':documentId')
  @HttpCode(204)
  remove(@Param('projectId') projectId: string, @Param('documentId') documentId: string) {
    return this.documents.remove(projectId, documentId);
  }

  // POST: try processing a failed document again.
  @Post(':documentId/retry')
  @HttpCode(200)
  retry(@Param('projectId') projectId: string, @Param('documentId') documentId: string) {
    return this.documents.retry(projectId, documentId);
  }
}
