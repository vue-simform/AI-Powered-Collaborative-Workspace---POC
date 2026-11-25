export declare class DocumentStorage {
    private readonly folder;
    constructor(folder: string);
    save(storagePath: string, buffer: Buffer): Promise<void>;
    read(storagePath: string): Promise<NonSharedBuffer>;
    remove(storagePath: string): Promise<void>;
    private fullPath;
}
