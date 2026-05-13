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
  const buttonClass =
    "ui-control ui-icon-button rounded-[var(--radius-md)]";

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMinimize();
        }}
        className={buttonClass}
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
        className={buttonClass}
        style={{ color: "var(--text-secondary)" }}
        title={isMaximized ? "Restore" : "Maximize"}
      >
        <Square size={10} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className={buttonClass}
        style={{
          color: "var(--text-secondary)",
          backgroundColor: "transparent",
        }}
        title="Close"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--state-danger)";
          e.currentTarget.style.color = "#ffffff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "var(--text-secondary)";
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
}
