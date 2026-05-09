"use client";
import { X, Minus, Square } from "lucide-react";

interface WindowControlsProps {
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  isMaximized: boolean;
}

export function WindowControls({
  onMinimize,
  onMaximize,
  onClose,
  isMaximized,
}: WindowControlsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMinimize();
        }}
        className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-[var(--accent-muted)] transition-colors"
        style={{ color: "var(--text-secondary)" }}
        title="Minimize"
      >
        <Minus size={12} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMaximize();
        }}
        className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-[var(--accent-muted)] transition-colors"
        style={{ color: "var(--text-secondary)" }}
        title={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? (
          <Square size={10} />
        ) : (
          <Square size={10} />
        )}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-red-500 hover:text-white transition-colors"
        style={{ color: "var(--text-secondary)" }}
        title="Close"
      >
        <X size={12} />
      </button>
    </div>
  );
}