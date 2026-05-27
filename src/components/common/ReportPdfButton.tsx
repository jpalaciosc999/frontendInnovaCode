import type { ReactNode } from 'react';
import Button from '@mui/material/Button';
import type { ButtonProps } from '@mui/material/Button';
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
  startIcon?: ReactNode;
  fallbackToElement?: boolean;
  variant?: ButtonProps['variant'];
  color?: ButtonProps['color'];
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

const getBlobErrorMessage = async (error: unknown) => {
  const fallback = 'No se pudo descargar el PDF desde el servidor.';
  const axiosError = error as { message?: string; response?: { data?: unknown } };
  const responseData = axiosError?.response?.data;

  if (!axiosError?.response && axiosError?.message === 'Network Error') {
    return 'Network Error: no se pudo conectar con el backend. Verifica que el servidor esté levantado y que CORS permita el puerto del frontend.';
  }

  if (responseData instanceof Blob) {
    try {
      const text = await responseData.text();
      const parsed = JSON.parse(text) as { message?: string; error?: string };
      return parsed.message || parsed.error || fallback;
    } catch {
      return fallback;
    }
  }

  if (responseData && typeof responseData === 'object') {
    const data = responseData as { message?: string; error?: string };
    return data.message || data.error || fallback;
  }

  return fallback;
};

export default function ReportPdfButton({
  filename,
  title,
  endpoint,
  params,
  disabled = false,
  label = 'Descargar Reporte',
  startIcon,
  fallbackToElement = true,
  variant = 'contained',
  color = 'error',
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
    } catch (error) {
      if (fallbackToElement) {
        downloadElementPdf(filename, title);
        return;
      }

      window.alert(await getBlobErrorMessage(error));
    }
  };

  return (
    <Button
      variant={variant}
      color={color}
      size="small"
      startIcon={startIcon ?? <PictureAsPdfIcon />}
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
