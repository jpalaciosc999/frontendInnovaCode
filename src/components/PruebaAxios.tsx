import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { Empleado, EmpleadoForm } from '../interfaces/empleados';
import type { Horario } from '../interfaces/horario';
import type { Puesto } from '../interfaces/puestos';
import type { Sede } from '../interfaces/sede';
import type { TipoContrato } from '../interfaces/tipoContrato';
import type { Departamento } from '../interfaces/departamentos';

import {
  obtenerEmpleados,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado
} from '../services/empleados.service';

import { obtenerHorarios } from '../services/horario.service';
import { obtenerPuestos } from '../services/puestos.service';
import { obtenerSedes } from '../services/sede.service';
import { obtenerTiposContrato } from '../services/tipoContrato.service';
import { obtenerDepartamentos } from '../services/departamentos.service';

import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

import type { SelectChangeEvent } from '@mui/material/Select';

import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BadgeIcon from '@mui/icons-material/Badge';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ArticleIcon from '@mui/icons-material/Article';
import { useUnsavedFormGuard } from '../hooks/useUnsavedFormGuard';
import PageHeader from './common/PageHeader';
import SummaryCard from './common/SummaryCard';
import StateBlock from './common/StateBlock';
import DigitField from './common/DigitField';

const initialForm: EmpleadoForm = {
  emp_nombre: '',
  emp_apellido: '',
  emp_dpi: '',
  emp_nit: '',
  emp_telefono: '',
  emp_fecha_contratacion: '',
  emp_estado: '',
  dep_id: '',
  hor_id: '',
  sed_id: '',
  pue_id: '',
  tic_id: '',
  emp_fecha_inicio_contrato: '',
  emp_fecha_fin_contrato: '',
  emp_motivo_cambio_contrato: '',
  emp_sueldo: '',
  emp_foto: ''
};

const getToday = () => new Date().toISOString().slice(0, 10);

const soloDigitos = (valor: string) => valor.replace(/\D+/g, '');
const limitarLongitud = (valor: string, maxLength: number) => valor.slice(0, maxLength);
const normalizarMonto = (valor: number | string | undefined) => Math.round(Number(valor || 0) * 100);

type PhoneCountry = {
  code: string;
  name: string;
  dialCode: string;
  localLength?: number;
};

const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: 'GT', name: 'Guatemala', dialCode: '502', localLength: 8 },
  { code: 'US', name: 'Estados Unidos', dialCode: '1', localLength: 10 },
  { code: 'CA', name: 'Canada', dialCode: '1', localLength: 10 },
  { code: 'MX', name: 'Mexico', dialCode: '52', localLength: 10 },
  { code: 'BZ', name: 'Belice', dialCode: '501' },
  { code: 'SV', name: 'El Salvador', dialCode: '503', localLength: 8 },
  { code: 'HN', name: 'Honduras', dialCode: '504', localLength: 8 },
  { code: 'NI', name: 'Nicaragua', dialCode: '505', localLength: 8 },
  { code: 'CR', name: 'Costa Rica', dialCode: '506', localLength: 8 },
  { code: 'PA', name: 'Panama', dialCode: '507' },
  { code: 'AR', name: 'Argentina', dialCode: '54' },
  { code: 'BO', name: 'Bolivia', dialCode: '591' },
  { code: 'BR', name: 'Brasil', dialCode: '55' },
  { code: 'CL', name: 'Chile', dialCode: '56' },
  { code: 'CO', name: 'Colombia', dialCode: '57' },
  { code: 'EC', name: 'Ecuador', dialCode: '593' },
  { code: 'PY', name: 'Paraguay', dialCode: '595' },
  { code: 'PE', name: 'Peru', dialCode: '51' },
  { code: 'UY', name: 'Uruguay', dialCode: '598' },
  { code: 'VE', name: 'Venezuela', dialCode: '58' },
  { code: 'ES', name: 'Espana', dialCode: '34', localLength: 9 },
  { code: 'FR', name: 'Francia', dialCode: '33' },
  { code: 'DE', name: 'Alemania', dialCode: '49' },
  { code: 'IT', name: 'Italia', dialCode: '39' },
  { code: 'PT', name: 'Portugal', dialCode: '351' },
  { code: 'GB', name: 'Reino Unido', dialCode: '44' },
  { code: 'IE', name: 'Irlanda', dialCode: '353' },
  { code: 'NL', name: 'Paises Bajos', dialCode: '31' },
  { code: 'BE', name: 'Belgica', dialCode: '32' },
  { code: 'CH', name: 'Suiza', dialCode: '41' },
  { code: 'AT', name: 'Austria', dialCode: '43' },
  { code: 'DK', name: 'Dinamarca', dialCode: '45' },
  { code: 'NO', name: 'Noruega', dialCode: '47' },
  { code: 'SE', name: 'Suecia', dialCode: '46' },
  { code: 'FI', name: 'Finlandia', dialCode: '358' },
  { code: 'IS', name: 'Islandia', dialCode: '354' },
  { code: 'PL', name: 'Polonia', dialCode: '48' },
  { code: 'CZ', name: 'Chequia', dialCode: '420' },
  { code: 'SK', name: 'Eslovaquia', dialCode: '421' },
  { code: 'HU', name: 'Hungria', dialCode: '36' },
  { code: 'RO', name: 'Rumania', dialCode: '40' },
  { code: 'BG', name: 'Bulgaria', dialCode: '359' },
  { code: 'GR', name: 'Grecia', dialCode: '30' },
  { code: 'TR', name: 'Turquia', dialCode: '90' },
  { code: 'UA', name: 'Ucrania', dialCode: '380' },
  { code: 'RU', name: 'Rusia', dialCode: '7' },
  { code: 'CN', name: 'China', dialCode: '86' },
  { code: 'JP', name: 'Japon', dialCode: '81' },
  { code: 'KR', name: 'Corea del Sur', dialCode: '82' },
  { code: 'IN', name: 'India', dialCode: '91' },
  { code: 'PK', name: 'Pakistan', dialCode: '92' },
  { code: 'BD', name: 'Bangladesh', dialCode: '880' },
  { code: 'ID', name: 'Indonesia', dialCode: '62' },
  { code: 'PH', name: 'Filipinas', dialCode: '63' },
  { code: 'TH', name: 'Tailandia', dialCode: '66' },
  { code: 'VN', name: 'Vietnam', dialCode: '84' },
  { code: 'MY', name: 'Malasia', dialCode: '60' },
  { code: 'SG', name: 'Singapur', dialCode: '65' },
  { code: 'AU', name: 'Australia', dialCode: '61' },
  { code: 'NZ', name: 'Nueva Zelanda', dialCode: '64' },
  { code: 'ZA', name: 'Sudafrica', dialCode: '27' },
  { code: 'EG', name: 'Egipto', dialCode: '20' },
  { code: 'MA', name: 'Marruecos', dialCode: '212' },
  { code: 'DZ', name: 'Argelia', dialCode: '213' },
  { code: 'NG', name: 'Nigeria', dialCode: '234' },
  { code: 'KE', name: 'Kenia', dialCode: '254' },
  { code: 'IL', name: 'Israel', dialCode: '972' },
  { code: 'AE', name: 'Emiratos Arabes Unidos', dialCode: '971' },
  { code: 'SA', name: 'Arabia Saudita', dialCode: '966' },
  { code: 'QA', name: 'Qatar', dialCode: '974' },
  { code: 'KW', name: 'Kuwait', dialCode: '965' },
  { code: 'DO', name: 'Republica Dominicana', dialCode: '1' },
  { code: 'PR', name: 'Puerto Rico', dialCode: '1' },
  { code: 'CU', name: 'Cuba', dialCode: '53' },
  { code: 'JM', name: 'Jamaica', dialCode: '1' },
  { code: 'HT', name: 'Haiti', dialCode: '509' },
];

