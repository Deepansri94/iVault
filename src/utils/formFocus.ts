/**
 * Global form focusing and modal viewport positioning utility.
 * Ensures that whenever any form or modal opens in the application:
 * 1. The modal/form is centered and scrolled into view on the screen.
 * 2. Background page scrolling is locked so the form remains stably focused.
 * 3. The first editable input field receives keyboard/screen focus.
 */

let observerInitialized = false;
let activeModalCount = 0;
let previousBodyOverflow = '';

/**
 * Focuses the first editable input inside the given container (or finds the newest active form/dialog).
 */
export function focusFormOnScreen(targetContainer?: HTMLElement | null): boolean {
  try {
    const container =
      targetContainer ||
      (document.querySelector<HTMLElement>('[role="dialog"]') ||
        document.querySelector<HTMLElement>('.fixed.inset-0 form') ||
        document.querySelector<HTMLElement>('.fixed.inset-0 > div') ||
        document.querySelector<HTMLElement>('form'));

    if (!container) return false;

    // 1. Ensure the container is scrolled into the center of the viewport
    if (typeof container.scrollIntoView === 'function') {
      container.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }

    // 2. Locate first editable interactive input/select/textarea
    // Exclude hidden inputs, buttons (so close button 'X' isn't focused first), and disabled fields
    const firstInput = container.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([disabled]):not([readonly]), ' +
      'select:not([disabled]), ' +
      'textarea:not([disabled]):not([readonly])'
    );

    if (firstInput) {
      firstInput.focus({ preventScroll: false });
      // If text or number input, put cursor at the end without overriding selection
      if (
        (firstInput instanceof HTMLInputElement && ['text', 'number', 'tel', 'email', 'search', 'url'].includes(firstInput.type)) ||
        firstInput instanceof HTMLTextAreaElement
      ) {
        const valLen = firstInput.value ? firstInput.value.length : 0;
        if (typeof firstInput.setSelectionRange === 'function' && valLen > 0) {
          firstInput.setSelectionRange(valLen, valLen);
        }
      }
      return true;
    }

    // Fallback: focus the container if it has tabIndex
    if (container.hasAttribute('tabindex')) {
      container.focus();
      return true;
    }

    return false;
  } catch (err) {
    console.debug('formFocus helper handled notice:', err);
    return false;
  }
}

/**
 * Locks background scrolling when a modal or form overlay is active.
 */
export function lockScrollForModal() {
  if (typeof document === 'undefined') return;
  if (activeModalCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  activeModalCount++;
}

/**
 * Restores background scrolling when modal is closed.
 */
export function unlockScrollForModal() {
  if (typeof document === 'undefined') return;
  activeModalCount = Math.max(0, activeModalCount - 1);
  if (activeModalCount === 0) {
    document.body.style.overflow = previousBodyOverflow || '';
  }
}

/**
 * Initializes the global DOM observer that watches for newly mounted forms or modals,
 * immediately bringing them into focus on the screen.
 */
export function initGlobalFormFocusObserver(): () => void {
  if (observerInitialized || typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }
  observerInitialized = true;

  const handleNewElement = (node: Node) => {
    if (!(node instanceof HTMLElement)) return;

    // Check if the node is a modal, dialog, or form overlay
    const isModalOverlay =
      node.classList.contains('fixed') &&
      node.classList.contains('inset-0');

    const isDialog =
      node.getAttribute('role') === 'dialog' ||
      node.querySelector('[role="dialog"]') !== null;

    const hasForm =
      node.tagName.toLowerCase() === 'form' ||
      node.querySelector('form') !== null;

    if (isModalOverlay || isDialog || (hasForm && node.closest('.fixed.inset-0'))) {
      lockScrollForModal();

      // Focus after DOM render & microtask
      setTimeout(() => {
        focusFormOnScreen(node);
      }, 50);
    }
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const addedNode of Array.from(mutation.addedNodes)) {
          handleNewElement(addedNode);
        }
        for (const removedNode of Array.from(mutation.removedNodes)) {
          if (removedNode instanceof HTMLElement) {
            const wasModal =
              (removedNode.classList.contains('fixed') && removedNode.classList.contains('inset-0')) ||
              removedNode.getAttribute('role') === 'dialog' ||
              removedNode.querySelector('[role="dialog"]');
            if (wasModal) {
              unlockScrollForModal();
            }
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also dispatch handler on custom event
  const onFormOpened = (event: Event) => {
    const customEvt = event as CustomEvent;
    const target = customEvt.detail?.target as HTMLElement | undefined;
    setTimeout(() => {
      focusFormOnScreen(target);
    }, 30);
  };

  window.addEventListener('applet:form-opened', onFormOpened);

  return () => {
    observer.disconnect();
    window.removeEventListener('applet:form-opened', onFormOpened);
    observerInitialized = false;
  };
}
