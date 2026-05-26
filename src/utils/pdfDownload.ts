const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 48;
const MARGIN_TOP = 56;
const LINE_HEIGHT = 14;
const MAX_CHARS_PER_LINE = 92;
const MAX_LINES_PER_PAGE = Math.floor((PAGE_HEIGHT - MARGIN_TOP * 2) / LINE_HEIGHT);

const sanitizePdfText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\n\r\t]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const escapePdfString = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const wrapLine = (line: string) => {
  const words = sanitizePdfText(line).split(/\s+/).filter(Boolean);
  const wrapped: string[] = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= MAX_CHARS_PER_LINE) {
      current = next;
      return;
    }

    if (current) wrapped.push(current);
    current = word;
  });

  if (current) wrapped.push(current);
  return wrapped.length > 0 ? wrapped : [''];
};

const chunkLines = (lines: string[]) => {
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += MAX_LINES_PER_PAGE) {
    pages.push(lines.slice(index, index + MAX_LINES_PER_PAGE));
  }
  return pages.length > 0 ? pages : [['Sin datos visibles para exportar.']];
};

function buildPdf(lines: string[]) {
  const pages = chunkLines(lines);
  const objects: string[] = [];

  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(`<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`);

  pages.forEach((pageLines, pageIndex) => {
    const pageObjectNumber = 3 + pageIndex * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const streamLines = pageLines.map((line, lineIndex) => {
      const y = PAGE_HEIGHT - MARGIN_TOP - lineIndex * LINE_HEIGHT;
      return `BT /F1 10 Tf ${MARGIN_X} ${y} Td (${escapePdfString(line)}) Tj ET`;
    });
    const stream = streamLines.join('\n');

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentObjectNumber} 0 R >>`
    );
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  const bodyParts: string[] = ['%PDF-1.4\n'];
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(bodyParts.join('').length);
    bodyParts.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = bodyParts.join('').length;
  bodyParts.push(`xref\n0 ${objects.length + 1}\n`);
  bodyParts.push('0000000000 65535 f \n');
  offsets.slice(1).forEach((offset) => {
    bodyParts.push(`${String(offset).padStart(10, '0')} 00000 n \n`);
  });
  bodyParts.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return bodyParts.join('');
}

export function downloadTextPdf(filename: string, title: string, text: string) {
  const lines = [
    title,
    `Generado: ${new Date().toLocaleString('es-GT')}`,
    '',
    ...text
      .split(/\n+/)
      .flatMap((line) => wrapLine(line))
      .filter((line) => line.trim().length > 0),
  ];
  const pdf = buildPdf(lines);
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadElementPdf(filename: string, title: string, selector = '[data-report-pdf-root]') {
  const element = document.querySelector<HTMLElement>(selector);
  const text = element?.innerText || document.body.innerText || '';
  downloadTextPdf(filename, title, text);
}
