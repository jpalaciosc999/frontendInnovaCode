import Button from '@mui/material/Button';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import { downloadElementPdf } from '../../utils/pdfDownload';
import api from '../../api/axios';

type ReportPdfButtonProps = {
  filename: string;
  title: string;
  endpoint?: string;
  params?: Record<string, unknown>;
  disabled?: boolean;
  label?: string;
};

const getFilenameFromDisposition = (disposition: unknown) => {
  if (typeof disposition !== 'string') return '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? '';
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function ReportPdfButton({
  filename,
  title,
  endpoint,
  params,
  disabled = false,
  label = 'Descargar PDF',
}: ReportPdfButtonProps) {
  const handleDownload = async () => {
    if (!endpoint) {
      downloadElementPdf(filename, title);
      return;
    }

    try {
      const response = await api.get(endpoint, {
        params,
        responseType: 'blob',
      });
      const backendFilename = getFilenameFromDisposition(response.headers['content-disposition']);
      downloadBlob(new Blob([response.data], { type: 'application/pdf' }), backendFilename || filename);
    } catch {
      downloadElementPdf(filename, title);
    }
  };

  return (
    <Button
      variant="contained"
      color="error"
      size="small"
      startIcon={<PictureAsPdfIcon />}
      disabled={disabled}
      onClick={handleDownload}
      sx={{
        minWidth: 148,
        borderRadius: 1,
        fontWeight: 700,
        textTransform: 'none',
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
      }}
    >
      {label}
    </Button>
  );
}