const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0];

const getFlagEmoji = (countryCode: string) =>
  countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));

const getPhoneLocalMaxLength = (country: PhoneCountry) =>
  country.localLength ?? Math.max(6, 15 - country.dialCode.length);

const splitPhoneValue = (value: string, country: PhoneCountry) => {
  const digits = soloDigitos(value);
  if (digits.startsWith(country.dialCode) && digits.length > country.dialCode.length) {
    return digits.slice(country.dialCode.length);
  }

  return digits;
};

const buildPhoneValue = (country: PhoneCountry, localPhone: string) => {
  const localDigits = limitarLongitud(soloDigitos(localPhone), getPhoneLocalMaxLength(country));
  return localDigits;
};

const detectPhoneCountry = (value: string) => {
  const digits = soloDigitos(value);
  if (digits.length === 8) return DEFAULT_PHONE_COUNTRY;

  return PHONE_COUNTRIES
    .slice()
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => digits.length > country.dialCode.length && digits.startsWith(country.dialCode)) ?? DEFAULT_PHONE_COUNTRY;
};

type ContratoEmpleadoSnapshot = {
  tic_id: string;
  fecha_inicio: string;
  fecha_fin: string;
};

const initialFilters = {
  busqueda: '',
  estado: '',
  horId: '',
  sedId: '',
  pueId: '',
  ticId: ''
};

const EMPLOYEE_TABLE_LIMIT = 75;

const obtenerMimeImagen = (bytes: Uint8Array) => {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  return 'image/jpeg';
};

const bytesABase64 = (bytes: Uint8Array) => {
  let binario = '';
  bytes.forEach((byte) => {
    binario += String.fromCharCode(byte);
  });
  return btoa(binario);
};

const normalizarFotoEmpleado = (foto?: Empleado['EMP_FOTO']) => {
  if (!foto) return '';

  if (typeof foto === 'string') {
    const valor = foto.trim();
    if (!valor) return '';
    if (valor.startsWith('data:image/')) return valor;
    if (valor.startsWith('http://') || valor.startsWith('https://')) return valor;
    return `data:image/jpeg;base64,${valor}`;
  }

  if (Array.isArray(foto.data) && foto.data.length > 0) {
    const bytes = new Uint8Array(foto.data);
    const texto = new TextDecoder().decode(bytes).trim();

    if (texto.startsWith('data:image/')) return texto;

    return `data:${obtenerMimeImagen(bytes)};base64,${bytesABase64(bytes)}`;
  }

  return '';
};

