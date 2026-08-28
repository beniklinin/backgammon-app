"use client";

import type { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="animate-modal card w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
