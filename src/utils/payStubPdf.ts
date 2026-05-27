const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 36;
const BLUE = '2E4057';
const DARK_BLUE = '1A3A5C';
const LIGHT_BLUE = 'D6E4F0';
const LIGHT_GRAY = 'F2F2F2';
const BORDER = 'AAAAAA';
const GREEN = 'D4EDDA';
const GREEN_TEXT = '155724';

type PdfTextOptions = {
  size?: number;
  bold?: boolean;
  color?: string;
  align?: 'left' | 'center' | 'right';
};

export type PayStubPdfField = {
  label: string;
  value: string;
};

export type PayStubPdfConcept = {
  label: string;
  amount: string;
};

export type PayStubPdfData = {
  filename: string;
  companyName: string;
  companyNit: string;
  title: string;
  correlativo: string;
  periodo: string;
  fechaPago: string;
  employeeFields: PayStubPdfField[];
  payrollFields: PayStubPdfField[];
  incomeItems: PayStubPdfConcept[];
  deductionItems: PayStubPdfConcept[];
  totalIncome: string;
  totalDeductions: string;
  netPay: string;
  amountInWords: string;
  employeeName: string;
  employeeDpi: string;
};

const sanitizePdfText = (value: string) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();

const escapePdfString = (value: string) =>
  sanitizePdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const estimateTextWidth = (text: string, size: number) => sanitizePdfText(text).length * size * 0.5;

const splitText = (text: string, maxChars: number) => {
  const words = sanitizePdfText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    current = word;
  });

  if (current) lines.push(current);
  return lines.length ? lines : [''];
};

class PdfPainter {
  private commands: string[] = [];

  rect(x: number, y: number, width: number, height: number, fill = 'FFFFFF', stroke = BORDER) {
    this.commands.push(`q ${this.rgb(fill)} rg ${this.rgb(stroke)} RG ${x} ${y} ${width} ${height} re B Q`);
  }

  line(x1: number, y1: number, x2: number, y2: number, color = BORDER, width = 0.8) {
    this.commands.push(`q ${this.rgb(color)} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S Q`);
  }

  text(text: string, x: number, y: number, maxWidth: number, options: PdfTextOptions = {}) {
    const size = options.size ?? 9;
    const font = options.bold ? 'F2' : 'F1';
    const color = options.color ?? '333333';
    let drawX = x;

    if (options.align === 'right') {
      drawX = x + maxWidth - estimateTextWidth(text, size);
    } else if (options.align === 'center') {
      drawX = x + (maxWidth - estimateTextWidth(text, size)) / 2;
    }

    this.commands.push(`BT /${font} ${size} Tf ${this.rgb(color)} rg ${drawX} ${y} Td (${escapePdfString(text)}) Tj ET`);
  }

  multiline(text: string, x: number, y: number, maxWidth: number, maxChars: number, options: PdfTextOptions = {}) {
    splitText(text, maxChars).forEach((line, index) => {
      this.text(line, x, y - index * ((options.size ?? 9) + 2), maxWidth, options);
    });
  }

  output() {
    return this.commands.join('\n');
  }

  private rgb(hex: string) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
  }
}

