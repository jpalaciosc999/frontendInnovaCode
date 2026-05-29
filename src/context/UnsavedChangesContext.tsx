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

type SaveHandler = () => Promise<boolean | void> | boolean | void;

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
  const pendingPathRef = useRef<string | null>(null);
  const leavingAfterSaveRef = useRef(false);

  const updateHasUnsavedChanges = useCallback((value: boolean) => {
    if (leavingAfterSaveRef.current && value) return;
    setHasUnsavedChanges(value);
  }, []);

  const resetUnsavedChanges = useCallback(() => {
    if (leavingAfterSaveRef.current) return;
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
      if (!hasUnsavedChanges || leavingAfterSaveRef.current) {
        navigate(path);
        return;
      }

      pendingPathRef.current = path;
      setPendingPath(path);
    },
    [hasUnsavedChanges, navigate]
  );

  const closeDialog = () => {
    if (!saving) {
      pendingPathRef.current = null;
      setPendingPath(null);
    }
  };

  const navigateToPath = (path: string | null, afterSave = false) => {
    if (!path) return;

    if (afterSave) leavingAfterSaveRef.current = true;
    pendingPathRef.current = null;
    setPendingPath(null);
    setHasUnsavedChanges(false);

    window.setTimeout(() => {
      navigate(path);
      window.setTimeout(() => {
        leavingAfterSaveRef.current = false;
      }, 0);
    }, 0);
  };

  const handleDiscard = () => {
    navigateToPath(pendingPathRef.current ?? pendingPath);
  };

  const handleSaveAndExit = async () => {
    const nextPath = pendingPathRef.current ?? pendingPath;

    if (!nextPath || !saveHandlerRef.current) {
      navigateToPath(nextPath);
      return;
    }

    try {
      setSaving(true);
      await saveHandlerRef.current();
      navigateToPath(nextPath, true);
    } finally {
      setSaving(false);
    }
  };

  const value = useMemo(
    () => ({
      hasUnsavedChanges,
      setHasUnsavedChanges: updateHasUnsavedChanges,
      registerSaveHandler,
      requestNavigation,
      resetUnsavedChanges,
    }),
    [hasUnsavedChanges, registerSaveHandler, requestNavigation, resetUnsavedChanges, updateHasUnsavedChanges]
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
