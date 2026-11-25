import { BadRequestException } from '@nestjs/common';
const FILE_TYPES = {
    pdf: { mime: 'application/pdf', firstBytes: [0x25, 0x50, 0x44, 0x46] },
    docx: {
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        firstBytes: [0x50, 0x4b, 0x03, 0x04],
    },
};
export function checkFileType(file) {
    const extension = file.originalname.split('.').pop()?.toLowerCase() ?? '';
    const type = Object.keys(FILE_TYPES).find((t) => t === extension);
    if (!type)
        throw new BadRequestException(`"${file.originalname}" is not supported. Upload PDF or DOCX files only.`);
    const { mime, firstBytes } = FILE_TYPES[type];
    const looksRight = file.mimetype === mime && firstBytes.every((byte, i) => file.buffer[i] === byte);
    if (!looksRight)
        throw new BadRequestException(`"${file.originalname}" is not a valid ${type.toUpperCase()} file (it may be corrupted).`);
    return type;
}
//# sourceMappingURL=document-files.js.map