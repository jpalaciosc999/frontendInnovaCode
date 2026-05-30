import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useUnsavedChanges } from './UnsavedChangesContext';

export type PayrollGuideStep = {
  title: string;
  helper: string;
  path: string;
  actionLabel: string;
  optional?: boolean;
};

type PayrollGuideContextValue = {
  active: boolean;
  steps: PayrollGuideStep[];
  completedPaths: string[];
  currentStep: PayrollGuideStep | null;
  currentIndex: number;
  nextStep: PayrollGuideStep | null;
  startGuide: () => void;
  stopGuide: () => void;
  completeCurrentStep: () => void;
  goToStep: (path: string) => void;
  goToNextStep: (force?: boolean) => void;
};

const STORAGE_KEY = 'innova-payroll-guide';
export const PAYROLL_GUIDE_STEP_COMPLETED_EVENT = 'innova-payroll-guide-step-completed';

export const payrollGuideSteps: PayrollGuideStep[] = [
  {
    title: 'Preparar empleados',
    helper: 'Registra el empleado y confirma que tenga contrato, puesto, horario, sede y sueldo.',
    path: '/empleados',
    actionLabel: 'Ir a asistencia',
  },
  {
    title: 'Revisar asistencia',
    helper: 'Valida marcajes, permisos, suspensiones y pendientes laborales antes de abrir el periodo.',
    path: '/control-laboral',
    actionLabel: 'Ir a periodo',
  },
  {
    title: 'Abrir periodo',
    helper: 'Crea o confirma el periodo que se usara para calcular la nomina.',
    path: '/periodo',
    actionLabel: 'Ir a ingresos',
  },
  {
    title: 'Revisar ingresos',
    helper: 'Confirma que existan los conceptos de ingreso que se podran asignar a empleados.',
    path: '/tipo-ingresos',
    actionLabel: 'Ir a descuentos',
  },
  {
    title: 'Revisar descuentos',
    helper: 'Confirma que existan los descuentos que se podran asignar a empleados.',
    path: '/descuentos',
    actionLabel: 'Ir a asignaciones',
  },
  {
    title: 'Asignar ingresos y descuentos',
    helper: 'Selecciona periodo, empleado, ingreso o descuento y monto antes de generar la nomina.',
    path: '/nomina-asignaciones',
    actionLabel: 'Ir a generar nomina',
  },
  {
    title: 'Generar nomina',
    helper: 'Genera la planilla, revisa inconsistencias y envia a aprobacion cuando este lista.',
    path: '/nomina',
    actionLabel: 'Ir a reportes',
  },
  {
    title: 'Consultar reportes',
    helper: 'Descarga respaldos, boletas y reportes contables despues de generar la nomina.',
    path: '/reportes',
    actionLabel: 'Finalizar guia',
    optional: true,
  },
];

const PayrollGuideContext = createContext<PayrollGuideContextValue | null>(null);

const readStoredGuide = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as {
      active?: boolean;
      completedPaths?: string[];
    };

    return {
      active: Boolean(stored.active),
      completedPaths: Array.isArray(stored.completedPaths) ? stored.completedPaths : [],
    };
  } catch {
    return { active: false, completedPaths: [] };
  }
};

export const notifyPayrollGuideStepCompleted = () => {
  window.dispatchEvent(new Event(PAYROLL_GUIDE_STEP_COMPLETED_EVENT));
};

export function PayrollGuideProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { canAccessPath } = useAuth();
  const { requestNavigation } = useUnsavedChanges();
  const stored = useMemo(readStoredGuide, []);
  const [active, setActive] = useState(stored.active);
  const [completedPaths, setCompletedPaths] = useState<string[]>(stored.completedPaths);

  const steps = useMemo(
    () => payrollGuideSteps.filter((step) => canAccessPath(step.path)),
    [canAccessPath]
  );
  const currentPath = `${location.pathname}${location.search}${location.hash}`;
  const currentIndex = steps.findIndex((step) => step.path === location.pathname);
  const currentStep = currentIndex >= 0 ? steps[currentIndex] : null;
  const nextStep = currentIndex >= 0 ? steps[currentIndex + 1] ?? null : steps[0] ?? null;

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ active, completedPaths })
    );
  }, [active, completedPaths]);

  const markCompleted = useCallback((path: string) => {
    setCompletedPaths((prev) => (prev.includes(path) ? prev : [...prev, path]));
  }, []);

  const goToStep = useCallback(
    (path: string) => {
      setActive(true);
      requestNavigation(path);
    },
    [requestNavigation]
  );

  const startGuide = useCallback(() => {
    setActive(true);
    setCompletedPaths([]);
    requestNavigation(steps[0]?.path || '/');
  }, [requestNavigation, steps]);

  const stopGuide = useCallback(() => {
    setActive(false);
    setCompletedPaths([]);
  }, []);

  const completeCurrentStep = useCallback(() => {
    if (!currentStep) return;
    markCompleted(currentStep.path);
  }, [currentStep, markCompleted]);

  const goToNextStep = useCallback((force = false) => {
    if (currentStep) markCompleted(currentStep.path);

    if (nextStep) {
      setActive(true);
      if (force) {
        navigate(nextStep.path);
      } else {
        requestNavigation(nextStep.path);
      }
      return;
    }

    stopGuide();
  }, [currentStep, markCompleted, navigate, nextStep, requestNavigation, stopGuide]);

  useEffect(() => {
    const handleStepCompleted = () => {
      if (!active || !currentStep) return;
      goToNextStep(true);
    };

    window.addEventListener(PAYROLL_GUIDE_STEP_COMPLETED_EVENT, handleStepCompleted);
    return () => window.removeEventListener(PAYROLL_GUIDE_STEP_COMPLETED_EVENT, handleStepCompleted);
  }, [active, currentStep, currentPath, goToNextStep]);

  const value = useMemo(
    () => ({
      active,
      steps,
      completedPaths,
      currentStep,
      currentIndex,
      nextStep,
      startGuide,
      stopGuide,
      completeCurrentStep,
      goToStep,
      goToNextStep,
    }),
    [
      active,
      steps,
      completedPaths,
      currentStep,
      currentIndex,
      nextStep,
      startGuide,
      stopGuide,
      completeCurrentStep,
      goToStep,
      goToNextStep,
    ]
  );

  return (
    <PayrollGuideContext.Provider value={value}>
      {children}
    </PayrollGuideContext.Provider>
  );
}

export function usePayrollGuide() {
  const context = useContext(PayrollGuideContext);

  if (!context) {
    throw new Error('usePayrollGuide debe usarse dentro de PayrollGuideProvider');
  }

  return context;
}
