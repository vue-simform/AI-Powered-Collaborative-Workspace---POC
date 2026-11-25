export type TextPart = {
    text: string;
    pageNumber?: number;
    section?: string;
};
export type Chunk = {
    content: string;
    pageNumber: number | null;
    section: string | null;
};
export declare class DocumentError extends Error {
}
export declare function readPdf(buffer: Buffer): Promise<TextPart[]>;
export declare function readDocx(buffer: Buffer): Promise<TextPart[]>;
export declare function splitIntoChunks(parts: TextPart[], size?: number, overlap?: number): Chunk[];
