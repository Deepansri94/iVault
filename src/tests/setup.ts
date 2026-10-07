/**
 * @file setup.ts
 * Vitest environment setup polyfills
 */
import 'fake-indexeddb/auto';

// Mock minimal DOM document for Node.js test environment
if (typeof globalThis.document === 'undefined') {
  const styles = new Map<string, string>();
  (globalThis as any).document = {
    querySelector: () => null,
    documentElement: {
      style: {
        setProperty: (prop: string, val: string) => {
          styles.set(prop, val);
        },
        getPropertyValue: (prop: string) => {
          return styles.get(prop) || '';
        },
        removeProperty: (prop: string) => {
          styles.delete(prop);
        },
        removeAttribute: () => {
          styles.clear();
        },
      },
      removeAttribute: () => {
        styles.clear();
      },
    },
  };
}
