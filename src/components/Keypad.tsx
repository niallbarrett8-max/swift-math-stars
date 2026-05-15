import { Delete } from "lucide-react";

interface KeypadProps {
  onDigit: (d: string) => void;
  onDelete: () => void;
  onClear: () => void;
  disabled?: boolean;
}

const Key = ({
  children,
  onClick,
  variant = "primary",
  ariaLabel,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "neutral" | "accent";
  ariaLabel?: string;
  disabled?: boolean;
}) => {
  const cls =
    variant === "neutral"
      ? "btn-3d btn-3d-neutral"
      : variant === "accent"
        ? "btn-3d btn-3d-accent"
        : "btn-3d";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${cls} h-14 sm:h-16 text-2xl sm:text-3xl select-none`}
    >
      {children}
    </button>
  );
};

export const Keypad = ({ onDigit, onDelete, onClear, disabled }: KeypadProps) => {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  return (
    <div className="w-full max-w-md mx-auto grid grid-cols-3 gap-2 sm:gap-3">
      {digits.map((d) => (
        <Key key={d} onClick={() => onDigit(d)} ariaLabel={`Digit ${d}`} disabled={disabled}>
          {d}
        </Key>
      ))}
      <Key onClick={onClear} variant="accent" ariaLabel="Clear" disabled={disabled}>
        C
      </Key>
      <Key onClick={() => onDigit("0")} ariaLabel="Digit 0" disabled={disabled}>
        0
      </Key>
      <Key onClick={onDelete} variant="neutral" ariaLabel="Delete" disabled={disabled}>
        <Delete className="size-7" strokeWidth={2.5} />
      </Key>
    </div>
  );
};
