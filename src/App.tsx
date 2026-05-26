import type { FormEvent, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, CssBaseline, CircularProgress } from '@mui/material';

import { AuthProvider, useAuth } from './context/AuthContext';
import { UnsavedChangesProvider, useUnsavedChanges } from './context/UnsavedChangesContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import AccessDenied from './components/common/AccessDenied';
import { sanitizeFieldValue, shouldSkipInputSanitization } from './utils/fieldValidation';

const Home = lazy(() => import('./pages/Home'));
const PruebaAxios = lazy(() => import('./components/PruebaAxios'));
const Departamentos = lazy(() => import('./components/Departamentos'));
const Puestos = lazy(() => import('./components/Puestos'));
const Roles = lazy(() => import('./components/Roles'));
const Prestamos = lazy(() => import('./components/Prestamos'));
const Permisos = lazy(() => import('./components/permisos'));
const RolPermisosView = lazy(() => import('./components/RolPermisos'));
const Periodo = lazy(() => import('./components/Periodo'));
const ControlLaboral = lazy(() => import('./components/ControlLaboral'));
const CuentaBancaria = lazy(() => import('./components/CuentaBancaria'));
const Descuentos = lazy(() => import('./components/descuentos'));
const TipoIngresos = lazy(() => import('./components/tipoIngresos'));
const NominaDetallePage = lazy(() => import('./components/NominaDetallePage'));
const KPIPage = lazy(() => import('./components/KPIPage'));
const KPIResultadoPage = lazy(() => import('./components/KPIResultadoPage'));
const MarcajePage = lazy(() => import('./components/MarcajeCRUD'));
const EmpleadoContrato = lazy(() => import('./components/EmpleadoContrato'));
const Sede = lazy(() => import('./components/Sede'));
const Bitacora = lazy(() => import('./components/Bitacora'));
const Auditoria = lazy(() => import('./components/Auditoria'));
const Liquidacion = lazy(() => import('./components/Liquidacion'));
const Nomina = lazy(() => import('./components/Nomina'));
const NominaAsignaciones = lazy(() => import('./components/NominaAsignaciones'));
const Usuario = lazy(() => import('./components/Usuario'));
const TipoContrato = lazy(() => import('./components/TipoContrato'));
const UsuarioBitacora = lazy(() => import('./components/UsuarioBitacora'));
const HorarioCRUD = lazy(() => import('./components/HorarioCRUD'));
const SuspensionIgss = lazy(() => import('./components/SuspensionIgss'));
const AprobacionNomina = lazy(() => import('./components/AprobacionNomina'));
const ReportesView = lazy(() => import('./components/ReportesView'));

function GuardedRoute({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const { canAccessPath } = useAuth();

  if (!canAccessPath(path)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

function UnsavedAwareContainer({ children }: { children: ReactNode }) {
  const { setHasUnsavedChanges } = useUnsavedChanges();

  const markUnsavedChange = (event: FormEvent<HTMLElement>) => {
    const target = event.target;

    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      const ignoredTypes = ['button', 'submit', 'reset', 'hidden'];
      if (target instanceof HTMLInputElement && ignoredTypes.includes(target.type)) return;

      setHasUnsavedChanges(true);
    }
  };

  const markMuiControlInteraction = (event: MouseEvent<HTMLElement>) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) return;

    const interactiveControl = target.closest(
      [
        'input',
        'textarea',
        'select',
        '[role="combobox"]',
        '[role="spinbutton"]',
        '[contenteditable="true"]',
        '.MuiSelect-select',
        '.MuiCheckbox-root',
        '.MuiRadio-root',
        '.MuiSwitch-root',
      ].join(',')
    );

    if (!interactiveControl) return;
    if (interactiveControl instanceof HTMLInputElement) {
      const ignoredTypes = ['button', 'submit', 'reset', 'hidden'];
      if (ignoredTypes.includes(interactiveControl.type)) return;
    }

    setHasUnsavedChanges(true);
  };

  const markKeyboardControlInteraction = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) return;
    if (!target.matches('input, textarea, select, [role="combobox"], [contenteditable="true"]')) return;

    const ignoredKeys = ['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape'];
    if (ignoredKeys.includes(event.key)) return;

    setHasUnsavedChanges(true);
  };

  return (
    <Container
      maxWidth="xl"
      onChangeCapture={markUnsavedChange}
      onInputCapture={markUnsavedChange}
      onClickCapture={markMuiControlInteraction}
      onKeyDownCapture={markKeyboardControlInteraction}
      sx={{ py: 3 }}
    >
      {children}
    </Container>
  );
}

