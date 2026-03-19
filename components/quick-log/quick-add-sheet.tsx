"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { QuickLogPanel } from "./quick-log-panel";

interface QuickAddSheetProps {
  open: boolean;
  onClose: () => void;
}

export function QuickAddSheet({ open, onClose }: QuickAddSheetProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 flex w-full max-w-lg flex-col rounded-t-2xl bg-[var(--color-surface-card)] shadow-xl max-h-[85dvh]">
        {/* Handle + close */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="mx-auto h-1 w-10 rounded-full bg-warm-300" />
        </div>
        <div className="flex items-center justify-between px-4 pb-2">
          <h2 className="text-sm font-semibold text-warm-900">Quick Add</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-warm-400 hover:bg-warm-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <QuickLogPanel />
        </div>
      </div>
    </div>
  );
}
