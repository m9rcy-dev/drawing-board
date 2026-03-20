"use client";

import type { LucideIcon } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToolButtonProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  shortcut?: string;
  variant?: "tool" | "action";
  danger?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ToolButton = ({
  icon: Icon,
  label,
  isActive = false,
  onClick,
  shortcut,
  variant = "tool",
  danger = false,
}: ToolButtonProps) => {
  const baseClasses =
    "group relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 cursor-pointer border";

  const activeClasses = isActive
    ? "bg-atelier-accent border-atelier-accent shadow-tool-active animate-tool-pop"
    : danger
    ? "bg-white/[0.03] border-white/[0.06] hover:bg-red-500/10 hover:border-red-500/30"
    : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12]";

  const iconColor = isActive
    ? "text-white"
    : danger
    ? "text-atelier-muted group-hover:text-red-400"
    : "text-atelier-muted group-hover:text-atelier-text";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${activeClasses}`}
      aria-label={label}
      aria-pressed={variant === "tool" ? isActive : undefined}
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      <Icon size={18} className={`${iconColor} transition-colors duration-150`} />

      {/* Tooltip */}
      <span
        className={`
          absolute left-full ml-3 px-2.5 py-1.5 rounded-lg
          bg-atelier-elevated border border-white/[0.08]
          text-atelier-text text-xs font-sans whitespace-nowrap
          opacity-0 pointer-events-none translate-x-1
          group-hover:opacity-100 group-hover:translate-x-0
          transition-all duration-200 z-50
          hidden md:flex items-center gap-2
          shadow-glass
        `}
      >
        {label}
        {shortcut && (
          <kbd className="text-atelier-muted text-[10px] font-mono bg-atelier-surface px-1.5 py-0.5 rounded">
            {shortcut}
          </kbd>
        )}
      </span>

      {/* Active indicator dot */}
      {isActive && (
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/60" />
      )}
    </button>
  );
};
