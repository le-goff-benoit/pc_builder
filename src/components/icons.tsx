/** Compact stroke icons drawn on a 16×16 grid. They inherit `currentColor`. */
import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function Svg({ size = 15, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Plus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 3.3v9.4M3.3 8h9.4" />
  </Svg>
);

export const Check = (p: IconProps) => (
  <Svg {...p} strokeWidth="2">
    <path d="M3 8.4l3.3 3.3L13 4.3" />
  </Svg>
);

export const Star = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M8 1.8l1.85 3.75 4.15.6-3 2.93.71 4.13L8 11.78 4.29 13.2 5 9.06l-3-2.93 4.15-.6z" />
  </Svg>
);

export const Trash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.2 4.5h9.6M6.4 4.5V3.1h3.2v1.4M4.6 4.5l.6 8.4h5.6l.6-8.4" />
  </Svg>
);

export const Pencil = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.8 2.4l2.8 2.8M2.8 13.2l.9-3.3 7-7 2.4 2.4-7 7-3.3.9z" />
  </Svg>
);

export const External = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.4 3.4H3.2v9.4h9.4V9.6M9.2 3.4h3.4v3.4M12.6 3.4L7.1 8.9" />
  </Svg>
);

export const ArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8.6 3.6L4.2 8l4.4 4.4M4.2 8h8" />
  </Svg>
);

export const Layers = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 1.9l6.1 3-6.1 3-6.1-3 6.1-3zM2 8.1l6 3 6-3M2 11.2l6 3 6-3" />
  </Svg>
);

export const Bars = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12.7V8.4M7 12.7V4.6M11 12.7V6.7M13.4 12.7H2.6" />
  </Svg>
);

export const Spinner = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="5.6" strokeOpacity="0.25" />
    <path d="M8 2.4A5.6 5.6 0 0113.6 8" />
  </Svg>
);

export const X = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </Svg>
);

export const Box = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 1.9l6.1 3v6.2l-6.1 3-6.1-3V4.9l6.1-3zM2 4.9l6 3 6-3M8 7.9v6.2" />
  </Svg>
);
