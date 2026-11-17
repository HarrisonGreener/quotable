import { useEffect, useId, useState } from "react";

// Quotable's loader: the Q mark is a tape measure. Its orange tail pulls out as a
// marked blade, then reels back into the case with a little snap, over and over.
// At rest it's exactly the logo.

// Drawn with the blade along +x, then tilted a little so the blade runs out to the
// right and slightly down, like a tape pulled across a surface.
const R = 33; // ring radius (same as the logo)
const W = 15; // stroke width
const TAIL_START = 26.9; // where the logo's tail starts, measured from the centre
const TAIL_END = 66.5; //  ...and where it ends
const PULL = 92; // how far the blade comes out

const ticks = Array.from({ length: 22 }, (_, i) => i);

export const TapeMeasure = ({ size = 72, className = "" }: { size?: number; className?: string }) => {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={(size * 222) / 108}
      height={size}
      viewBox="-46 -46 222 108"
      className={`tape ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* gap in the ring where the blade comes out */}
        <mask id={`tape-cut-${id}`} maskUnits="userSpaceOnUse" x="-60" y="-60" width="260" height="260">
          <rect x="-60" y="-60" width="260" height="260" fill="#fff" />
          <line x1={TAIL_START} y1="0" x2="200" y2="0" stroke="#000" strokeWidth={W + 8} strokeLinecap="round" />
        </mask>
        {/* the blade is hidden while it's wound up inside the case */}
        <clipPath id={`tape-out-${id}`}>
          <rect x={TAIL_START - W / 2} y={-30} width={260} height={60} />
        </clipPath>
      </defs>

      <g transform="rotate(18)">
        {/* the case */}
        <g mask={`url(#tape-cut-${id})`}>
          <circle r={R} fill="none" stroke="hsl(var(--primary))" strokeWidth={W} />
        </g>
        {/* the blade */}
        <g clipPath={`url(#tape-out-${id})`}>
          <g className="tape-blade">
            <line
              x1={TAIL_START - PULL}
              y1="0"
              x2={TAIL_END}
              y2="0"
              stroke="hsl(var(--accent))"
              strokeWidth={W}
              strokeLinecap="round"
            />
            {/* markings: a long tick every fifth */}
            {ticks.map((i) => {
              const x = TAIL_END - 12 - i * 5.5;
              const long = i % 5 === 0;
              return (
                <line
                  key={i}
                  x1={x}
                  y1={-W / 2 + 1}
                  x2={x}
                  y2={long ? 1.5 : -2.5}
                  stroke="#fff"
                  strokeOpacity={long ? 0.95 : 0.7}
                  strokeWidth={long ? 1.6 : 1.1}
                />
              );
            })}
            {/* the hook on the end */}
            <rect x={TAIL_END - 1} y={-W / 2 - 3} width="4.5" height={W + 6} rx="1.5" fill="hsl(var(--primary))" />
          </g>
        </g>
      </g>
    </svg>
  );
};

const QUOTE_STEPS = [
  "Measuring up the job…",
  "Listing the materials…",
  "Checking merchant prices…",
  "Working out labour…",
  "Adding it all up…",
];

/** Full loader with changing status lines, used while a quote is being made. */
export const TapeLoader = ({
  title = "Making your quote",
  steps = QUOTE_STEPS,
  size = 72,
}: {
  title?: string;
  steps?: string[];
  size?: number;
}) => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 2600);
    return () => clearInterval(t);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center text-center" role="status" aria-live="polite">
      <TapeMeasure size={size} />
      <h3 className="mt-4 font-heading text-lg font-semibold text-primary">{title}</h3>
      <p key={step} className="tape-step mt-1 min-h-[1.25rem] text-sm text-muted-foreground">
        {steps[step]}
      </p>
    </div>
  );
};