const isTextEntryTarget = (target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement =>
  target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

const getInputLabel = (target: HTMLInputElement | HTMLTextAreaElement) => {
  const ariaLabel = target.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  const labelledBy = target.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelText = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ')
      .trim();
    if (labelText) return labelText;
  }

  if (target.id) {
    const explicitLabel = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(target.id)}"]`);
    if (explicitLabel?.textContent) return explicitLabel.textContent;
  }

  const formControlLabel = target.closest('.MuiFormControl-root')?.querySelector('label')?.textContent;
  return formControlLabel ?? '';
};

const getSanitizedElementValue = (target: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  const inputType = target instanceof HTMLTextAreaElement ? 'textarea' : target.type;

  return sanitizeFieldValue(target.name, value, {
    inputType,
    label: getInputLabel(target),
    placeholder: target.placeholder,
  });
};

const shouldSanitizeElement = (target: HTMLInputElement | HTMLTextAreaElement) => {
  if (target.readOnly || target.disabled) return false;
  if (target instanceof HTMLInputElement && shouldSkipInputSanitization(target.type)) return false;

  return true;
};

const setNativeInputValue = (target: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  const prototype = Object.getPrototypeOf(target);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

  descriptor?.set?.call(target, value);
};

const replaceSelectedText = (target: HTMLInputElement | HTMLTextAreaElement, text: string) => {
  const start = target.selectionStart ?? target.value.length;
  const end = target.selectionEnd ?? target.value.length;
  const nextValue = `${target.value.slice(0, start)}${text}${target.value.slice(end)}`;
  const nextCursorPosition = start + text.length;

  setNativeInputValue(target, getSanitizedElementValue(target, nextValue));
  target.setSelectionRange(nextCursorPosition, nextCursorPosition);
  target.dispatchEvent(new Event('input', { bubbles: true }));
};

function InputCharacterGuard() {
  useEffect(() => {
    const handleBeforeInput = (event: InputEvent) => {
      if (!isTextEntryTarget(event.target) || !shouldSanitizeElement(event.target)) return;
      if (event.isComposing || event.data === null) return;
      if (event.inputType.startsWith('delete') || event.inputType.startsWith('history')) return;

      const sanitizedText = getSanitizedElementValue(event.target, event.data);
      if (sanitizedText === event.data) return;

      event.preventDefault();
      if (sanitizedText) replaceSelectedText(event.target, sanitizedText);
    };

    const handlePaste = (event: ClipboardEvent) => {
      if (!isTextEntryTarget(event.target) || !shouldSanitizeElement(event.target)) return;

      const pastedText = event.clipboardData?.getData('text') ?? '';
      const sanitizedText = getSanitizedElementValue(event.target, pastedText);
      if (sanitizedText === pastedText) return;

      event.preventDefault();
      if (sanitizedText) replaceSelectedText(event.target, sanitizedText);
    };

    const handleDrop = (event: DragEvent) => {
      if (!isTextEntryTarget(event.target) || !shouldSanitizeElement(event.target)) return;

      const droppedText = event.dataTransfer?.getData('text') ?? '';
      const sanitizedText = getSanitizedElementValue(event.target, droppedText);
      if (!droppedText || sanitizedText === droppedText) return;

      event.preventDefault();
      if (sanitizedText) replaceSelectedText(event.target, sanitizedText);
    };

    const handleInput = (event: Event) => {
      if (!isTextEntryTarget(event.target) || !shouldSanitizeElement(event.target)) return;

      const sanitizedValue = getSanitizedElementValue(event.target, event.target.value);
      if (sanitizedValue === event.target.value) return;

      setNativeInputValue(event.target, sanitizedValue);
    };

    document.addEventListener('beforeinput', handleBeforeInput, true);
    document.addEventListener('paste', handlePaste, true);
    document.addEventListener('drop', handleDrop, true);
    document.addEventListener('input', handleInput, true);

    return () => {
      document.removeEventListener('beforeinput', handleBeforeInput, true);
      document.removeEventListener('paste', handlePaste, true);
      document.removeEventListener('drop', handleDrop, true);
      document.removeEventListener('input', handleInput, true);
    };
  }, []);

  return null;
}

