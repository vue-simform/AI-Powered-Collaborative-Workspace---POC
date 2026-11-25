export type UploadedFile = {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
};
declare const FILE_TYPES: {
    pdf: {
        mime: string;
        firstBytes: number[];
    };
    docx: {
        mime: string;
        firstBytes: number[];
    };
};
export type FileType = keyof typeof FILE_TYPES;
export declare function checkFileType(file: UploadedFile): FileType;
export {};
