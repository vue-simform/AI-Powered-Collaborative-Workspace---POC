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
import { Controller, Delete, Get, HttpCode, Param, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { DocumentService } from './document.service.js';
const MAX_FILES = 10;
const MAX_BYTES = Number(process.env.MAX_UPLOAD_MB ?? 10) * 1024 * 1024;
let DocumentController = class DocumentController {
    documents;
    constructor(documents) {
        this.documents = documents;
    }
    list(projectId) {
        return this.documents.list(projectId);
    }
    upload(projectId, files, req) {
        return this.documents.upload(projectId, files, req.user.id);
    }
    remove(projectId, documentId) {
        return this.documents.remove(projectId, documentId);
    }
    retry(projectId, documentId) {
        return this.documents.retry(projectId, documentId);
    }
};
__decorate([
    Get(),
    __param(0, Param('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "list", null);
__decorate([
    Post(),
    UseInterceptors(FilesInterceptor('files', MAX_FILES, { limits: { fileSize: MAX_BYTES, files: MAX_FILES } })),
    __param(0, Param('projectId')),
    __param(1, UploadedFiles()),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "upload", null);
__decorate([
    Delete(':documentId'),
    HttpCode(204),
    __param(0, Param('projectId')),
    __param(1, Param('documentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "remove", null);
__decorate([
    Post(':documentId/retry'),
    HttpCode(200),
    __param(0, Param('projectId')),
    __param(1, Param('documentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "retry", null);
DocumentController = __decorate([
    Controller('projects/:projectId/documents'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [DocumentService])
], DocumentController);
export { DocumentController };
//# sourceMappingURL=document.controller.js.map