function Layout() {
  const guarded = (path: string, element: ReactNode) => (
    <GuardedRoute path={path}>
      {element}
    </GuardedRoute>
  );

  return (
    <UnsavedChangesProvider>
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
        <InputCharacterGuard />
        <Navbar />

        <UnsavedAwareContainer>
          <Suspense fallback={
            <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
              <CircularProgress />
            </Box>
          }>
            <Routes>
              <Route path="/" element={<Home />} />

          <Route path="/empleados" element={guarded('/empleados', <PruebaAxios />)} />
          <Route path="/departamentos" element={guarded('/departamentos', <Departamentos />)} />
          <Route path="/puestos" element={guarded('/puestos', <Puestos />)} />
          <Route path="/prestamos" element={guarded('/prestamos', <Prestamos />)} />
          <Route path="/permisos" element={guarded('/permisos', <Permisos />)} />
          <Route path="/rol-permisos" element={guarded('/rol-permisos', <RolPermisosView />)} />
          <Route path="/roles" element={guarded('/roles', <Roles />)} />
          <Route path="/periodo" element={guarded('/periodo', <Periodo />)} />
          <Route path="/control-laboral" element={guarded('/control-laboral', <ControlLaboral />)} />
          <Route path="/cuenta-bancaria" element={guarded('/cuenta-bancaria', <CuentaBancaria />)} />
          <Route path="/descuentos" element={guarded('/descuentos', <Descuentos />)} />
          <Route path="/tipo-ingresos" element={guarded('/tipo-ingresos', <TipoIngresos />)} />
          <Route path="/nomina-detalle" element={guarded('/nomina-detalle', <NominaDetallePage />)} />
          <Route path="/kpis" element={guarded('/kpis', <KPIPage />)} />
          <Route path="/kpi-resultado" element={guarded('/kpi-resultado', <KPIResultadoPage />)} />
          <Route path="/marcajes" element={guarded('/marcajes', <MarcajePage />)} />
          <Route path="/empleado-contrato" element={guarded('/empleado-contrato', <EmpleadoContrato />)} />
          <Route path="/sede" element={guarded('/sede', <Sede />)} />
          <Route path="/sucursales" element={guarded('/sucursales', <Sede />)} />
          <Route path="/bitacora" element={guarded('/bitacora', <Bitacora />)} />
          <Route path="/auditoria" element={guarded('/auditoria', <Auditoria />)} />
          <Route path="/liquidacion" element={guarded('/liquidacion', <Liquidacion />)} />
          <Route path="/nomina-asignaciones" element={guarded('/nomina-asignaciones', <NominaAsignaciones />)} />
          <Route path="/nomina" element={guarded('/nomina', <Nomina />)} />
          <Route path="/usuarios" element={guarded('/usuarios', <Usuario />)} />
          <Route path="/tipo-contrato" element={guarded('/tipo-contrato', <TipoContrato />)} />
          <Route path="/usuario-bitacora" element={guarded('/usuario-bitacora', <UsuarioBitacora />)} />
          <Route path="/horarios" element={guarded('/horarios', <HorarioCRUD />)} />
          <Route path="/suspensiones-igss" element={guarded('/suspensiones-igss', <SuspensionIgss />)} />
          <Route path="/tipos-descuento" element={<Navigate to="/descuentos" replace />} />
          <Route path="/prestamos-banco" element={<Navigate to="/prestamos" replace />} />
          <Route path="/prestamo-detalle" element={<Navigate to="/prestamos" replace />} />
          <Route path="/resumen-marcaje" element={guarded('/resumen-marcaje', <MarcajePage />)} />
          <Route path="/registro-vacaciones" element={<Navigate to="/control-laboral" replace />} />
          <Route path="/isr" element={<Navigate to="/descuentos" replace />} />
          <Route path="/irtra" element={<Navigate to="/descuentos" replace />} />
          <Route path="/intecap" element={<Navigate to="/descuentos" replace />} />
          <Route path="/aprobacion-nomina" element={guarded('/aprobacion-nomina', <AprobacionNomina />)} />
          <Route path="/reportes" element={guarded('/reportes', <ReportesView />)} />
          <Route path="/reporte-marcajes" element={<Navigate to="/reportes?reporte=reporte-marcajes" replace />} />
          <Route path="/reporte-igss" element={<Navigate to="/reportes?reporte=reporte-igss" replace />} />
          <Route path="/reporte-isr" element={<Navigate to="/reportes?reporte=reporte-isr" replace />} />
          <Route path="/reporte-aguinaldo" element={<Navigate to="/reportes?reporte=reporte-aguinaldo" replace />} />
          <Route path="/reporte-vacaciones" element={<Navigate to="/reportes?reporte=reporte-vacaciones" replace />} />
          <Route path="/reporte-descuentos" element={<Navigate to="/reportes?reporte=reporte-descuentos" replace />} />
          <Route path="/reporte-kpi" element={<Navigate to="/reportes?reporte=reporte-kpi" replace />} />
          <Route path="/reporte-horas-extra" element={<Navigate to="/reportes?reporte=reporte-horas-extra" replace />} />
          <Route path="/reporte-liquidacion" element={<Navigate to="/reportes?reporte=reporte-liquidacion" replace />} />
          <Route path="/dashboard-ejecutivo" element={<Navigate to="/reportes?reporte=dashboard-ejecutivo" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </UnsavedAwareContainer>
      </Box>
    </UnsavedChangesProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <CssBaseline />

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<Layout />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
