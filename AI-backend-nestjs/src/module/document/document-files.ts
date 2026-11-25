import { BadRequestException } from '@nestjs/common';

// The part of an uploaded file (Multer memory storage) that we use.
export type UploadedFile = { originalname: string; mimetype: string; size: number; buffer: Buffer };

// The file types we accept. A real file must match on all three: extension, MIME type and first bytes.
const FILE_TYPES = {
  pdf: { mime: 'application/pdf', firstBytes: [0x25, 0x50, 0x44, 0x46] }, // starts with "%PDF"
  docx: {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    firstBytes: [0x50, 0x4b, 0x03, 0x04], // a DOCX is a zip file
  },
};
// 'pdf' | 'docx': the keys of FILE_TYPES.
export type FileType = keyof typeof FILE_TYPES;

// Accepts the file only if its extension, MIME type and first bytes all say PDF or DOCX. Returns 'pdf' or 'docx'.
export function checkFileType(file: UploadedFile): FileType {
  const extension = file.originalname.split('.').pop()?.toLowerCase() ?? '';
  const type = (Object.keys(FILE_TYPES) as FileType[]).find((t) => t === extension);
  if (!type) throw new BadRequestException(`"${file.originalname}" is not supported. Upload PDF or DOCX files only.`);

  const { mime, firstBytes } = FILE_TYPES[type];
  const looksRight = file.mimetype === mime && firstBytes.every((byte, i) => file.buffer[i] === byte);
  if (!looksRight) throw new BadRequestException(`"${file.originalname}" is not a valid ${type.toUpperCase()} file (it may be corrupted).`);
  return type;
}