function PruebaAxios() {
  const [datos, setDatos] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [empleadoId, setEmpleadoId] = useState<number | null>(null);
  const [form, setForm] = useState<EmpleadoForm>(initialForm);
  const [contratoOriginal, setContratoOriginal] = useState<ContratoEmpleadoSnapshot | null>(null);
  const [telefonoPais, setTelefonoPais] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [modalJustificacionSalario, setModalJustificacionSalario] = useState(false);
  const [justificacionSalario, setJustificacionSalario] = useState('');
  const [justificacionSalarioDraft, setJustificacionSalarioDraft] = useState('');
  const [sueldoConJustificacion, setSueldoConJustificacion] = useState('');

  const [horNombre, setHorNombre] = useState('');

  const [modalHorarios, setModalHorarios] = useState(false);

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [tiposContrato, setTiposContrato] = useState<TipoContrato[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [cargandoPuestos, setCargandoPuestos] = useState(false);
  const [cargandoSedes, setCargandoSedes] = useState(false);
  const [cargandoTiposContrato, setCargandoTiposContrato] = useState(false);
  const [cargandoDeps, setCargandoDeps] = useState(false);

  const [filtroHor, setFiltroHor] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [perfilEmpleado, setPerfilEmpleado] = useState<Empleado | null>(null);
  const [modalDepartamentos, setModalDepartamentos] = useState(false);
  const [filtroDep, setFiltroDep] = useState('');

  const cargarEmpleados = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerEmpleados();
      setDatos([...data].sort((a, b) =>
        `${a.EMP_NOMBRE} ${a.EMP_APELLIDO}`.localeCompare(`${b.EMP_NOMBRE} ${b.EMP_APELLIDO}`, 'es', { sensitivity: 'base' })
      ));
    } catch (err: any) {
      setError('Error cargando empleados: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargando(false);
    }
  };

  const cargarHorarios = async () => {
    try {
      setCargandoHorarios(true);
      const data = await obtenerHorarios();
      setHorarios([...data].sort((a, b) =>
        String(a.HOR_DESCRIPCION ?? '').localeCompare(String(b.HOR_DESCRIPCION ?? ''), 'es', { sensitivity: 'base' })
      ));
    } catch (err: any) {
      setError('Error cargando horarios: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargandoHorarios(false);
    }
  };

  const cargarPuestos = async () => {
    try {
      setCargandoPuestos(true);
      const data = await obtenerPuestos();
      setPuestos([...data].sort((a, b) =>
        String(a.PUE_NOMBRE ?? '').localeCompare(String(b.PUE_NOMBRE ?? ''), 'es', { sensitivity: 'base' })
      ));
    } catch (err: any) {
      setError('Error cargando puestos: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargandoPuestos(false);
    }
  };

  const cargarSedes = async () => {
    try {
      setCargandoSedes(true);
      const data = await obtenerSedes();
      setSedes([...data].sort((a, b) =>
        String(a.SED_NOMBRE ?? '').localeCompare(String(b.SED_NOMBRE ?? ''), 'es', { sensitivity: 'base' })
      ));
    } catch (err: any) {
      setError('Error cargando sedes: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargandoSedes(false);
    }
  };

  const cargarTiposContrato = async () => {
    try {
      setCargandoTiposContrato(true);
      const data = await obtenerTiposContrato();
      setTiposContrato([...data].sort((a, b) =>
        String(a.TIC_NOMBRE ?? '').localeCompare(String(b.TIC_NOMBRE ?? ''), 'es', { sensitivity: 'base' })
      ));
    } catch (err: any) {
      setError('Error cargando tipos de contrato: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargandoTiposContrato(false);
    }
  };

  const cargarDepartamentos = async () => {
    try {
      setCargandoDeps(true);
      const data = await obtenerDepartamentos();
      setDepartamentos([...data].sort((a, b) =>
        String(a.DEP_NOMBRE ?? '').localeCompare(String(b.DEP_NOMBRE ?? ''), 'es', { sensitivity: 'base' })
      ));
    } catch (err: any) {
      setError('Error cargando departamentos: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargandoDeps(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
    cargarHorarios();
    cargarPuestos();
    cargarSedes();
    cargarTiposContrato();
    cargarDepartamentos();
  }, []);

  const abrirModalHorarios = async () => {
    setModalHorarios(true);
    setFiltroHor('');
    if (horarios.length === 0) {
      await cargarHorarios();
    }
  };

  const seleccionarHorario = (hor: Horario) => {
    setForm((prev) => ({ ...prev, hor_id: String(hor.HOR_ID) }));
    setHorNombre(hor.HOR_DESCRIPCION);
    setModalHorarios(false);
  };

  const horariosMap = useMemo(
    () => new Map(horarios.map((hor) => [String(hor.HOR_ID), hor])),
    [horarios]
  );

  const sedesMap = useMemo(
    () => new Map(sedes.map((sede) => [String(sede.SED_ID), sede])),
    [sedes]
  );

  const puestosMap = useMemo(
    () => new Map(puestos.map((puesto) => [String(puesto.PUE_ID), puesto])),
    [puestos]
  );

  const tiposContratoMap = useMemo(
    () => new Map(tiposContrato.map((tipo) => [String(tipo.TIC_ID), tipo])),
    [tiposContrato]
  );

  const departamentosMap = useMemo(
    () => new Map(departamentos.map((dep) => [String(dep.DEP_ID), dep])),
    [departamentos]
  );

  const fotosEmpleados = useMemo(
    () => new Map(datos.map((empleado) => [
      empleado.EMP_ID,
      normalizarFotoEmpleado(empleado.EMP_FOTO) || normalizarFotoEmpleado(empleado.emp_foto)
    ])),
    [datos]
  );

  const obtenerPuestoEmpleado = (empleado: Empleado) =>
    puestosMap.get(String(empleado.PUE_ID));

  const obtenerDepartamentoPuesto = (pueId: number | string | undefined) => {
    const puesto = puestosMap.get(String(pueId ?? ''));
    if (!puesto?.DEP_ID) return 'Sin departamento asignado';
    const departamento = departamentosMap.get(String(puesto.DEP_ID));
    return departamento ? departamento.DEP_NOMBRE : `Departamento #${puesto.DEP_ID}`;
  };

  const formatearMoneda = (valor: number | string | undefined) => {
    const numero = Number(valor || 0);
    if (!numero) return 'Q0.00';

    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(numero);
  };

  const obtenerSueldoEmpleado = (empleado: Empleado) =>
    empleado.EMP_SUELDO ?? obtenerPuestoEmpleado(empleado)?.PUE_SALARIO_BASE ?? 0;

  const obtenerTipoContrato = (ticId: number | string | undefined) =>
    tiposContratoMap.get(String(ticId ?? ''));

  const esContratoIndefinido = (ticId: number | string | undefined) => {
    const tipo = obtenerTipoContrato(ticId);
    return tipo?.TIC_NOMBRE.toLowerCase().includes('indefinido') ?? false;
  };

  const puestoSeleccionado = puestosMap.get(String(form.pue_id || ''));
  const sueldoBasePuesto = puestoSeleccionado?.PUE_SALARIO_BASE;
  const sueldoDiferenteAlPuesto = Boolean(
    puestoSeleccionado &&
    form.emp_sueldo &&
    normalizarMonto(form.emp_sueldo) !== normalizarMonto(sueldoBasePuesto)
  );
  const justificacionSalarioValida = Boolean(
    justificacionSalario.trim() &&
    sueldoConJustificacion === String(form.emp_sueldo)
  );

  const obtenerFotoEmpleado = (empleado: Empleado) =>
    fotosEmpleados.get(empleado.EMP_ID) ?? '';

  const obtenerInicialesEmpleado = (empleado: Pick<Empleado, 'EMP_NOMBRE' | 'EMP_APELLIDO'>) =>
    `${empleado.EMP_NOMBRE?.[0] ?? ''}${empleado.EMP_APELLIDO?.[0] ?? ''}`.toUpperCase() || 'E';

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen valido');
      return;
    }

    if (archivo.size < 50 * 1024 || archivo.size > 300 * 1024) {
      setError('La foto debe pesar entre 50 KB y 300 KB');
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      setForm((prev) => ({ ...prev, emp_foto: String(lector.result || '') }));
    };
    lector.onerror = () => setError('No se pudo cargar la foto seleccionada');
    lector.readAsDataURL(archivo);
  };

  const quitarFoto = () => {
    setForm((prev) => ({ ...prev, emp_foto: '' }));
  };

  const horariosFiltrados = useMemo(() => {
    const texto = filtroHor.toLowerCase();
    return horarios.filter((hor) => (
      hor.HOR_DESCRIPCION.toLowerCase().includes(texto) ||
      hor.HOR_HORA_INICIO.toLowerCase().includes(texto) ||
      hor.HOR_HORA_FIN.toLowerCase().includes(texto) ||
      String(hor.HOR_ID).includes(texto)
    ));
  }, [filtroHor, horarios]);

  const departamentosFiltrados = useMemo(() => {
    const texto = filtroDep.toLowerCase();
    return departamentos.filter((dep) => (
      String(dep.DEP_ID).includes(texto) ||
      String(dep.DEP_NOMBRE ?? '').toLowerCase().includes(texto) ||
      String(dep.DEP_DESCRIPCION ?? '').toLowerCase().includes(texto)
    ));
  }, [filtroDep, departamentos]);

  const seleccionarDepartamento = (dep: Departamento) => {
    setForm((prev) => ({ ...prev, dep_id: String(dep.DEP_ID) }));
    setModalDepartamentos(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    if (name === 'tic_id') {
      setForm((prev) => {
        const fechaInicio =
          modoEdicion && String(value) !== String(contratoOriginal?.tic_id ?? '')
            ? getToday()
            : prev.emp_fecha_inicio_contrato;

        return {
          ...prev,
          tic_id: value,
          emp_fecha_inicio_contrato: fechaInicio,
          emp_fecha_fin_contrato:
            esContratoIndefinido(value) ||
            (prev.emp_fecha_fin_contrato && fechaInicio && prev.emp_fecha_fin_contrato < fechaInicio)
              ? ''
              : prev.emp_fecha_fin_contrato
        };
      });
      return;
    }

    if (name === 'emp_fecha_inicio_contrato') {
      setForm((prev) => ({
        ...prev,
        emp_fecha_inicio_contrato: value,
        emp_fecha_fin_contrato:
          prev.emp_fecha_fin_contrato && prev.emp_fecha_fin_contrato < value
            ? ''
            : prev.emp_fecha_fin_contrato
      }));
      return;
    }

    if (name === 'pue_id') {
      const puesto = puestos.find((item) => String(item.PUE_ID) === String(value));
      setForm((prev) => ({
        ...prev,
        pue_id: value,
        dep_id: puesto?.DEP_ID ? String(puesto.DEP_ID) : '',
        emp_sueldo: puesto ? String(puesto.PUE_SALARIO_BASE) : prev.emp_sueldo
      }));
      setJustificacionSalario('');
      setJustificacionSalarioDraft('');
      setSueldoConJustificacion('');
      return;
    }

    if (name === 'emp_sueldo') {
      const puesto = puestosMap.get(String(form.pue_id || ''));
      const coincideConBase = puesto && normalizarMonto(value) === normalizarMonto(puesto.PUE_SALARIO_BASE);
      setForm((prev) => ({ ...prev, emp_sueldo: value }));
      if (coincideConBase) {
        setJustificacionSalario('');
        setJustificacionSalarioDraft('');
        setSueldoConJustificacion('');
        setModalJustificacionSalario(false);
      }
      return;
    }

    if (['emp_dpi', 'emp_nit'].includes(name)) {
      const maxLength = name === 'emp_dpi' ? 13 : 9;
      const soloNumeros = limitarLongitud(soloDigitos(value), maxLength);
      setForm((prev) => ({ ...prev, [name as string]: soloNumeros }));
      return;
    }

    setForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleDigitFieldChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const telefonoLocal = splitPhoneValue(form.emp_telefono, telefonoPais);

  const handleTelefonoPaisChange = (_event: unknown, country: PhoneCountry | null) => {
    const nextCountry = country ?? DEFAULT_PHONE_COUNTRY;
    setTelefonoPais(nextCountry);
    setForm((prev) => ({
      ...prev,
      emp_telefono: buildPhoneValue(nextCountry, splitPhoneValue(prev.emp_telefono, telefonoPais)),
    }));
  };

  const handleTelefonoLocalChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({
      ...prev,
      emp_telefono: buildPhoneValue(telefonoPais, event.target.value),
    }));
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name as string]: value }));
  };

  const limpiarFiltros = () => {
    setFilters(initialFilters);
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setTelefonoPais(DEFAULT_PHONE_COUNTRY);
    setJustificacionSalario('');
    setJustificacionSalarioDraft('');
    setSueldoConJustificacion('');
    setModalJustificacionSalario(false);
    setHorNombre('');
    setModoEdicion(false);
    setEmpleadoId(null);
    setContratoOriginal(null);
    setError('');
  };

  const contratoCambioPendiente = Boolean(
    modoEdicion &&
    contratoOriginal &&
    (
      String(form.tic_id || '') !== contratoOriginal.tic_id ||
      String(form.emp_fecha_inicio_contrato || '') !== contratoOriginal.fecha_inicio ||
      String(form.emp_fecha_fin_contrato || '') !== contratoOriginal.fecha_fin
    )
  );
  const minFechaContratoFin = form.emp_fecha_inicio_contrato || getToday();

  const abrirJustificacionSalario = () => {
    if (!sueldoDiferenteAlPuesto || justificacionSalarioValida) return;
    setJustificacionSalarioDraft(justificacionSalario);
    setModalJustificacionSalario(true);
  };

  const guardarJustificacionSalario = () => {
    if (!justificacionSalarioDraft.trim()) {
      setError('Ingresa la justificacion del cambio de salario para este empleado');
      return;
    }
    setJustificacionSalario(justificacionSalarioDraft.trim());
    setSueldoConJustificacion(String(form.emp_sueldo));
    setModalJustificacionSalario(false);
    setError('');
  };

  const cancelarJustificacionSalario = () => {
    setJustificacionSalarioDraft('');
    setJustificacionSalario('');
    setSueldoConJustificacion('');
    setModalJustificacionSalario(false);
    if (sueldoBasePuesto !== undefined) {
      setForm((prev) => ({ ...prev, emp_sueldo: String(sueldoBasePuesto) }));
    }
  };

  const validarFormulario = () => {
    if (
      !form.emp_nombre.trim() ||
      !form.emp_apellido.trim() ||
      !form.emp_dpi.trim() ||
      !form.emp_nit.trim() ||
      !form.emp_telefono.trim() ||
      !form.emp_estado.trim() ||
      !form.hor_id ||
      !form.sed_id ||
      !form.pue_id ||
      !form.tic_id ||
      !form.emp_sueldo
    ) {
      setError('Todos los campos son obligatorios, incluyendo horario, sede, puesto, tipo de contrato y sueldo');
      return false;
    }

    if (!esContratoIndefinido(form.tic_id) && !form.emp_fecha_fin_contrato) {
      setError('La fecha fin de contrato es obligatoria para contratos no indefinidos');
      return false;
    }

    if (!form.emp_fecha_inicio_contrato) {
      setError('La fecha de inicio de contrato es obligatoria');
      return false;
    }

    if (form.emp_fecha_inicio_contrato < getToday()) {
      setError('La fecha de inicio de contrato no puede ser anterior a la fecha actual');
      return false;
    }

    if (form.emp_fecha_fin_contrato && form.emp_fecha_fin_contrato < getToday()) {
      setError('La fecha fin de contrato no puede ser anterior a la fecha actual');
      return false;
    }

    if (
      contratoCambioPendiente &&
      form.emp_fecha_inicio_contrato <= contratoOriginal!.fecha_inicio
    ) {
      setError('La fecha de inicio del nuevo contrato debe ser posterior al contrato vigente');
      return false;
    }

    if (contratoCambioPendiente && !form.emp_motivo_cambio_contrato?.trim()) {
      setError('Indica el motivo del cambio de contrato');
      return false;
    }

    if (
      form.emp_fecha_fin_contrato &&
      form.emp_fecha_fin_contrato < form.emp_fecha_inicio_contrato
    ) {
      setError('La fecha fin de contrato no puede ser anterior a la fecha de contratacion');
      return false;
    }

    if (Number(form.emp_sueldo) <= 0) {
      setError('El sueldo debe ser mayor a 0');
      return false;
    }

    if (sueldoDiferenteAlPuesto && !justificacionSalarioValida) {
      setError('Ingresa la justificacion del cambio de salario para este empleado');
      abrirJustificacionSalario();
      return false;
    }
    return true;
  };

  const guardarEmpleado = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return false;

      const fechaInicioContrato = form.emp_fecha_inicio_contrato;
      const payload: EmpleadoForm = {
        ...form,
        emp_fecha_contratacion: fechaInicioContrato,
        emp_fecha_inicio_contrato: fechaInicioContrato
      };

      if (modoEdicion && empleadoId !== null) {
        await actualizarEmpleado(empleadoId, payload);
        setMensaje('Empleado actualizado correctamente');
      } else {
        await crearEmpleado(payload);
        setMensaje('Empleado creado correctamente');
      }

      limpiarFormulario();
      await cargarEmpleados();
      return true;
    } catch (err: any) {
      setError('Error guardando empleado: ' + (err.response?.data?.error || err.message));
      return false;
    }
  };

  useUnsavedFormGuard(form, initialForm, guardarEmpleado);

  const handleEliminar = async (id: number) => {
    if (!window.confirm('Â¿Deseas eliminar este empleado?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarEmpleado(id);
      setMensaje('Empleado eliminado correctamente');

      if (empleadoId === id) limpiarFormulario();

      await cargarEmpleados();
    } catch (err: any) {
      setError('Error eliminando empleado: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (empleado: Empleado) => {
    const telefono = String(empleado.EMP_TELEFONO || '');
    const telefonoPaisDetectado = detectPhoneCountry(telefono);

    setModoEdicion(true);
    setEmpleadoId(empleado.EMP_ID);
    setMensaje('');
    setError('');
    setTelefonoPais(telefonoPaisDetectado);
    setJustificacionSalario('');
    setJustificacionSalarioDraft('');
    setSueldoConJustificacion('');
    setModalJustificacionSalario(false);

    const hor = horarios.find((h) => h.HOR_ID === empleado.HOR_ID);

    setHorNombre(hor ? hor.HOR_DESCRIPCION : empleado.HOR_ID ? `Horario #${empleado.HOR_ID}` : '');

    const fechaInicioContrato = empleado.EMP_FECHA_INICIO_CONTRATO
      ? String(empleado.EMP_FECHA_INICIO_CONTRATO).slice(0, 10)
      : empleado.EMP_FECHA_CONTRATACION
        ? String(empleado.EMP_FECHA_CONTRATACION).slice(0, 10)
        : '';
    const fechaFinContrato = empleado.EMP_FECHA_FIN_CONTRATO
      ? String(empleado.EMP_FECHA_FIN_CONTRATO).slice(0, 10)
      : '';
    const tipoContratoId = String(empleado.TIC_ID || '');

    setContratoOriginal({
      tic_id: tipoContratoId,
      fecha_inicio: fechaInicioContrato,
      fecha_fin: fechaFinContrato
    });

    setForm({
      emp_nombre: empleado.EMP_NOMBRE || '',
      emp_apellido: empleado.EMP_APELLIDO || '',
      emp_dpi: String(empleado.EMP_DPI || ''),
      emp_nit: String(empleado.EMP_NIT || ''),
      emp_telefono: telefono,
      emp_fecha_contratacion: empleado.EMP_FECHA_CONTRATACION
        ? String(empleado.EMP_FECHA_CONTRATACION).slice(0, 10)
        : '',
      emp_estado: empleado.EMP_ESTADO || '',
      dep_id: String(empleado.DEP_ID || obtenerPuestoEmpleado(empleado)?.DEP_ID || ''),
      hor_id: String(empleado.HOR_ID || ''),
      sed_id: String(empleado.SED_ID || ''),
      pue_id: String(empleado.PUE_ID || ''),
      tic_id: tipoContratoId,
      emp_fecha_inicio_contrato: fechaInicioContrato,
      emp_fecha_fin_contrato: fechaFinContrato,
      emp_motivo_cambio_contrato: '',
      emp_sueldo: String(empleado.EMP_SUELDO ?? obtenerPuestoEmpleado(empleado)?.PUE_SALARIO_BASE ?? ''),
      emp_foto: obtenerFotoEmpleado(empleado)
    });
  };

  const obtenerChipEstado = (estado: string) => {
    if (estado === 'A') return <Chip label="Activo" color="success" size="small" />;
    if (estado === 'I') return <Chip label="Inactivo" color="default" size="small" />;
    return <Chip label={estado || 'Sin estado'} size="small" />;
  };

  const obtenerChipHorario = (horId: number) => {
    const hor = horariosMap.get(String(horId));
    return (
      <Chip
        label={hor ? hor.HOR_DESCRIPCION : `Horario #${horId}`}
        color="secondary"
        size="small"
        icon={<ScheduleIcon />}
      />
    );
  };

  const diasTexto = (hor: Horario) => {
    const dias: string[] = [];
    if (hor.HOR_LUNES) dias.push('Lun');
    if (hor.HOR_MARTES) dias.push('Mar');
    if (hor.HOR_MIERCOLES) dias.push('MiÃ©');
    if (hor.HOR_JUEVES) dias.push('Jue');
    if (hor.HOR_VIERNES) dias.push('Vie');
    if (hor.HOR_SABADO) dias.push('SÃ¡b');
    if (hor.HOR_DOMINGO) dias.push('Dom');
    return dias.join(', ');
  };

  const obtenerChipSede = (sedId: number) => {
    const sede = sedesMap.get(String(sedId));
    return (
      <Chip
        label={sede ? sede.SED_NOMBRE : `Sede #${sedId}`}
        color="primary"
        size="small"
        icon={<ApartmentIcon />}
      />
    );
  };

  const obtenerChipPuesto = (pueId: number) => {
    const puesto = puestosMap.get(String(pueId));
    return (
      <Chip
        label={puesto ? puesto.PUE_NOMBRE : `Puesto #${pueId}`}
        color="default"
        size="small"
        icon={<BadgeIcon />}
      />
    );
  };

  const obtenerChipTipoContrato = (ticId: number) => {
    const tipo = tiposContratoMap.get(String(ticId));
    return (
      <Chip
        label={tipo ? `${tipo.TIC_NOMBRE} - ${tipo.TIC_TIPO_JORNADA}` : `Contrato #${ticId}`}
        color="info"
        size="small"
        icon={<ArticleIcon />}
      />
    );
  };

  const formatearFechaSimple = (fecha?: string) =>
    fecha ? String(fecha).slice(0, 10) : 'â€”';

  const deferredFilters = useDeferredValue(filters);

  const empleadosFiltrados = useMemo(() => {
    const texto = deferredFilters.busqueda.trim().toLowerCase();

    return datos.filter((empleado) => {
      const nombreCompleto = `${empleado.EMP_NOMBRE ?? ''} ${empleado.EMP_APELLIDO ?? ''}`.toLowerCase();
      const identificadores = `${empleado.EMP_ID} ${empleado.EMP_DPI ?? ''} ${empleado.EMP_NIT ?? ''}`.toLowerCase();

      if (texto && !nombreCompleto.includes(texto) && !identificadores.includes(texto)) return false;
      if (deferredFilters.estado && empleado.EMP_ESTADO !== deferredFilters.estado) return false;
      if (deferredFilters.horId && String(empleado.HOR_ID ?? '') !== deferredFilters.horId) return false;
      if (deferredFilters.sedId && String(empleado.SED_ID ?? '') !== deferredFilters.sedId) return false;
      if (deferredFilters.pueId && String(empleado.PUE_ID ?? '') !== deferredFilters.pueId) return false;
      if (deferredFilters.ticId && String(empleado.TIC_ID ?? '') !== deferredFilters.ticId) return false;

      return true;
    });
  }, [datos, deferredFilters]);

  const empleadosVisibles = useMemo(
    () => empleadosFiltrados.slice(0, EMPLOYEE_TABLE_LIMIT),
    [empleadosFiltrados]
  );

  const resumenEmpleados = useMemo(() => {
    const empleadosActivos = datos.filter((empleado) =>
      String(empleado.EMP_ESTADO || 'A').toUpperCase() === 'A' &&
      !empleado.EMP_FECHA_LIQUIDACION
    );

    return {
      activos: empleadosActivos.length,
      sinHorario: empleadosActivos.filter((empleado) => !empleado.HOR_ID).length,
      sinSede: empleadosActivos.filter((empleado) => !empleado.SED_ID).length,
      sinPuesto: empleadosActivos.filter((empleado) => !empleado.PUE_ID).length,
      sinContrato: empleadosActivos.filter((empleado) => !empleado.TIC_ID).length
    };
  }, [datos]);

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <StateBlock title="Cargando empleados..." loading />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <PageHeader
        title="Empleados"
        subtitle="Administra datos personales, contratos, puesto, horario, sede y salario base de cada colaborador."
        icon={<PeopleIcon />}
      />

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar empleado' : 'Nuevo empleado'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Avatar
                src={form.emp_foto || undefined}
                sx={{ width: 88, height: 88, bgcolor: 'primary.main', fontSize: 28 }}
              >
                {(form.emp_nombre?.[0] ?? '') + (form.emp_apellido?.[0] ?? '')}
              </Avatar>

              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCameraIcon />}
                >
                  Agregar foto
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handleFotoChange}
                  />
                </Button>
                {form.emp_foto && (
                  <Button color="secondary" onClick={quitarFoto} sx={{ ml: 1 }}>
                    Quitar
                  </Button>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                  JPG, PNG o WEBP. Entre 50 KB y 300 KB.
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre"
              name="emp_nombre"
              value={form.emp_nombre}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Apellido"
              name="emp_apellido"
              value={form.emp_apellido}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <DigitField
              label="DPI"
              name="emp_dpi"
              value={form.emp_dpi}
              maxLength={13}
              onValueChange={handleDigitFieldChange}
              required
              helperText="Solo numeros. Maximo 13 digitos para DPI."
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <DigitField
              label="NIT"
              name="emp_nit"
              value={form.emp_nit}
              maxLength={9}
              onValueChange={handleDigitFieldChange}
              required
              helperText="Solo numeros. Maximo 9 digitos para NIT."
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 5 }}>
                <Autocomplete
                  options={PHONE_COUNTRIES}
                  value={telefonoPais}
                  onChange={handleTelefonoPaisChange}
                  disableClearable
                  getOptionLabel={(country) => `${getFlagEmoji(country.code)} ${country.name} +${country.dialCode}`}
                  isOptionEqualToValue={(option, value) => option.code === value.code && option.dialCode === value.dialCode}
                  renderInput={(params) => (
                    <TextField {...params} label="Pais" required />
                  )}
                  renderOption={(props, country) => (
                    <Box component="li" {...props}>
                      <Box component="span" sx={{ mr: 1.25, fontSize: 20 }}>
                        {getFlagEmoji(country.code)}
                      </Box>
                      <Box component="span" sx={{ flexGrow: 1 }}>
                        {country.name}
                      </Box>
                      <Typography component="span" color="text.secondary">
                        +{country.dialCode}
                      </Typography>
                    </Box>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 7 }}>
                <TextField
                  fullWidth
                  label="Telefono"
                  name="emp_telefono_local"
                  type="tel"
                  value={telefonoLocal}
                  onChange={handleTelefonoLocalChange}
                  required
                  helperText={`Prefijo seleccionado: +${telefonoPais.dialCode}. Se guardara el numero local${telefonoLocal ? `: ${telefonoLocal}` : ''}`}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          +{telefonoPais.dialCode}
                        </InputAdornment>
                      ),
                    },
                    htmlInput: {
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      maxLength: getPhoneLocalMaxLength(telefonoPais),
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Estado</InputLabel>
              <Select
                name="emp_estado"
                value={form.emp_estado}
                label="Estado"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione estado</MenuItem>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="I">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required disabled={cargandoDeps}>
              <InputLabel>Departamento</InputLabel>
              <Select
                name="dep_id"
                value={form.dep_id}
                label="Departamento"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione departamento</MenuItem>
                {departamentos.map((dep) => (
                  <MenuItem key={dep.DEP_ID} value={String(dep.DEP_ID)}>
                    {dep.DEP_NOMBRE} {dep.DEP_DESCRIPCION ? `- ${dep.DEP_DESCRIPCION}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Horario"
              value={horNombre ? `#${form.hor_id} â€” ${horNombre}` : ''}
              placeholder="Haz clic para seleccionar un horario"
              onClick={abrirModalHorarios}
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={abrirModalHorarios} edge="end">
                        <ScheduleIcon color="primary" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { cursor: 'pointer' }
                }
              }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required disabled={cargandoSedes}>
              <InputLabel>Sede</InputLabel>
              <Select
                name="sed_id"
                value={form.sed_id}
                label="Sede"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione sede</MenuItem>
                {sedes.map((sede) => (
                  <MenuItem key={sede.SED_ID} value={String(sede.SED_ID)}>
                    {sede.SED_NOMBRE} - {sede.SED_MUNICIPIO}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required disabled={cargandoPuestos}>
              <InputLabel>Puesto</InputLabel>
              <Select
                name="pue_id"
                value={form.pue_id}
                label="Puesto"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione puesto</MenuItem>
                {puestos.map((puesto) => (
                  <MenuItem key={puesto.PUE_ID} value={String(puesto.PUE_ID)}>
                    {puesto.PUE_NOMBRE} - {formatearMoneda(puesto.PUE_SALARIO_BASE)} / {obtenerDepartamentoPuesto(puesto.PUE_ID)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required disabled={cargandoTiposContrato}>
              <InputLabel>Tipo de contrato</InputLabel>
              <Select
                name="tic_id"
                value={form.tic_id}
                label="Tipo de contrato"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione tipo de contrato</MenuItem>
                {tiposContrato.map((tipo) => (
                  <MenuItem key={tipo.TIC_ID} value={String(tipo.TIC_ID)}>
                    {tipo.TIC_NOMBRE} - {tipo.TIC_TIPO_JORNADA}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Inicio de contrato"
              name="emp_fecha_inicio_contrato"
              type="date"
              value={form.emp_fecha_inicio_contrato}
              onChange={handleChange}
              helperText="Esta fecha se usara como fecha de contratacion inicial"
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: getToday() }
              }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fin de contrato"
              name="emp_fecha_fin_contrato"
              type="date"
              value={esContratoIndefinido(form.tic_id) ? '' : form.emp_fecha_fin_contrato}
              onChange={handleChange}
              disabled={esContratoIndefinido(form.tic_id)}
              helperText={
                esContratoIndefinido(form.tic_id)
                  ? 'No aplica para contratos indefinidos'
                  : 'Requerida para contratos temporales o con plazo'
              }
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: minFechaContratoFin }
              }}
              required={!esContratoIndefinido(form.tic_id)}
            />
          </Grid>

          {contratoCambioPendiente && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="warning">
                Cambio de contrato detectado. El backend debe cerrar el periodo anterior y crear un nuevo registro
                en el historial de contratos con la fecha de inicio indicada.
              </Alert>
            </Grid>
          )}

          {contratoCambioPendiente && (
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Motivo del cambio de contrato"
                name="emp_motivo_cambio_contrato"
                value={form.emp_motivo_cambio_contrato || ''}
                onChange={handleChange}
                helperText="Ej: renovacion, cambio a indefinido, cambio de jornada"
                required
              />
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Salario"
              name="emp_sueldo"
              type="number"
              value={form.emp_sueldo}
              onChange={handleChange}
              onBlur={abrirJustificacionSalario}
              helperText="Se llena con el salario base del puesto, pero puedes modificarlo para este empleado"
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">Q</InputAdornment>,
                  inputProps: { min: 0, step: '0.01' }
                }
              }}
              required
            />
            {sueldoDiferenteAlPuesto && justificacionSalarioValida && (
              <Alert severity="info" sx={{ mt: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Justificacion del cambio de salario
                </Typography>
                <Typography variant="body2">{justificacionSalario}</Typography>
              </Alert>
            )}
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarEmpleado}>
                {modoEdicion ? 'Actualizar' : 'Guardar'}
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                startIcon={<CleaningServicesIcon />}
                onClick={limpiarFormulario}
              >
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Typography variant="h6">
            Listado de empleados: {empleadosFiltrados.length} de {datos.length}
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <SummaryCard title="Activos" value={resumenEmpleados.activos} tone="success" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <SummaryCard title="Sin horario" value={resumenEmpleados.sinHorario} tone={resumenEmpleados.sinHorario ? 'warning' : 'neutral'} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <SummaryCard title="Sin sede" value={resumenEmpleados.sinSede} tone={resumenEmpleados.sinSede ? 'warning' : 'neutral'} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <SummaryCard title="Sin puesto" value={resumenEmpleados.sinPuesto} tone={resumenEmpleados.sinPuesto ? 'warning' : 'neutral'} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <SummaryCard title="Sin contrato" value={resumenEmpleados.sinContrato} tone={resumenEmpleados.sinContrato ? 'warning' : 'neutral'} />
          </Grid>
        </Grid>

        {empleadosFiltrados.length > EMPLOYEE_TABLE_LIMIT && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Mostrando los primeros {EMPLOYEE_TABLE_LIMIT} empleados filtrados. Usa la busqueda o filtros para acotar la lista.
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar"
              name="busqueda"
              value={filters.busqueda}
              onChange={handleFilterChange}
              placeholder="Nombre, DPI, NIT o ID"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select name="estado" value={filters.estado} label="Estado" onChange={handleFilterChange}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="I">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Horario</InputLabel>
              <Select name="horId" value={filters.horId} label="Horario" onChange={handleFilterChange}>
                <MenuItem value="">Todos</MenuItem>
                {horarios.map((hor) => (
                  <MenuItem key={hor.HOR_ID} value={String(hor.HOR_ID)}>{hor.HOR_DESCRIPCION}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Sede</InputLabel>
              <Select name="sedId" value={filters.sedId} label="Sede" onChange={handleFilterChange}>
                <MenuItem value="">Todas</MenuItem>
                {sedes.map((sede) => (
                  <MenuItem key={sede.SED_ID} value={String(sede.SED_ID)}>{sede.SED_NOMBRE}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Puesto</InputLabel>
              <Select name="pueId" value={filters.pueId} label="Puesto" onChange={handleFilterChange}>
                <MenuItem value="">Todos</MenuItem>
                {puestos.map((puesto) => (
                  <MenuItem key={puesto.PUE_ID} value={String(puesto.PUE_ID)}>{puesto.PUE_NOMBRE}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Contrato</InputLabel>
              <Select name="ticId" value={filters.ticId} label="Contrato" onChange={handleFilterChange}>
                <MenuItem value="">Todos</MenuItem>
                {tiposContrato.map((tipo) => (
                  <MenuItem key={tipo.TIC_ID} value={String(tipo.TIC_ID)}>
                    {tipo.TIC_NOMBRE} - {tipo.TIC_TIPO_JORNADA}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 1 }}>
            <Button fullWidth variant="outlined" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          </Grid>
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Foto</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Apellido</strong></TableCell>
                <TableCell><strong>DPI</strong></TableCell>
                <TableCell><strong>NIT</strong></TableCell>
                <TableCell><strong>TelÃ©fono</strong></TableCell>
                <TableCell><strong>F. ContrataciÃ³n</strong></TableCell>
                <TableCell><strong>Horario</strong></TableCell>
                <TableCell><strong>Sede</strong></TableCell>
                <TableCell><strong>Puesto</strong></TableCell>
                <TableCell><strong>Contrato</strong></TableCell>
                <TableCell><strong>Fin contrato</strong></TableCell>
                <TableCell><strong>Sueldo</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {empleadosFiltrados.length > 0 ? (
                empleadosVisibles.map((empleado) => (
                  <TableRow key={empleado.EMP_ID} hover>
                    <TableCell>{empleado.EMP_ID}</TableCell>
                    <TableCell>
                      <Avatar
                        src={obtenerFotoEmpleado(empleado) || undefined}
                        sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}
                      >
                        {obtenerInicialesEmpleado(empleado)}
                      </Avatar>
                    </TableCell>
                    <TableCell>{empleado.EMP_NOMBRE}</TableCell>
                    <TableCell>{empleado.EMP_APELLIDO}</TableCell>
                    <TableCell>{empleado.EMP_DPI}</TableCell>
                    <TableCell>{empleado.EMP_NIT}</TableCell>
                    <TableCell>{empleado.EMP_TELEFONO}</TableCell>
                    <TableCell>
                      {empleado.EMP_FECHA_CONTRATACION
                        ? String(empleado.EMP_FECHA_CONTRATACION).slice(0, 10)
                        : 'â€”'}
                    </TableCell>
                    <TableCell>
                      {empleado.HOR_ID ? obtenerChipHorario(empleado.HOR_ID) : 'â€”'}
                    </TableCell>
                    <TableCell>
                      {empleado.SED_ID ? obtenerChipSede(empleado.SED_ID) : 'â€”'}
                    </TableCell>
                    <TableCell>
                      {empleado.PUE_ID ? obtenerChipPuesto(empleado.PUE_ID) : 'â€”'}
                    </TableCell>
                    <TableCell>
                      {empleado.TIC_ID ? obtenerChipTipoContrato(empleado.TIC_ID) : 'â€”'}
                    </TableCell>
                    <TableCell>
                      {empleado.TIC_ID && esContratoIndefinido(empleado.TIC_ID)
                        ? 'Indefinido'
                        : formatearFechaSimple(empleado.EMP_FECHA_FIN_CONTRATO)}
                    </TableCell>
                    <TableCell>{formatearMoneda(obtenerSueldoEmpleado(empleado))}</TableCell>
                    <TableCell>{obtenerChipEstado(empleado.EMP_ESTADO)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="info"
                          startIcon={<VisibilityIcon />}
                          onClick={() => setPerfilEmpleado(empleado)}
                        >
                          Perfil
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(empleado)}
                        >
                          Editar
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(empleado.EMP_ID)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={16} align="center">
                    No hay empleados con esos filtros
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={modalJustificacionSalario}
        onClose={cancelarJustificacionSalario}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          Ingresa la justificacion del cambio de salario para este empleado
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            multiline
            minRows={4}
            autoFocus
            value={justificacionSalarioDraft}
            onChange={(event) => setJustificacionSalarioDraft(event.target.value)}
            placeholder="Ej: ajuste por experiencia, negociacion contractual, responsabilidades adicionales..."
          />
          {puestoSeleccionado && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              Salario base del puesto: {formatearMoneda(sueldoBasePuesto)}. Salario indicado: {formatearMoneda(form.emp_sueldo)}.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" color="secondary" onClick={cancelarJustificacionSalario}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={guardarJustificacionSalario}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={modalDepartamentos}
        onClose={() => setModalDepartamentos(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Seleccionar Departamento
            </Typography>
          </Box>
          <IconButton onClick={() => setModalDepartamentos(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Buscar por nombre, descripciÃ³n o ID..."
            value={filtroDep}
            onChange={(e) => setFiltroDep(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }
            }}
          />

          {cargandoDeps ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              Cargando departamentos...
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Nombre</strong></TableCell>
                    <TableCell><strong>DescripciÃ³n</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departamentosFiltrados.length > 0 ? (
                    departamentosFiltrados.map((dep) => (
                      <TableRow
                        key={dep.DEP_ID}
                        hover
                        onClick={() => seleccionarDepartamento(dep)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{dep.DEP_ID}</TableCell>
                        <TableCell>{dep.DEP_NOMBRE}</TableCell>
                        <TableCell>{dep.DEP_DESCRIPCION || 'â€”'}</TableCell>
                        <TableCell>
                          <Chip
                            label={dep.DEP_ESTADO === 'A' ? 'Activo' : 'Inactivo'}
                            color={dep.DEP_ESTADO === 'A' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No se encontraron departamentos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={modalHorarios}
        onClose={() => setModalHorarios(false)}
        fullWidth
        maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Seleccionar Horario
            </Typography>
          </Box>
          <IconButton onClick={() => setModalHorarios(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Buscar por descripciÃ³n, horario o ID..."
            value={filtroHor}
            onChange={(e) => setFiltroHor(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }
            }}
          />

          {cargandoHorarios ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              Cargando horarios...
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>DescripciÃ³n</strong></TableCell>
                    <TableCell><strong>Hora inicio</strong></TableCell>
                    <TableCell><strong>Hora fin</strong></TableCell>
                    <TableCell><strong>DÃ­as</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {horariosFiltrados.length > 0 ? (
                    horariosFiltrados.map((hor) => (
                      <TableRow
                        key={hor.HOR_ID}
                        hover
                        onClick={() => seleccionarHorario(hor)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{hor.HOR_ID}</TableCell>
                        <TableCell>{hor.HOR_DESCRIPCION}</TableCell>
                        <TableCell>{hor.HOR_HORA_INICIO}</TableCell>
                        <TableCell>{hor.HOR_HORA_FIN}</TableCell>
                        <TableCell>{diasTexto(hor)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No se encontraron horarios
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!perfilEmpleado}
        onClose={() => setPerfilEmpleado(null)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Perfil del empleado
            </Typography>
          </Box>
          <IconButton onClick={() => setPerfilEmpleado(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {perfilEmpleado && (
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', minWidth: 0 }}>
                <Avatar
                  src={obtenerFotoEmpleado(perfilEmpleado) || undefined}
                  sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: 24, flexShrink: 0 }}
                >
                  {obtenerInicialesEmpleado(perfilEmpleado)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {perfilEmpleado.EMP_NOMBRE} {perfilEmpleado.EMP_APELLIDO}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID {perfilEmpleado.EMP_ID} / DPI {perfilEmpleado.EMP_DPI}
                </Typography>
                </Box>
              </Box>
              {obtenerChipEstado(perfilEmpleado.EMP_ESTADO)}
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">NIT</Typography>
                <Typography>{perfilEmpleado.EMP_NIT || 'â€”'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">TelÃ©fono</Typography>
                <Typography>{perfilEmpleado.EMP_TELEFONO || 'â€”'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">Fecha de contrataciÃ³n</Typography>
                <Typography>
                  {perfilEmpleado.EMP_FECHA_CONTRATACION
                    ? String(perfilEmpleado.EMP_FECHA_CONTRATACION).slice(0, 10)
                    : 'â€”'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">Sueldo</Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  {formatearMoneda(obtenerSueldoEmpleado(perfilEmpleado))}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">Departamento del puesto</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {perfilEmpleado.PUE_ID ? obtenerDepartamentoPuesto(perfilEmpleado.PUE_ID) : 'â€”'}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">Horario</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {perfilEmpleado.HOR_ID ? obtenerChipHorario(perfilEmpleado.HOR_ID) : 'â€”'}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">Sede</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {perfilEmpleado.SED_ID ? obtenerChipSede(perfilEmpleado.SED_ID) : 'â€”'}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">Puesto</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {perfilEmpleado.PUE_ID ? obtenerChipPuesto(perfilEmpleado.PUE_ID) : 'â€”'}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">Tipo de contrato</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {perfilEmpleado.TIC_ID ? obtenerChipTipoContrato(perfilEmpleado.TIC_ID) : 'â€”'}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">Fin de contrato</Typography>
                <Typography>
                  {perfilEmpleado.TIC_ID && esContratoIndefinido(perfilEmpleado.TIC_ID)
                    ? 'Indefinido'
                    : formatearFechaSimple(perfilEmpleado.EMP_FECHA_FIN_CONTRATO)}
                </Typography>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => {
                  handleEditar(perfilEmpleado);
                  setPerfilEmpleado(null);
                }}
              >
                Editar
              </Button>
              <Button variant="contained" onClick={() => setPerfilEmpleado(null)}>
                Cerrar
              </Button>
            </Box>
          </DialogContent>
        )}
      </Dialog>

      <Snackbar
        open={!!mensaje}
        autoHideDuration={3000}
        onClose={() => setMensaje('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setMensaje('')} sx={{ width: '100%' }}>
          {mensaje}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PruebaAxios;
