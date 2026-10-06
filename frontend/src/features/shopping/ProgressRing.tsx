import { toneStyle } from "./options";

type Segment = {
  color: string;
  count: number;
};

type Props = {
  segments: Segment[];
  total: number;
  remaining: number;
};

const RADIUS = 48;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3;

// One arc per section, sized by how many of that section's items are checked
export default function ProgressRing({ segments, total, remaining }: Props) {
  const arcs = [];
  let start = 0;
  for (const segment of segments) {
    const length = total > 0 ? (segment.count / total) * CIRCUMFERENCE : 0;
    arcs.push({ ...segment, start, length });
    start += length;
  }

  return (
    <div className="ring" role="img" aria-label={`${remaining} av ${total} varor kvar`}>
      <svg viewBox="0 0 112 112" aria-hidden="true">
        <circle className="ring-track" cx="56" cy="56" r={RADIUS} />
        {arcs.map((arc) => (
          <circle
            key={arc.color}
            className="ring-segment tone"
            style={toneStyle(arc.color)}
            cx="56"
            cy="56"
            r={RADIUS}
            strokeDasharray={`${Math.max(arc.length - GAP, 0)} ${CIRCUMFERENCE}`}
            strokeDashoffset={-arc.start}
          />
        ))}
      </svg>
      <div className="ring-label" aria-hidden="true">
        <span className="ring-count">{remaining}</span>
        <span className="ring-unit">kvar</span>
      </div>
    </div>
  );
}
