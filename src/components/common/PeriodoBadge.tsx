import LockIcon from '@mui/icons-material/Lock';
import { Chip, Tooltip } from '@mui/material';
import { normalizePeriodoEstado } from '../../utils/payroll';

interface PeriodoBadgeProps {
  estado?: string;
  label?: string;
}

const estadoLabelMap: Record<string, string> = {
  ABIERTO: 'Abierto',
  EN_REVISION: 'En revisión',
  APROBADO: 'Aprobado',
  CERRADO: 'Cerrado',
};

const PeriodoBadge = ({ estado, label }: PeriodoBadgeProps) => {
  const estadoNormalizado = normalizePeriodoEstado(estado);
  const chipLabel = label ?? estadoLabelMap[estadoNormalizado] ?? 'Sin estado';
  const color =
    estadoNormalizado === 'ABIERTO'
      ? 'success'
      : estadoNormalizado === 'EN_REVISION'
      ? 'warning'
      : estadoNormalizado === 'APROBADO'
      ? 'primary'
      : 'default';

  return (
    <Tooltip title={estadoNormalizado ? `Periodo ${estadoLabelMap[estadoNormalizado]}` : 'Estado no definido'}>
      <Chip
        icon={estadoNormalizado === 'CERRADO' ? <LockIcon fontSize="small" /> : undefined}
        label={chipLabel}
        color={color as 'success' | 'warning' | 'primary' | 'default'}
        size="small"
      />
    </Tooltip>
  );
};

export default PeriodoBadge;
