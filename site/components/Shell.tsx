// Bow points right. Stroke (8) sits nearest the stern coxswain; each seat has one sweep oar.
export default function Shell({ className = "" }: { className?: string }) {
  return (
    <g className={className}>
      <path
        d="M-150 0Q-75-12 112-7Q147-4 155 0Q147 4 112 7Q-75 12-150 0Z"
        fill="var(--shell-paper, #f0ede1)"
        stroke="#bcbcae"
        strokeWidth="1"
      />
      <path d="M-130 0H132" stroke="#b6b8ad" strokeWidth=".7" />
      {Array.from({ length: 8 }, (_, i) => {
        const x = -91 + i * 25;
        const side = i % 2 === 0 ? 1 : -1;
        return (
          <g
            key={i}
            className="sweep-seat"
            data-seat={8 - i}
            data-side={side === 1 ? "starboard" : "port"}
          >
            {/* A single straight shaft through the oarlock, all blades at the same catch angle. */}
            <path
              className="sweep-oar"
              d={`M${x - 12} ${-side * 4}L${x + 40} ${side * 60}`}
              stroke="#e9b92d"
              strokeWidth="1.8"
              fill="none"
            />
            <path
              className="sweep-blade"
              d="M0-3L13-4L14 4L0 3Z"
              transform={`translate(${x + 40} ${side * 60}) rotate(${side * 51})`}
              fill="#e9b92d"
            />
            <circle cx={x} cy={side * 11} r="1.7" fill="#f0ede1" />
            <rect
              x={x - 3}
              y="-5"
              width="11"
              height="10"
              rx="3"
              fill="#173d44"
            />
            <circle cx={x - 6} cy="0" r="3" fill="#f0c9a8" />
          </g>
        );
      })}
      <g className="stern-coxswain" transform="translate(-126 0)">
        <rect x="-4" y="-4" width="8" height="8" rx="3" fill="#173d44" />
        <circle cx="5" cy="0" r="2.8" fill="#f0c9a8" />
      </g>
    </g>
  );
}
export function TinyShell() {
  return (
    <g>
      <path d="M-20 0Q0-5 20 0Q0 5-20 0Z" fill="currentColor" />
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={i}
          d={`M${-12 + i * 3.4} 0l4 ${i % 2 === 0 ? 7 : -7}`}
          stroke="currentColor"
          strokeWidth=".8"
        />
      ))}
    </g>
  );
}
