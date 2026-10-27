import type { SVGProps } from "react";

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  );
}

export const BackIcon = () => (
  <Svg>
    <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" />
    <path d="m17 9-6 6M11 9l6 6" />
  </Svg>
);

export const EnterIcon = () => (
  <Svg>
    <path d="M20 5v7a3 3 0 0 1-3 3H5" />
    <path d="m9 11-4 4 4 4" />
  </Svg>
);

export const ArrowLeftIcon = () => (
  <Svg>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Svg>
);

export const ArrowRightIcon = () => (
  <Svg width="18" height="18">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const HelpIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.4M12 17h.01" />
  </Svg>
);

export const CloseIcon = () => (
  <Svg>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const EyeIcon = ({ off }: { off?: boolean }) => (
  <Svg width="20" height="20">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" />}
  </Svg>
);

export const DiceIcon = () => (
  <Svg width="18" height="18">
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01" strokeWidth="3" />
  </Svg>
);

export const ShareIcon = () => (
  <Svg width="18" height="18">
    <path d="M12 3v12M7 8l5-5 5 5" />
    <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </Svg>
);

export const SwapIcon = () => (
  <Svg width="18" height="18">
    <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
  </Svg>
);
