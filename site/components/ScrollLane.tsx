"use client";
import { useEffect, useRef } from "react";
import { TinyShell } from "./Shell";
import useReducedMotion from "./useReducedMotion";
const milestones = [
  ["problem", 250],
  ["builder", 500],
  ["workflow", 1000],
  ["citation-fix", 1500],
  ["limitations", 1750],
  ["results", 2000],
] as const;
export default function ScrollLane() {
  const shell = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Each course marker lands on its distance when its section reaches the reading line.
        const readingLine = Math.min(innerHeight * 0.2, 160);
        const anchors = [
          { y: 0, meters: 0 },
          ...milestones.map(([id, meters]) => {
            const section = document.getElementById(id)!;
            const marker = section.querySelector(".section-marker") ?? section;
            return {
              y: Math.max(
                0,
                marker.getBoundingClientRect().top + scrollY - readingLine,
              ),
              meters,
            };
          }),
        ];
        let meters = 2000;
        for (let i = 1; i < anchors.length; i++)
          if (scrollY < anchors[i].y) {
            const from = anchors[i - 1],
              to = anchors[i];
            const fraction = Math.max(
              0,
              Math.min(1, (scrollY - from.y) / Math.max(1, to.y - from.y)),
            );
            meters = from.meters + fraction * (to.meters - from.meters);
            break;
          }
        if (shell.current) {
          shell.current.style.left = `${meters / 20}%`;
          shell.current.dataset.meters = String(Math.round(meters));
        }
      });
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [reduced]);
  return (
    <div className="scroll-lane" aria-hidden="true">
      <div className="lane-track">
        {["START", "500m", "1000m", "1500m", "FINISH"].map((label, i) => (
          <span key={label} style={{ left: `${i * 25}%` }}>
            {label}
          </span>
        ))}
        <div
          ref={shell}
          className="progress-shell"
          style={reduced ? { left: 0 } : undefined}
        >
          <svg viewBox="-22 -10 44 20">
            <TinyShell />
          </svg>
        </div>
      </div>
    </div>
  );
}
