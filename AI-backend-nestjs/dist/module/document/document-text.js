import mammoth from 'mammoth';
import { extractText, getDocumentProxy } from 'unpdf';
export class DocumentError extends Error {
}
export async function readPdf(buffer) {
    try {
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        const { text } = await extractText(pdf, { mergePages: false });
        return text.map((pageText, i) => ({ text: pageText, pageNumber: i + 1 }));
    }
    catch {
        throw new DocumentError('The PDF could not be read (it may be corrupted or password-protected).');
    }
}
export async function readDocx(buffer) {
    try {
        const { value: html } = await mammoth.convertToHtml({ buffer });
        const parts = [];
        let section;
        let lastEnd = 0;
        const addText = (fragment) => {
            const text = htmlToText(fragment);
            if (text)
                parts.push({ text, section });
        };
        for (const heading of html.matchAll(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gis)) {
            addText(html.slice(lastEnd, heading.index));
            section = htmlToText(heading[1]) || undefined;
            lastEnd = heading.index + heading[0].length;
        }
        addText(html.slice(lastEnd));
        return parts;
    }
    catch {
        throw new DocumentError('The DOCX could not be read (it may be corrupted).');
    }
}
function htmlToText(html) {
    return html
        .replace(/<\/(p|li|tr|div)>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim())
        .filter(Boolean)
        .join('\n');
}
export function splitIntoChunks(parts, size = 2000, overlap = 200) {
    const chunks = [];
    for (const part of parts) {
        const text = part.text.trim();
        const source = { pageNumber: part.pageNumber ?? null, section: part.section ?? null };
        for (let start = 0; start < text.length; start += size - overlap) {
            chunks.push({ content: text.slice(start, start + size).trim(), ...source });
            if (start + size >= text.length)
                break;
        }
    }
    return chunks;
}
//# sourceMappingURL=document-text.js.map