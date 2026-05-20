import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

type SaveHandler = () => Promise<boolean> | boolean;

type UnsavedChangesContextValue = {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  registerSaveHandler: (handler: SaveHandler | null) => () => void;
  requestNavigation: (path: string) => void;
  resetUnsavedChanges: () => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const saveHandlerRef = useRef<SaveHandler | null>(null);

  const resetUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  const registerSaveHandler = useCallback((handler: SaveHandler | null) => {
    saveHandlerRef.current = handler;

    return () => {
      if (saveHandlerRef.current === handler) {
        saveHandlerRef.current = null;
      }
    };
  }, []);

  const requestNavigation = useCallback(
    (path: string) => {
      if (!hasUnsavedChanges) {
        navigate(path);
        return;
      }

      setPendingPath(path);
    },
    [hasUnsavedChanges, navigate]
  );

  const closeDialog = () => {
    if (!saving) setPendingPath(null);
  };

  const navigateToPendingPath = () => {
    if (!pendingPath) return;

    const nextPath = pendingPath;
    setPendingPath(null);
    setHasUnsavedChanges(false);
    navigate(nextPath);
  };

  const handleDiscard = () => {
    navigateToPendingPath();
  };

  const handleSaveAndExit = async () => {
    if (!pendingPath || !saveHandlerRef.current) {
      navigateToPendingPath();
      return;
    }

    try {
      setSaving(true);
      const saved = await saveHandlerRef.current();

      if (saved) {
        navigateToPendingPath();
      } else {
        setPendingPath(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const value = useMemo(
    () => ({
      hasUnsavedChanges,
      setHasUnsavedChanges,
      registerSaveHandler,
      requestNavigation,
      resetUnsavedChanges,
    }),
    [hasUnsavedChanges, registerSaveHandler, requestNavigation, resetUnsavedChanges]
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}

      <Dialog open={!!pendingPath} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Datos sin guardar</DialogTitle>
        <DialogContent>
          <DialogContentText>¿Desea guardar los datos?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDiscard} disabled={saving} color="inherit">
            No guardar
          </Button>
          <Button onClick={handleSaveAndExit} disabled={saving} variant="contained">
            {saving ? 'Guardando...' : 'Guardar y Salir'}
          </Button>
        </DialogActions>
      </Dialog>
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);

  if (!context) {
    throw new Error('useUnsavedChanges debe usarse dentro de UnsavedChangesProvider');
  }

  return context;
}
