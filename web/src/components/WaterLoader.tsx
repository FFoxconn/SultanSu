import { useId } from "react";

type WaterLoaderProps = {
  size?: "full" | "small";
  label?: string;
  inverted?: boolean;
};

const BOTTLE_PATH =
  "M38 6 H62 V20 C62 22 64 23 68 26 C78 33 88 46 88 68 C88 100 72 129 50 129 C28 129 12 100 12 68 C12 46 22 33 32 26 C36 23 38 22 38 20 Z";

export function WaterLoader({ size = "full", label, inverted = false }: WaterLoaderProps) {
  const dimension = size === "full" ? 120 : 20;
  const clipId = `bottleClip-${useId()}`;

  return (
    <div className={`water-loader water-loader--${size}${inverted ? " water-loader--inverted" : ""}`}>
      <svg
        width={dimension}
        height={dimension * 1.35}
        viewBox="0 0 100 135"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={BOTTLE_PATH} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <g className="water-loader__fill">
            <rect x="0" y="0" width="100" height="135" />
            <ellipse className="water-loader__wave" cx="50" cy="0" rx="52" ry="5" />
            <circle className="water-loader__bubble b1" cx="40" cy="90" r="3" />
            <circle className="water-loader__bubble b2" cx="58" cy="105" r="2.2" />
            <circle className="water-loader__bubble b3" cx="48" cy="75" r="2.6" />
          </g>
        </g>

        <path className="water-loader__outline" d={BOTTLE_PATH} />
        <rect className="water-loader__cap" x="36" y="2" width="28" height="8" rx="2" />
      </svg>
      {label && <div className="water-loader__label">{label}</div>}
    </div>
  );
}
