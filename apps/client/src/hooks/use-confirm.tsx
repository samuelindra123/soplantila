'use client';

import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
  });
  const [resolveReject, setResolveReject] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolveReject({ resolve });
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resolveReject?.resolve(false);
    setResolveReject(null);
  }, [resolveReject]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolveReject?.resolve(true);
    setResolveReject(null);
  }, [resolveReject]);

  return {
    confirm,
    isOpen,
    options,
    handleClose,
    handleConfirm,
  };
}
