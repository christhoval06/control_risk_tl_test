import { useEffect } from 'react';

export function useFocusTrap<T extends HTMLElement>(ref: React.RefObject<T | null>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !ref?.current) return;

    const modal = ref.current;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);

    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [ref, isActive]);
}
