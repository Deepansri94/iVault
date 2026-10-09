import { useEffect, useRef } from 'react';
import { focusFormOnScreen, lockScrollForModal, unlockScrollForModal } from '../utils/formFocus';

/**
 * Hook to focus an open modal/form on the screen.
 * - Centers the form in the viewport
 * - Locks background scroll so the form stays fixed in focus
 * - Focuses the first editable input field
 */
export function useFormFocus<T extends HTMLElement = HTMLDivElement>(isOpen: boolean = true) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!isOpen) return;

    lockScrollForModal();

    // Trigger focus after layout frame
    const timer = setTimeout(() => {
      if (containerRef.current) {
        focusFormOnScreen(containerRef.current);
      }
    }, 40);

    return () => {
      clearTimeout(timer);
      unlockScrollForModal();
    };
  }, [isOpen]);

  return containerRef;
}
