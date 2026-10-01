"use client";
import { useEffect, useId, useState } from "react";
import { TinyShell } from "./Shell";
import useReducedMotion from "./useReducedMotion";
const nodes = [
  {
    id: "retrieve",
    label: "Find evidence",
    x: 90,
    y: 60,
    simple:
      "Search the local rulebook for passages that may answer the question.",
    detail:
      "Embed the query and rank cached chunks by cosine similarity. Return the top four.",
  },
  {
    id: "grade_documents",
    label: "Check relevance",
    x: 300,
    y: 60,
    simple: "Keep only passages relevant to the original question.",
    detail:
      "The LLM grades each chunk relevant or not relevant, with a one-line reason.",
  },
  {
    id: "decide",
    label: "Choose a route",
    x: 510,
    y: 60,
    simple: "Use evidence, retry the search, or stop when retries run out.",
    detail:
      "A conditional edge: any relevant chunks → generate; none and attempts < 3 → rewrite_query; otherwise → refuse. This routing edge is not an executed node in the recorded path.",
  },
  {
    id: "rewrite_query",
    label: "Search again",
    x: 150,
    y: 235,
    simple: "Reword the search without changing the original question.",
    detail:
      "Increment attempts, then return to retrieve. The initial retrieval can be followed by up to three rewrites.",
  },
  {
    id: "generate",
    label: "Answer + verify",
    x: 375,
    y: 235,
    simple:
      "Write an answer, then verify the citations and supporting evidence.",
    detail:
      "Produce a typed Answer. Require contiguous normalized quotes and exact rule/page metadata, then an LLM support check. Low confidence or failed validation routes to refuse.",
  },
  {
    id: "refuse",
    label: "Stop safely",
    x: 510,
    y: 390,
    simple: "Decline to answer when the evidence gates are not satisfied.",
    detail:
      "Return the fixed refusal, empty citations, and low confidence. API failures remain errors instead of evidence refusals.",
  },
];
const edges = {
  retrieveGrade: "M90 60H300",
  gradeDecide: "M300 60H510",
  decideRewrite: "M510 60C440 135 220 120 150 235",
  rewriteRetrieve: "M150 235H75Q30 235 30 190V100Q30 60 90 60",
  decideGenerate: "M510 60V125Q510 155 480 155H405Q375 155 375 190V235",
  decideRefuse: "M510 60H565Q590 60 590 85V365Q590 390 510 390",
  generateRefuse: "M375 235V335Q375 390 425 390H510",
};
const routes: Record<string, string> = {
  "retrieve-grade_documents": edges.retrieveGrade,
  "grade_documents-generate":
    "M300 60H510V125Q510 155 480 155H405Q375 155 375 190V235",
  "grade_documents-rewrite_query": `M300 60H510 ${edges.decideRewrite.replace("M510 60", "")}`,
  "rewrite_query-retrieve": edges.rewriteRetrieve,
  "grade_documents-refuse": "M300 60H565Q590 60 590 85V365Q590 390 510 390",
  "generate-refuse": edges.generateRefuse,
};
export default function CourseMap({
  path = [],
  step = -1,
  interactive = false,
  animate = true,
}: {
  path?: string[];
  step?: number;
  interactive?: boolean;
  animate?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  const [arrived, setArrived] = useState(-1);
  const [selected, setSelected] = useState("decide");
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || !animate || step <= 0) {
      setArrived(step);
      return;
    }
    setArrived(step - 1);
    const timer = setTimeout(() => setArrived(step), 700);
    return () => clearTimeout(timer);
  }, [step, reduced, animate, path]);
  const visibleCount =
    reduced || !animate ? step + 1 : Math.min(step + 1, arrived + 1);
  const reachedPath = path.slice(0, Math.max(0, visibleCount));
  const current = path[Math.min(step, path.length - 1)];
  const node = nodes.find((n) => n.id === selected)!;
  const position = nodes.find((n) => n.id === current) ?? nodes[0];
  const route = step > 0 ? routes[`${path[step - 1]}-${current}`] : undefined;
  const rewrites = reachedPath.filter((n) => n === "rewrite_query").length;
  return (
    <div className={`course-map ${interactive ? "explorable" : ""}`}>
      <div className="map-heading">
        <span className="mono">THE EVIDENCE COURSE</span>
        <span className="mono map-count">
          {path.length ? (
            <>
              <b>{rewrites}</b>
              <span> / 3 REWRITES</span>
            </>
          ) : interactive ? (
            "SELECT A COURSE MARKER"
          ) : (
            "READY AT THE START"
          )}
        </span>
      </div>
      <div className="map-canvas">
        <svg viewBox="0 0 620 465" aria-hidden="true">
          <defs>
            <marker
              id={`${id}-arrow`}
              viewBox="0 0 7 7"
              markerWidth="7"
              markerHeight="7"
              refX="15"
              refY="3.5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0 0L7 3.5L0 7Z" fill="currentColor" />
            </marker>
            <pattern
              id={`${id}-dots`}
              width="22"
              height="22"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r=".6" fill="currentColor" opacity=".15" />
            </pattern>
          </defs>
          <rect width="620" height="465" fill={`url(#${id}-dots)`} />
          <g
            className="course-lines"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            {Object.entries(edges).map(([name, d]) => (
              <path key={name} d={d} markerEnd={`url(#${id}-arrow)`} />
            ))}
          </g>
          <g className="map-buoys">
            {nodes.map((n) => (
              <circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r="7"
                className={current === n.id ? "lit" : ""}
              />
            ))}
          </g>
          <text x="85" y="325" className="map-caption">
            NO EVIDENCE?
          </text>
          <text x="85" y="348" className="map-caption">
            CIRCLE BACK. SEARCH AGAIN.
          </text>
          <text x="425" y="140" className="map-caption">
            RELEVANT
          </text>
          <text
            x="565"
            y="310"
            className="map-caption"
            transform="rotate(90 565 310)"
          >
            RETRIES EXHAUSTED
          </text>
          <text x="390" y="325" className="map-caption">
            VALIDATION FAIL ↓
          </text>
          {route && !reduced && animate ? (
            <g key={`${step}-${current}`} className="course-boat">
              <animateMotion
                dur="0.7s"
                path={route}
                fill="freeze"
                rotate="auto"
              />
              <TinyShell />
            </g>
          ) : (
            <g
              className="course-boat"
              transform={`translate(${reduced ? 90 : position.x} ${reduced ? 60 : position.y})`}
            >
              <TinyShell />
            </g>
          )}
        </svg>
        {nodes.map((n) =>
          interactive ? (
            <button
              key={n.id}
              className={`course-marker ${n.y === 60 ? "top-marker" : ""} ${selected === n.id ? "selected" : ""} ${current === n.id ? "on-path" : ""}`}
              style={{
                left: `${(n.x / 620) * 100}%`,
                top: `${(n.y / 465) * 100}%`,
              }}
              onClick={() => setSelected(n.id)}
              aria-pressed={selected === n.id}
            >
              <code>{n.id}</code>
              <span>{n.label}</span>
            </button>
          ) : (
            <div
              key={n.id}
              className={`course-marker ${n.y === 60 ? "top-marker" : ""} ${current === n.id ? "on-path" : ""}`}
              style={{
                left: `${(n.x / 620) * 100}%`,
                top: `${(n.y / 465) * 100}%`,
              }}
            >
              <code>{n.id}</code>
              <span>{n.label}</span>
            </div>
          ),
        )}
      </div>
      {interactive && (
        <div className="marker-detail">
          <div>
            <span className="mono">COURSE MARKER / {node.id}</span>
            <h3>{node.label}</h3>
            <p>{node.simple}</p>
          </div>
          <details key={node.id}>
            <summary>Technical detail</summary>
            <p>{node.detail}</p>
          </details>
        </div>
      )}
      {reachedPath.length > 0 && (
        <ol className="path-ledger" aria-label="Recorded executed path">
          {reachedPath.map((n, i) => (
            <li
              className={i === reachedPath.length - 1 ? "current" : "passed"}
              key={i}
            >
              <span className="sr-only">Step {i + 1}: </span>
              {n}
              {i < reachedPath.length - 1 && <span aria-hidden="true"> →</span>}
            </li>
          ))}
        </ol>
      )}
      <p className="map-note">
        Course distances are a visual metaphor. The path is real; playback
        timing is illustrative.
      </p>
    </div>
  );
}
