/**
 * NovaMascot — the Math Stars star character.
 *
 * Self-contained SVG component. No dependency on gameplay systems.
 * Safe to disable by simply removing usages without touching game logic.
 */
import { useId } from "react";

export type NovaExpression = "happy" | "celebrating" | "thinking" | "neutral";
export type NovaSize = "sm" | "md" | "lg";
export type BubbleSide = "left" | "right";

interface NovaMascotProps {
  expression?: NovaExpression;
  message?: string;
  size?: NovaSize;
  bubbleSide?: BubbleSide;
  className?: string;
}

const SIZE_PX: Record<NovaSize, number> = { sm: 60, md: 88, lg: 116 };

interface StarFaceProps {
  expression: NovaExpression;
  gradId: string;
  glowId: string;
}

const StarFace = ({ expression, gradId, glowId }: StarFaceProps) => {
  const isOpen = expression === "happy" || expression === "thinking";
  const isCelebrating = expression === "celebrating";
  const isNeutral = expression === "neutral";

  return (
    <svg
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      <defs>
        {/* 3-D-style radial gradient: bright centre, amber edges */}
        <radialGradient
          id={gradId}
          cx="44"
          cy="38"
          r="66"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFDE7" />
          <stop offset="22%" stopColor="#FFE84D" />
          <stop offset="62%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
        {/* Soft outer glow */}
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE84D" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient glow ring */}
      <circle cx="60" cy="60" r="58" fill={`url(#${glowId})`} />

      {/* Drop shadow layer (slightly offset duplicate) */}
      <polygon
        points="60,10 73,44 111,45 82,67 93,103 60,83 27,103 38,67 9,45 47,44"
        fill="#B45309"
        opacity="0.18"
        transform="translate(2.5,4)"
      />

      {/* Star body */}
      <polygon
        points="60,8 72,43 110,44 80,66 91,102 60,81 29,102 40,66 10,44 48,43"
        fill={`url(#${gradId})`}
        stroke="#D97706"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Specular highlight (top-left shine) */}
      <path
        d="M54 12 L63 36 L84 37 L69 49"
        fill="none"
        stroke="rgba(255,255,255,0.42)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ─── Eyes ─── */}
      {isCelebrating ? (
        /* Squeezed-happy arc eyes */
        <>
          <path d="M40 55 Q45 49 50 55" stroke="#1A0E00" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <path d="M70 55 Q75 49 80 55" stroke="#1A0E00" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        /* Open round eyes */
        <>
          <circle cx="45" cy="55" r="7.5" fill="#1A0E00" />
          <circle cx="43" cy="52" r="3" fill="white" />
          <circle cx="42.5" cy="51.5" r="1.5" fill="white" opacity="0.9" />
          <circle cx="75" cy="55" r="7.5" fill="#1A0E00" />
          <circle cx="73" cy="52" r="3" fill="white" />
          <circle cx="72.5" cy="51.5" r="1.5" fill="white" opacity="0.9" />
          {expression === "thinking" && (
            /* Raised brow on one side */
            <path d="M39 47 Q45 43 51 46" stroke="#1A0E00" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          )}
        </>
      )}

      {/* ─── Rosy cheeks ─── */}
      <ellipse cx="36" cy="63" rx="8" ry="4.5" fill="#FF6B8A" opacity="0.38" />
      <ellipse cx="84" cy="63" rx="8" ry="4.5" fill="#FF6B8A" opacity="0.38" />

      {/* ─── Mouth ─── */}
      {isCelebrating ? (
        <path d="M47 63 Q60 80 73 63" stroke="#1A0E00" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : isNeutral ? (
        <path d="M50 67 L70 67" stroke="#1A0E00" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      ) : expression === "thinking" ? (
        <path d="M51 68 Q57 73 68 65" stroke="#1A0E00" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      ) : (
        /* happy */
        <path d="M50 66 Q60 77 70 66" stroke="#1A0E00" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      )}

      {/* ─── Celebrating sparkles ─── */}
      {isCelebrating && (
        <>
          <text x="94" y="30" fontSize="11" fill="#FFD700" fontFamily="sans-serif">✦</text>
          <text x="12" y="35" fontSize="9" fill="#FFD700" fontFamily="sans-serif">✦</text>
          <text x="98" y="82" fontSize="8" fill="#F59E0B" fontFamily="sans-serif">✦</text>
          <text x="8" y="80" fontSize="7" fill="#FFE84D" fontFamily="sans-serif">✦</text>
        </>
      )}
    </svg>
  );
};

export const NovaMascot = ({
  expression = "happy",
  message,
  size = "md",
  bubbleSide = "right",
  className = "",
}: NovaMascotProps) => {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "_");
  const gradId = `nova_body_${uid}`;
  const glowId = `nova_glow_${uid}`;
  const px = SIZE_PX[size];

  const bubbleTail: React.CSSProperties =
    bubbleSide === "left"
      ? {
          position: "absolute",
          right: -8,
          top: 12,
          width: 0,
          height: 0,
          borderTop: "7px solid transparent",
          borderBottom: "7px solid transparent",
          borderLeft: "9px solid white",
        }
      : {
          position: "absolute",
          left: -8,
          top: 12,
          width: 0,
          height: 0,
          borderTop: "7px solid transparent",
          borderBottom: "7px solid transparent",
          borderRight: "9px solid white",
        };

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      style={{ flexDirection: bubbleSide === "left" ? "row-reverse" : "row" }}
    >
      {/* Star mascot */}
      <div style={{ width: px, height: px, flexShrink: 0 }}>
        <StarFace expression={expression} gradId={gradId} glowId={glowId} />
      </div>

      {/* Speech bubble */}
      {message && (
        <div className="relative flex-shrink-0">
          <div className="bg-white rounded-2xl px-3 py-2 shadow-md text-xs sm:text-sm font-bold text-gray-700 max-w-[128px] sm:max-w-[152px] leading-snug">
            {message}
          </div>
          <div style={bubbleTail} />
        </div>
      )}
    </div>
  );
};
