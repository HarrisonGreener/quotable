import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export const useAutoSave = <T>({
  data,
  onSave,
  delay = 1000,
  enabled = true,
}: UseAutoSaveOptions<T>) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previousDataRef = useRef<T>(data);
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      await onSave(data);
      toast.success('Saved ✓', {
        duration: 1500,
        position: 'bottom-right',
      });
    } catch (error) {
      console.error('Auto-save error:', error);
      toast.error('Failed to save changes');
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave, enabled]);

  useEffect(() => {
    // Skip if disabled or data hasn't changed
    if (!enabled || JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save();
      previousDataRef.current = data;
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  return { save };
};
