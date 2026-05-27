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

type Sat1901Row = {
  nit: string;
  nombre: string;
  monto: number;
  deducciones: number;
  rentaNeta: number;
  isr: number;
};

type Sat1901Data = {
  filename: string;
  fecha: string;
  anio: number;
  contribuyenteNit: string;
  contribuyenteNombre: string;
  patronoNit: string;
  patronoNombre: string;
  totalRentasBrutas: number;
  indemnizacionMuerte: number;
  indemnizacionTiempo: number;
  remuneracionesDiplomaticas: number;
  gastosRepresentacion: number;
  aguinaldo: number;
  bono14: number;
  totalRentasExentas: number;
  rentaNeta: number;
  igssLaboral: number;
  creditoIva: number;
  minimoVital: number;
  rentaImponible: number;
  isrDeterminado: number;
  rows: Sat1901Row[];
};

const pdfEscape = (value: string) =>
  sanitizePdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

function money(value: number) {
  return Number(value || 0).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildPdfFromStreams(streams: string[]) {
  const objects: string[] = [];

  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(`<< /Type /Pages /Kids [${streams.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${streams.length} >>`);

  streams.forEach((stream, index) => {
    const pageObjectNumber = 3 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${contentObjectNumber} 0 R >>`
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

function createPdfPainter() {
  const commands: string[] = [];
  const yPdf = (y: number) => PAGE_HEIGHT - y;

  const rect = (x: number, y: number, width: number, height: number, fill = false) => {
    commands.push(`${x} ${yPdf(y + height)} ${width} ${height} re ${fill ? 'f' : 'S'}`);
  };

  const line = (x1: number, y1: number, x2: number, y2: number) => {
    commands.push(`${x1} ${yPdf(y1)} m ${x2} ${yPdf(y2)} l S`);
  };

  const text = (
    value: string,
    x: number,
    y: number,
    size = 8,
    options: { bold?: boolean; width?: number; align?: 'left' | 'center' | 'right' } = {}
  ) => {
    const font = options.bold ? 'F2' : 'F1';
    const clean = pdfEscape(value);
    const textWidth = clean.length * size * 0.5;
    let tx = x;

    if (options.align === 'center' && options.width) tx = x + Math.max(0, (options.width - textWidth) / 2);
    if (options.align === 'right' && options.width) tx = x + Math.max(0, options.width - textWidth - 2);

    commands.push(`BT /${font} ${size} Tf ${tx} ${yPdf(y + size)} Td (${clean}) Tj ET`);
  };

  const filled = (x: number, y: number, width: number, height: number, gray = 0.94) => {
    commands.push(`${gray} g`);
    rect(x, y, width, height, true);
    commands.push('0 g');
    rect(x, y, width, height);
  };

  return { commands, rect, line, text, filled };
}

export function downloadSat1901Pdf(data: Sat1901Data) {
  const left = 28;
  const width = PAGE_WIDTH - 56;
  const page1 = createPdfPainter();

  page1.text(data.fecha, left, 14, 7);
  page1.text('Calculo ISR Asalariados - Portal SAT', left, 14, 7, { width, align: 'center' });

  page1.rect(left, 28, width, 66);
  page1.rect(left, 28, 115, 66);
  page1.text('SAT', left + 22, 48, 24, { bold: true });
  page1.text('Superintendencia de Administracion Tributaria', left + 10, 75, 6);
  page1.rect(left + 115, 28, 310, 66);
  page1.text('DECLARACION JURADA ANTE EL', left + 130, 39, 15, { bold: true, width: 280, align: 'center' });
  page1.text('PATRONO', left + 130, 57, 15, { bold: true, width: 280, align: 'center' });
  page1.text('DEL IMPUESTO SOBRE LA RENTA', left + 130, 78, 10, { width: 280, align: 'center' });
  page1.rect(left + 425, 28, width - 425, 66);
  page1.text('SAT-1901', left + 438, 42, 17, { bold: true });
  page1.text('Release 1.0', left + 463, 62, 8);
  page1.text(`No. ${String(Date.now()).slice(-10)}`, left + 445, 82, 7);

  page1.rect(left, 110, width, 44);
  page1.line(left + 120, 110, left + 120, 154);
  page1.text('NIT del Contribuyente', left + 8, 122, 8, { bold: true, width: 104, align: 'center' });
  page1.text(data.contribuyenteNit, left + 8, 143, 8, { width: 104, align: 'center' });
  page1.text('Apellidos y Nombres', left + 125, 122, 8, { bold: true, width: width - 130, align: 'center' });
  page1.text(data.contribuyenteNombre, left + 125, 143, 8, { width: width - 130, align: 'center' });

  page1.rect(left, 176, width, 24);
  page1.line(left + 120, 176, left + 120, 200);
  page1.text(`Anio: ${data.anio}`, left + 128, 191, 8, { bold: true });

  page1.rect(left, 224, width, 363);
  page1.text('RENTAS BRUTAS', left, 243, 11, { bold: true, width, align: 'center' });
  page1.rect(left, 262, width, 22);
  page1.line(left + 75, 262, left + 75, 587);
  page1.line(left + 430, 262, left + 430, 587);
  page1.text('NIT', left, 276, 7, { bold: true, width: 75, align: 'center' });
  page1.text('Nombre Razon o Denominacion Social', left + 75, 276, 7, { bold: true, width: 355, align: 'center' });
  page1.text('Monto', left + 430, 276, 7, { bold: true, width: width - 430, align: 'center' });
  page1.line(left, 306, left + width, 306);
  page1.text('Patrono ante quien presenta la declaracion:', left + 75, 300, 7, { bold: true, width: 355, align: 'center' });
  page1.line(left, 328, left + width, 328);
  page1.text(data.patronoNit, left, 322, 7, { width: 75, align: 'center' });
  page1.text(data.patronoNombre, left + 75, 322, 7, { width: 355, align: 'center' });
  page1.text(money(data.totalRentasBrutas), left + 430, 322, 7, { width: width - 430, align: 'right' });
  page1.line(left, 348, left + width, 348);
  page1.text('Detalle de otros patronos:', left + 75, 342, 7, { bold: true, width: 355, align: 'center' });
  for (let y = 370; y <= 430; y += 20) page1.line(left, y, left + width, y);
  page1.line(left, 450, left + width, 450);
  page1.text('Detalle de otros expatronos:', left + 75, 444, 7, { bold: true, width: 355, align: 'center' });
  for (let y = 470; y <= 550; y += 20) page1.line(left, y, left + width, y);
  page1.text('TOTAL RENTAS BRUTAS:', left + 4, 580, 8, { bold: true });
  page1.text(money(data.totalRentasBrutas), left + 430, 580, 8, { width: width - 430, align: 'right' });

  page1.rect(left, 610, width, 260);
  page1.text('DETERMINACION DE LA RENTA NETA', left, 632, 11, { bold: true, width, align: 'center' });
  const netRows = [
    ['Indemnizaciones o Pensiones por causa de muerte o incapacidad', data.indemnizacionMuerte],
    ['Indemnizaciones por tiempo servido', data.indemnizacionTiempo],
    ['Remuneraciones de diplomaticos y agentes consulares y demas representantes', data.remuneracionesDiplomaticas],
    ['Gastos de representacion y viaticos comprobables, dentro y fuera del pais', data.gastosRepresentacion],
    ['Aguinaldo hasta el (100%) del sueldo o salario ordinario mensual', data.aguinaldo],
    ['Bonificacion anual (Bono 14) de trabajadores, hasta el (100%) del sueldo', data.bono14],
    ['Total Rentas exentas', data.totalRentasExentas],
    ['(=) Renta Neta', data.rentaNeta],
  ];
  let ny = 650;
  netRows.forEach(([label, value]) => {
    page1.line(left, ny + 22, left + width, ny + 22);
    page1.text(String(label), left + 4, ny + 15, 7, { bold: String(label).startsWith('Total') || String(label).startsWith('(=)') });
    page1.rect(left + 318, ny + 5, 105, 16);
    page1.text(money(Number(value)), left + 318, ny + 17, 7, { width: 105, align: 'right' });
    page1.line(left + 430, ny, left + 430, ny + 22);
    ny += 22;
  });
  page1.text('https://portal.sat.gob.gt/portal/calculo-isr-asalariados/', left, 828, 6);
  page1.text('1/2', left + width - 18, 828, 7);

  const page2 = createPdfPainter();
  page2.text(data.fecha, left, 14, 7);
  page2.text('Calculo ISR Asalariados - Portal SAT', left, 14, 7, { width, align: 'center' });
  page2.rect(left, 28, width, 80);
  page2.text('SAT-1901', left + width - 90, 48, 16, { bold: true });
  page2.text('DETERMINACION DEL IMPUESTO', left, 64, 14, { bold: true, width, align: 'center' });
  page2.text(`Periodo fiscal ${data.anio}`, left, 86, 9, { width, align: 'center' });

  page2.rect(left, 128, width, 168);
  const taxRows = [
    ['IGSS laboral deducible', data.igssLaboral],
    ['Credito IVA facturas', data.creditoIva],
    ['Minimo vital', data.minimoVital],
    ['Renta imponible', data.rentaImponible],
    ['ISR determinado', data.isrDeterminado],
  ];
  let ty = 145;
  taxRows.forEach(([label, value]) => {
    page2.line(left, ty + 24, left + width, ty + 24);
    page2.text(String(label), left + 8, ty + 16, 8, { bold: String(label).includes('ISR') || String(label).includes('imponible') });
    page2.rect(left + 360, ty + 4, 140, 17);
    page2.text(money(Number(value)), left + 360, ty + 17, 8, { width: 140, align: 'right' });
    ty += 28;
  });

  page2.text('DETALLE DE CONTRIBUYENTES', left, 328, 11, { bold: true, width, align: 'center' });
  page2.rect(left, 348, width, 22);
  page2.line(left + 70, 348, left + 70, 770);
  page2.line(left + 270, 348, left + 270, 770);
  page2.line(left + 350, 348, left + 350, 770);
  page2.line(left + 440, 348, left + 440, 770);
  page2.text('NIT', left, 362, 7, { bold: true, width: 70, align: 'center' });
  page2.text('Apellidos y Nombres', left + 70, 362, 7, { bold: true, width: 200, align: 'center' });
  page2.text('Renta bruta', left + 270, 362, 7, { bold: true, width: 80, align: 'center' });
  page2.text('Renta neta', left + 350, 362, 7, { bold: true, width: 90, align: 'center' });
  page2.text('ISR', left + 440, 362, 7, { bold: true, width: width - 440, align: 'center' });

  let rowY = 392;
  data.rows.slice(0, 18).forEach((row) => {
    page2.line(left, rowY, left + width, rowY);
    page2.text(row.nit, left + 2, rowY - 6, 6, { width: 66, align: 'center' });
    page2.text(row.nombre, left + 74, rowY - 6, 6);
    page2.text(money(row.monto), left + 270, rowY - 6, 6, { width: 78, align: 'right' });
    page2.text(money(row.rentaNeta), left + 350, rowY - 6, 6, { width: 88, align: 'right' });
    page2.text(money(row.isr), left + 440, rowY - 6, 6, { width: width - 442, align: 'right' });
    rowY += 22;
  });
  for (; rowY <= 770; rowY += 22) page2.line(left, rowY, left + width, rowY);
  page2.text('2/2', left + width - 18, 828, 7);

  const pdf = buildPdfFromStreams([page1.commands.join('\n'), page2.commands.join('\n')]);
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = data.filename.endsWith('.pdf') ? data.filename : `${data.filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