const buildPdf = (stream: string) => {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents 4 0 R >>`,
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  const parts = ['%PDF-1.4\n'];
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(parts.join('').length);
    parts.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = parts.join('').length;
  parts.push(`xref\n0 ${objects.length + 1}\n`);
  parts.push('0000000000 65535 f \n');
  offsets.slice(1).forEach((offset) => {
    parts.push(`${String(offset).padStart(10, '0')} 00000 n \n`);
  });
  parts.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return parts.join('');
};

const downloadBlob = (filename: string, pdf: string) => {
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const drawSectionTitle = (pdf: PdfPainter, title: string, y: number, width = PAGE_WIDTH - MARGIN * 2) => {
  pdf.rect(MARGIN, y, width, 20, BLUE, BLUE);
  pdf.text(title, MARGIN, y + 6, width, { size: 9, bold: true, color: 'FFFFFF', align: 'center' });
};

const drawFieldGrid = (pdf: PdfPainter, fields: PayStubPdfField[], y: number) => {
  const labelWidth = 104;
  const valueWidth = 158;
  const rowHeight = 22;
  const gap = 8;
  const leftX = MARGIN;
  const rightX = MARGIN + labelWidth + valueWidth + gap;

  fields.forEach((field, index) => {
    const isRight = index % 2 === 1;
    const row = Math.floor(index / 2);
    const x = isRight ? rightX : leftX;
    const cellY = y - row * rowHeight;

    pdf.rect(x, cellY, labelWidth, rowHeight, LIGHT_BLUE, BORDER);
    pdf.rect(x + labelWidth, cellY, valueWidth, rowHeight, 'FFFFFF', BORDER);
    pdf.text(field.label, x + 6, cellY + 8, labelWidth - 12, { size: 8, bold: true, color: DARK_BLUE });
    pdf.multiline(field.value, x + labelWidth + 6, cellY + 8, valueWidth - 12, 25, { size: 8 });
  });

  return y - Math.ceil(fields.length / 2) * rowHeight;
};

const drawConceptTable = (pdf: PdfPainter, data: PayStubPdfData, y: number) => {
  const colW = [150, 70, 150, 70];
  const x = MARGIN;
  const rowHeight = 21;
  const incomeRows = data.incomeItems.length ? data.incomeItems : [{ label: 'Sin ingresos registrados', amount: '' }];
  const deductionRows = data.deductionItems.length ? data.deductionItems : [{ label: 'Sin deducciones registradas', amount: '' }];
  const rows = Math.max(incomeRows.length, deductionRows.length);

  pdf.rect(x, y, colW[0] + colW[1], rowHeight, BLUE, BORDER);
  pdf.rect(x + colW[0] + colW[1], y, colW[2] + colW[3], rowHeight, BLUE, BORDER);
  pdf.text('INGRESOS / DEVENGOS', x, y + 7, colW[0] + colW[1], { size: 8, bold: true, color: 'FFFFFF', align: 'center' });
  pdf.text('DEDUCCIONES', x + colW[0] + colW[1], y + 7, colW[2] + colW[3], { size: 8, bold: true, color: 'FFFFFF', align: 'center' });

  for (let index = 0; index < rows; index += 1) {
    const rowY = y - rowHeight * (index + 1);
    const income = incomeRows[index];
    const deduction = deductionRows[index];
    const fill = index % 2 === 0 ? LIGHT_GRAY : 'FFFFFF';

    pdf.rect(x, rowY, colW[0], rowHeight, fill, BORDER);
    pdf.rect(x + colW[0], rowY, colW[1], rowHeight, 'FFFFFF', BORDER);
    pdf.rect(x + colW[0] + colW[1], rowY, colW[2], rowHeight, fill, BORDER);
    pdf.rect(x + colW[0] + colW[1] + colW[2], rowY, colW[3], rowHeight, 'FFFFFF', BORDER);
    pdf.text(income?.label ?? '', x + 6, rowY + 7, colW[0] - 12, { size: 8 });
    pdf.text(income?.amount ?? '', x + colW[0] + 6, rowY + 7, colW[1] - 12, { size: 8, align: 'right' });
    pdf.text(deduction?.label ?? '', x + colW[0] + colW[1] + 6, rowY + 7, colW[2] - 12, { size: 8 });
    pdf.text(deduction?.amount ?? '', x + colW[0] + colW[1] + colW[2] + 6, rowY + 7, colW[3] - 12, { size: 8, align: 'right' });
  }

  const totalY = y - rowHeight * (rows + 1);
  pdf.rect(x, totalY, colW[0], rowHeight, DARK_BLUE, BORDER);
  pdf.rect(x + colW[0], totalY, colW[1], rowHeight, LIGHT_BLUE, BORDER);
  pdf.rect(x + colW[0] + colW[1], totalY, colW[2], rowHeight, DARK_BLUE, BORDER);
  pdf.rect(x + colW[0] + colW[1] + colW[2], totalY, colW[3], rowHeight, LIGHT_BLUE, BORDER);
  pdf.text('TOTAL INGRESOS:', x + 6, totalY + 7, colW[0] - 12, { size: 8, bold: true, color: 'FFFFFF', align: 'right' });
  pdf.text(data.totalIncome, x + colW[0] + 6, totalY + 7, colW[1] - 12, { size: 8, bold: true, color: DARK_BLUE, align: 'right' });
  pdf.text('TOTAL DEDUCCIONES:', x + colW[0] + colW[1] + 6, totalY + 7, colW[2] - 12, { size: 8, bold: true, color: 'FFFFFF', align: 'right' });
  pdf.text(data.totalDeductions, x + colW[0] + colW[1] + colW[2] + 6, totalY + 7, colW[3] - 12, { size: 8, bold: true, color: DARK_BLUE, align: 'right' });

  return totalY - rowHeight;
};

const drawNetPay = (pdf: PdfPainter, data: PayStubPdfData, y: number) => {
  pdf.rect(MARGIN, y, 386, 24, DARK_BLUE, BORDER);
  pdf.rect(MARGIN + 386, y, 154, 24, GREEN, BORDER);
  pdf.text('NETO A PAGAR:', MARGIN + 8, y + 8, 370, { size: 10, bold: true, color: 'FFFFFF', align: 'right' });
  pdf.text(data.netPay, MARGIN + 394, y + 8, 138, { size: 10, bold: true, color: GREEN_TEXT, align: 'right' });
  pdf.rect(MARGIN, y - 24, 540, 24, 'F8F9FA', BORDER);
  pdf.text(`Son: ${data.amountInWords}`, MARGIN + 8, y - 15, 524, { size: 8, bold: true });
  return y - 50;
};

const drawSignatures = (pdf: PdfPainter, data: PayStubPdfData, y: number) => {
  const w = 160;
  const gap = 30;
  const labels = [
    ['Firma del Empleado', `Nombre: ${data.employeeName}`, `DPI: ${data.employeeDpi || '________________'}`],
    ['Responsable de Nomina', 'Nombre: __________________', 'Sello: __________________'],
    ['Gerencia / Direccion', 'Nombre: __________________', 'Sello: __________________'],
  ];

  labels.forEach((lines, index) => {
    const x = MARGIN + index * (w + gap);
    pdf.line(x, y, x + w, y, BLUE, 1.2);
    pdf.text(lines[0], x, y - 16, w, { size: 8, bold: true, color: BLUE, align: 'center' });
    pdf.text(lines[1], x, y - 32, w, { size: 7, align: 'center' });
    pdf.text(lines[2], x, y - 46, w, { size: 7, align: 'center' });
  });
};

export function downloadPayStubPdf(data: PayStubPdfData) {
  const pdf = new PdfPainter();
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const headerY = PAGE_HEIGHT - MARGIN - 64;

  pdf.rect(MARGIN, headerY, 360, 64, BLUE, BLUE);
  pdf.rect(MARGIN + 360, headerY, 180, 64, LIGHT_BLUE, BLUE);
  pdf.text(data.companyName, MARGIN + 12, headerY + 42, 332, { size: 16, bold: true, color: 'FFFFFF' });
  pdf.text(`NIT: ${data.companyNit}`, MARGIN + 12, headerY + 22, 332, { size: 8, color: 'D0D0D0' });
  pdf.text(data.title, MARGIN + 360, headerY + 44, 180, { size: 13, bold: true, color: DARK_BLUE, align: 'center' });
  pdf.text(`No. Correlativo: ${data.correlativo}`, MARGIN + 360, headerY + 28, 180, { size: 8, align: 'center' });
  pdf.text(`Periodo: ${data.periodo}`, MARGIN + 360, headerY + 16, 180, { size: 8, align: 'center' });
  pdf.text(`Fecha de Pago: ${data.fechaPago}`, MARGIN + 360, headerY + 4, 180, { size: 8, align: 'center' });

  let y = headerY - 34;
  drawSectionTitle(pdf, 'DATOS DEL EMPLEADO', y, contentWidth);
  y = drawFieldGrid(pdf, data.employeeFields, y - 22) - 14;

  drawSectionTitle(pdf, 'DATOS DE NOMINA', y, contentWidth);
  y = drawFieldGrid(pdf, data.payrollFields, y - 22) - 14;

  drawSectionTitle(pdf, 'DETALLE DE INGRESOS Y DEDUCCIONES', y, contentWidth);
  y = drawConceptTable(pdf, data, y - 24) - 12;

  y = drawNetPay(pdf, data, y);
  drawSignatures(pdf, data, y - 28);

  pdf.line(MARGIN, 34, MARGIN + contentWidth, 34, BORDER);
  pdf.text('Documento generado por el Sistema de Gestion de Nominas | Valido con firma y sello originales', MARGIN, 20, contentWidth, {
    size: 7,
    color: '888888',
    align: 'center',
  });

  downloadBlob(data.filename, buildPdf(pdf.output()));
}
