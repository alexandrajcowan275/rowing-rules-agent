"use client";
import { useRef, useState } from "react";
import Shell from "./Shell";
import useReducedMotion from "./useReducedMotion";
export default function RaceScene() {
  const ripple = useRef<SVGCircleElement>(null);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  return (
    <div
      className={`race-scene ${paused ? "paused" : ""}`}
      onPointerMove={(e) => {
        if (reduced || paused || e.pointerType === "touch") return;
        const rect = e.currentTarget.getBoundingClientRect();
        ripple.current?.setAttribute(
          "cx",
          String(((e.clientX - rect.left) / rect.width) * 1440),
        );
        ripple.current?.setAttribute(
          "cy",
          String(((e.clientY - rect.top) / rect.height) * 530),
        );
      }}
    >
      <svg
        viewBox="0 0 1440 530"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="Top-down illustration of an eight-person racing shell on dark water, between buoy lines with oar puddles trailing behind."
      >
        <defs>
          <pattern
            id="water-lines"
            width="160"
            height="43"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 22q40-7 80 0t80 0"
              fill="none"
              stroke="#668e8f"
              strokeOpacity=".14"
              strokeWidth=".7"
            />
          </pattern>
        </defs>
        <rect width="1440" height="530" fill="#0a2c35" />
        <rect width="1440" height="530" fill="url(#water-lines)" />
        {[125, 405].map((y) => (
          <g key={y}>
            <path d={`M0 ${y}H1440`} stroke="#507075" strokeWidth=".7" />
            {Array.from({ length: 40 }, (_, i) => (
              <circle
                key={i}
                cx={i * 38}
                cy={y}
                r="2.5"
                fill={i % 5 === 0 ? "#e8e4d6" : "#cdb252"}
              />
            ))}
          </g>
        ))}
        <g className="racing-eight">
          <g className="oar-puddles">
            {Array.from({ length: 12 }, (_, i) => (
              <ellipse
                key={i}
                cx={310 - i * 48}
                cy={i % 2 === 0 ? 198 : 332}
                rx={20 + i * 2}
                ry={5 + i * 0.5}
                fill="none"
                stroke="#8fb0ab"
                opacity={0.4 - i * 0.024}
                transform={`rotate(${i % 2 === 0 ? -12 : 12} ${310 - i * 48} ${i % 2 === 0 ? 198 : 332})`}
              />
            ))}
          </g>
          <g transform="translate(785 265) scale(1.8)">
            <Shell />
          </g>
        </g>
        <circle
          ref={ripple}
          className="cursor-ripple"
          cx="-100"
          cy="-100"
          r="55"
          fill="none"
          stroke="#d1ddcc"
          strokeOpacity=".24"
        />
        <text x="44" y="65" className="scene-label">
          THE EVIDENCE COURSE
        </text>
      </svg>
      <span className="scene-distance mono">2,000 METERS</span>
      <button
        className="water-toggle"
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
      >
        {paused ? "Resume water motion" : "Pause water motion"}
      </button>
    </div>
  );
}
