/**
 * Authored icon set. One grammar: 1.75 stroke, round caps and joins,
 * 24-unit grid, no fills. Nothing here is an emoji or a unicode glyph.
 */
type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function PlayIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8 5.6v12.8a.8.8 0 0 0 1.22.68l10.2-6.4a.8.8 0 0 0 0-1.36L9.22 4.92A.8.8 0 0 0 8 5.6Z" />
    </svg>
  );
}

export function ArrowIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

export function ArrowBackIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

/** Movement: a walking figure, the same posture as the brand mark. */
export function MovementIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="14" cy="4.6" r="2.1" />
      <path d="M13.4 9.2 10 11.6l1.4 4.2" />
      <path d="M11.4 15.8 9 21" />
      <path d="m13.4 9.2 3.4 2.2 1 3.4" />
      <path d="M10 11.6 5.6 10" />
      <path d="m13.8 15 3.6 5.6" />
    </svg>
  );
}

/** Cognition: a head in profile with an active loop inside it. */
export function MindIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 12.4a7.4 7.4 0 1 0-12.8 5v3.1" />
      <path d="M7.2 17.4H4.6l1.7-4-1.4-1" />
      <path d="M11 9.6a2.6 2.6 0 1 1 3.2 2.5v2.3" />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6.5 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M10.5 17.4h3" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.8 6.8 7.3 5.5a1.5 1.5 0 0 0 1.8 0l7.3-5.5" />
    </svg>
  );
}

export function PinIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21s6.5-6.1 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 14.9 12 21 12 21Z" />
      <circle cx="12" cy="10.4" r="2.4" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.4V12l3 2" />
    </svg>
  );
}

/** Questionnaire: a clipboard with answer lines. */
export function ClipboardIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="5" y="4" width="14" height="17" rx="2.5" />
      <path d="M9 3h6v3H9zM9 11h6M9 15h4" />
    </svg>
  );
}

/** Personal plan: two adjustable sliders. */
export function SlidersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  );
}

export function ArrowUpIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

export function ArrowDownIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}

/** Motion detection: a scan frame around a figure. */
export function ScanIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="9" r="1.75" />
      <path d="M8.5 12.5l3.5 1 3.5-1M12 13.5v3" />
    </svg>
  );
}
