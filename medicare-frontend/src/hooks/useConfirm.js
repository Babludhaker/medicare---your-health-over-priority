import { useState, useCallback } from 'react';

/**
 * useConfirm — drives a confirmation dialog imperatively.
 *
 *   const confirm = useConfirm();
 *   ...
 *   const ok = await confirm.ask({
 *     title: 'Cancel appointment?',
 *     message: 'This cannot be undone.',
 *     confirmLabel: 'Cancel appointment',
 *     tone: 'danger',
 *   });
 *   if (ok) { ... }
 *
 * Pair with <ConfirmDialog {...confirm.props} />.
 */
export function useConfirm() {
  const [state, setState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    tone: 'primary',
  });
  // The resolver for the in-flight ask() promise.
  const [resolver, setResolver] = useState(null);

  const ask = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: opts.title || 'Are you sure?',
        message: opts.message || '',
        confirmLabel: opts.confirmLabel || 'Confirm',
        cancelLabel: opts.cancelLabel || 'Cancel',
        tone: opts.tone || 'primary',
      });
      setResolver(() => resolve);
    });
  }, []);

  const close = useCallback(
    (result) => {
      setState((s) => ({ ...s, open: false }));
      resolver?.(result);
      setResolver(null);
    },
    [resolver]
  );

  return {
    ask,
    props: {
      ...state,
      onConfirm: () => close(true),
      onCancel: () => close(false),
    },
  };
}
