import { useEffect, useMemo } from 'react';
import { useUnsavedChanges } from '../context/UnsavedChangesContext';

const serializeForm = (value: unknown) => JSON.stringify(value);

export function useUnsavedFormGuard<T>(
  form: T,
  initialForm: T,
  saveHandler: () => Promise<boolean> | boolean
) {
  const { registerSaveHandler, setHasUnsavedChanges, resetUnsavedChanges } = useUnsavedChanges();
  const initialSnapshot = useMemo(() => serializeForm(initialForm), [initialForm]);
  const formSnapshot = useMemo(() => serializeForm(form), [form]);

  useEffect(() => {
    setHasUnsavedChanges(formSnapshot !== initialSnapshot);
  }, [formSnapshot, initialSnapshot, setHasUnsavedChanges]);

  useEffect(() => registerSaveHandler(saveHandler), [registerSaveHandler, saveHandler]);

  useEffect(() => resetUnsavedChanges, [resetUnsavedChanges]);
}
