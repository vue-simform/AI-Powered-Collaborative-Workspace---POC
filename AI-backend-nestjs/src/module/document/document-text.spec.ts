import { splitIntoChunks } from './document-text.js';

describe('splitIntoChunks', () => {
  it('keeps the page number and section of the source', () => {
    const chunks = splitIntoChunks([
      { text: 'Email is mandatory.', pageNumber: 4 },
      { text: 'Passwords need 8 characters.', section: 'Passwords' },
    ]);
    expect(chunks).toEqual([
      { content: 'Email is mandatory.', pageNumber: 4, section: null },
      { content: 'Passwords need 8 characters.', pageNumber: null, section: 'Passwords' },
    ]);
  });

  it('never mixes two pages in one chunk', () => {
    const chunks = splitIntoChunks([{ text: 'one', pageNumber: 1 }, { text: 'two', pageNumber: 2 }]);
    expect(chunks.map((c) => [c.content, c.pageNumber])).toEqual([['one', 1], ['two', 2]]);
  });

  it('splits long text into chunks of at most the size, with overlap', () => {
    const paragraph = (n: number) => `Paragraph ${n} ` + 'word '.repeat(40);
    const text = Array.from({ length: 12 }, (_, i) => paragraph(i)).join('\n');
    const chunks = splitIntoChunks([{ text, pageNumber: 1 }], 500, 80);
    expect(chunks.length).toBeGreaterThan(3);
    expect(chunks.every((c) => c.content.length <= 500)).toBe(true);
    expect(chunks.every((c) => c.pageNumber === 1)).toBe(true);
    // overlap: the start of a chunk repeats the tail of the previous one
    const tail = chunks[0].content.slice(-30).split(' ').slice(-2).join(' ');
    expect(chunks[1].content).toContain(tail);
  });

  it('cuts text that has no line breaks at all', () => {
    expect(splitIntoChunks([{ text: 'abc '.repeat(600) }], 300, 50).length).toBeGreaterThan(5);
  });

  it('ignores empty text', () => {
    expect(splitIntoChunks([{ text: '  \n \n ' }])).toEqual([]);
  });
});
