"use client";
import { useState, type ReactNode } from 'react';
import { Button, PrimaryButton } from './ui';

export function ConfirmButton({
  onConfirm,
  children,
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  disabled,
  className = ''
}: {
  onConfirm: () => Promise<void> | void;
  children: ReactNode;
  title?: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button className={className} disabled={disabled} onClick={() => setOpen(true)}>{children}</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-card w-full max-w-sm">
            <div className="p-4 border-b">
              <div className="font-semibold">{title}</div>
              {description && <div className="text-sm text-gray-600 mt-1">{description}</div>}
            </div>
            <div className="p-4 flex items-center justify-end gap-2">
              <Button onClick={() => setOpen(false)}>{cancelText}</Button>
              <PrimaryButton
                disabled={busy}
                onClick={async () => {
                  try {
                    setBusy(true);
                    await onConfirm();
                    setOpen(false);
                  } finally {
                    setBusy(false);
                  }
                }}
              >{confirmText}</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}




