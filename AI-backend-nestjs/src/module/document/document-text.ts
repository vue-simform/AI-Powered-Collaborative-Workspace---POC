import mammoth from 'mammoth';
import { extractText, getDocumentProxy } from 'unpdf';

// A piece of text and where it came from: a PDF page, or a DOCX heading.
export type TextPart = { text: string; pageNumber?: number; section?: string };

// A small piece of a document that is stored and searched.
export type Chunk = { content: string; pageNumber: number | null; section: string | null };

// A problem with the file itself. The message is safe to show to the user.
export class DocumentError extends Error {}

// ---------- 1. Read the file ----------

// PDF: one TextPart per page.
export async function readPdf(buffer: Buffer): Promise<TextPart[]> {
  try {
    // Open the PDF and pull out the text of each page.
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: false });
    return text.map((pageText, i) => ({ text: pageText, pageNumber: i + 1 }));
  } catch {
    throw new DocumentError('The PDF could not be read (it may be corrupted or password-protected).');
  }
}

// DOCX has no fixed pages, so we group the text under its headings instead.
export async function readDocx(buffer: Buffer): Promise<TextPart[]> {
  try {
    // mammoth turns the Word file into simple HTML, where headings are <h1>-<h6> tags.
    const { value: html } = await mammoth.convertToHtml({ buffer });
    const parts: TextPart[] = [];
    let section: string | undefined;
    let lastEnd = 0;

    // Small helper: clean a piece of HTML into text and store it under the current section name.
    const addText = (fragment: string) => {
      const text = htmlToText(fragment);
      if (text) parts.push({ text, section });
    };

    // Walk through each heading: text before it belongs to the previous section, the heading starts a new one.
    for (const heading of html.matchAll(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gis)) {
      addText(html.slice(lastEnd, heading.index)); // the text before this heading
      section = htmlToText(heading[1]) || undefined; // the heading becomes the section name
      lastEnd = heading.index + heading[0].length;
    }
    addText(html.slice(lastEnd)); // the text after the last heading
    return parts;
  } catch {
    throw new DocumentError('The DOCX could not be read (it may be corrupted).');
  }
}

// Removes the HTML tags and keeps one line per paragraph.
function htmlToText(html: string) {
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

// ---------- 2. Cut the text into chunks ----------

// Cuts each TextPart into chunks of `size` characters. Each chunk starts `overlap` characters before the previous
// one ended, so a sentence at the edge is not lost. A chunk never mixes two pages or two sections, so its source
// is always exact.
export function splitIntoChunks(parts: TextPart[], size = 2000, overlap = 200): Chunk[] {
  const chunks: Chunk[] = [];

  for (const part of parts) {
    const text = part.text.trim();
    // Every chunk from this part remembers its page or section, so we can cite it later.
    const source = { pageNumber: part.pageNumber ?? null, section: part.section ?? null };

    // Move forward by (size - overlap) each time: chunk 1 is 0-2000, chunk 2 is 1800-3800, and so on.
    for (let start = 0; start < text.length; start += size - overlap) {
      chunks.push({ content: text.slice(start, start + size).trim(), ...source });
      if (start + size >= text.length) break; // the rest of the text is already inside this chunk
    }
  }
  return chunks;
}
