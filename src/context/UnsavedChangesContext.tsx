import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const saveHandlerRef = useRef<SaveHandler | null>(null);
  const pendingPathRef = useRef<string | null>(null);
  const pendingHistoryDeltaRef = useRef<number | null>(null);
  const leavingAfterSaveRef = useRef(false);
  const stablePathRef = useRef(`${location.pathname}${location.search}${location.hash}`);
  const browserGuardPathRef = useRef<string | null>(null);
  const restoringBrowserNavigationRef = useRef(false);

  const currentPath = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    if (!hasUnsavedChanges || leavingAfterSaveRef.current) return;
    if (browserGuardPathRef.current === currentPath) return;

    window.history.pushState(
      { ...(window.history.state ?? {}), innovaUnsavedGuard: true },
      '',
      currentPath
    );
    browserGuardPathRef.current = currentPath;
  }, [currentPath, hasUnsavedChanges]);

  useEffect(() => {
    if (pendingPath || restoringBrowserNavigationRef.current) return;
    stablePathRef.current = currentPath;
  }, [currentPath, pendingPath]);

  useEffect(() => {
    const handleBrowserNavigation = () => {
      const attemptedPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const stablePath = stablePathRef.current;

      if (!hasUnsavedChanges || leavingAfterSaveRef.current || attemptedPath === stablePath) {
        if (hasUnsavedChanges && attemptedPath === stablePath && !leavingAfterSaveRef.current) {
          restoringBrowserNavigationRef.current = true;
          window.history.pushState(
            { ...(window.history.state ?? {}), innovaUnsavedGuard: true },
            '',
            stablePath
          );
          window.setTimeout(() => {
            restoringBrowserNavigationRef.current = false;
          }, 0);

          pendingHistoryDeltaRef.current = -2;
          pendingPathRef.current = stablePath;
          setPendingPath(stablePath);
          return;
        }

        stablePathRef.current = attemptedPath;
        return;
      }

      restoringBrowserNavigationRef.current = true;
      window.history.pushState(window.history.state, '', stablePath);
      navigate(stablePath, { replace: true });
      window.setTimeout(() => {
        restoringBrowserNavigationRef.current = false;
      }, 0);

      pendingPathRef.current = attemptedPath;
      pendingHistoryDeltaRef.current = null;
      setPendingPath(attemptedPath);
    };

    window.addEventListener('popstate', handleBrowserNavigation);

    return () => {
      window.removeEventListener('popstate', handleBrowserNavigation);
    };
  }, [hasUnsavedChanges, navigate]);

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
      pendingHistoryDeltaRef.current = null;
      setPendingPath(path);
    },
    [hasUnsavedChanges, navigate]
  );

  const closeDialog = () => {
    if (!saving) {
      pendingPathRef.current = null;
      pendingHistoryDeltaRef.current = null;
      setPendingPath(null);
    }
  };

  const cancelPendingNavigation = () => {
    pendingPathRef.current = null;
    pendingHistoryDeltaRef.current = null;
    setPendingPath(null);
  };

  const navigateToPath = (path: string | null, afterSave = false) => {
    const historyDelta = pendingHistoryDeltaRef.current;

    if (historyDelta !== null) {
      if (afterSave) leavingAfterSaveRef.current = true;
      pendingHistoryDeltaRef.current = null;
      pendingPathRef.current = null;
      browserGuardPathRef.current = null;
      setPendingPath(null);
      setHasUnsavedChanges(false);

      window.setTimeout(() => {
        window.history.go(historyDelta);
        window.setTimeout(() => {
          leavingAfterSaveRef.current = false;
        }, 0);
      }, 0);
      return;
    }

    if (!path) return;

    if (afterSave) leavingAfterSaveRef.current = true;
    pendingPathRef.current = null;
    pendingHistoryDeltaRef.current = null;
    browserGuardPathRef.current = null;
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
      const saved = await saveHandlerRef.current();
      if (saved === false) {
        cancelPendingNavigation();
        return;
      }
      navigateToPath(nextPath, true);
    } catch {
      cancelPendingNavigation();
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
          <DialogContentText>Desea Guardar los cambios</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDiscard} disabled={saving} color="inherit">
            No guardar
          </Button>
          <Button onClick={handleSaveAndExit} disabled={saving} variant="contained">
            {saving ? 'Guardando...' : 'Guardar y salir'}
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
