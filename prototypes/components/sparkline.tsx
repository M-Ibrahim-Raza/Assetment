import { cn } from "@/lib/utils";

interface SparklineProps {
  /** Values in time order, oldest first. */
  points: readonly number[];
  /** What the line shows, for screen readers, e.g. "Up Rs 612,300 in 12 months". */
  label: string;
  /** Height and colour. The line is drawn in the text colour. */
  className?: string;
}

const WIDTH = 100;
const HEIGHT = 32;
const PADDING = 2;

/** A small trend line with no axes. Plain SVG until the app has a chart library. */
export function Sparkline({
  points,
  label,
  className = "h-12 text-chart-1",
}: SparklineProps) {
  if (points.length < 2) return null;

  const low = Math.min(...points);
  const span = Math.max(...points) - low;
  const step = WIDTH / (points.length - 1);
  const line = points
    .map((point, index) => {
      // A flat line sits in the middle.
      const share = span === 0 ? 0.5 : (point - low) / span;
      const y = HEIGHT - PADDING - share * (HEIGHT - PADDING * 2);
      return `${String(index * step)},${String(y)}`;
    })
    .join(" ");

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
    >
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
