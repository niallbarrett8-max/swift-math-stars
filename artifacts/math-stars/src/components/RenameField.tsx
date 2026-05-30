import { useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { playClick } from "@/lib/audio";

interface RenameFieldProps {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  maxLength?: number;
  className?: string;
}

/**
 * Unified rename input used by ProfileSelector and ClassroomScreen.
 * - 16px font (text-base) to prevent iOS Safari auto-zoom on focus
 * - Explicitly blurs the input after commit/cancel so the viewport
 *   never stays zoomed-in on iPhone after editing.
 */
export const RenameField = ({
  value,
  onChange,
  onCommit,
  onCancel,
  maxLength = 24,
  className = "",
}: RenameFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Select-all so typing replaces the default name immediately.
    inputRef.current?.select?.();
  }, []);

  const finish = (commit: boolean) => {
    // Blur BEFORE state change so iOS reliably restores viewport scale.
    inputRef.current?.blur();
    if (commit) onCommit();
    else onCancel();
  };

  return (
    <div
      className={`rounded-2xl bg-background border-4 border-primary p-1.5 flex items-center gap-1 ${className}`}
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            finish(true);
          } else if (e.key === "Escape") {
            e.preventDefault();
            finish(false);
          } else if (e.key.length === 1 || e.key === "Backspace") {
            playClick();
          }
        }}
        onBlur={() => {
          // If user taps away, treat as commit (Classroom-style behavior).
          onCommit();
        }}
        type="text"
        inputMode="text"
        enterKeyHint="done"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
        maxLength={maxLength}
        className="min-w-0 flex-1 bg-transparent text-base font-bold focus:outline-none px-1"
        style={{ fontSize: 16 }}
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => { playClick(); finish(true); }}
        className="size-8 rounded-lg bg-success text-success-foreground inline-flex items-center justify-center active:scale-95"
        aria-label="Save name"
      >
        <Check className="size-4" strokeWidth={3} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => { playClick(); finish(false); }}
        className="size-8 rounded-lg bg-muted inline-flex items-center justify-center active:scale-95"
        aria-label="Cancel"
      >
        <X className="size-4" strokeWidth={3} />
      </button>
    </div>
  );
};
