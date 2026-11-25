import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
export class DocumentStorage {
    folder;
    constructor(folder) {
        this.folder = folder;
    }
    async save(storagePath, buffer) {
        const full = this.fullPath(storagePath);
        await mkdir(path.dirname(full), { recursive: true });
        await writeFile(full, buffer, { flag: 'wx' });
    }
    read(storagePath) {
        return readFile(this.fullPath(storagePath));
    }
    remove(storagePath) {
        return rm(this.fullPath(storagePath), { force: true });
    }
    fullPath(storagePath) {
        const full = path.resolve(this.folder, storagePath);
        if (!full.startsWith(this.folder + path.sep))
            throw new Error('Invalid storage path');
        return full;
    }
}
//# sourceMappingURL=document-storage.js.map