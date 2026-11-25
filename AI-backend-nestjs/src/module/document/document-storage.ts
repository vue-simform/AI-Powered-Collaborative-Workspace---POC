import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Saves, reads and deletes uploaded files in one private folder on disk.
// Every path is checked, so nothing outside that folder can ever be touched.
export class DocumentStorage {
  constructor(private readonly folder: string) {}

  // Writes the file to disk, creating the project folder if needed.
  async save(storagePath: string, buffer: Buffer) {
    const full = this.fullPath(storagePath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, buffer, { flag: 'wx' }); // 'wx': never overwrite an existing file
  }

  // Reads a saved file back.
  read(storagePath: string) {
    return readFile(this.fullPath(storagePath));
  }

  // Deletes a saved file. It is fine if the file is already gone.
  remove(storagePath: string) {
    return rm(this.fullPath(storagePath), { force: true });
  }

  // The full path on disk. Refuses any path that would leave the documents folder.
  private fullPath(storagePath: string) {
    const full = path.resolve(this.folder, storagePath);
    if (!full.startsWith(this.folder + path.sep)) throw new Error('Invalid storage path');
    return full;
  }
}
