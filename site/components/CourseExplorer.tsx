"use client";
import { useEffect, useRef, useState } from "react";
import type { RecordedCase } from "@/lib/records";
import CourseMap from "./CourseMap";
import useReducedMotion from "./useReducedMotion";
const labels = [
  "False starts",
  "Bowball size",
  "Coxswain eligibility",
  "Steering",
  "Olympic results",
  "USC budget",
];
export default function CourseExplorer({ cases }: { cases: RecordedCase[] }) {
  const [selected, setSelected] = useState(4);
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const reduced = useReducedMotion();
  function stop() {
    if (timer.current) clearInterval(timer.current);
    setPlaying(false);
  }
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );
  function play() {
    stop();
    if (reduced) {
      setStep(cases[selected].path.length - 1);
      return;
    }
    setStep(0);
    setPlaying(true);
    let i = 0;
    timer.current = setInterval(() => {
      i++;
      if (i >= cases[selected].path.length) {
        stop();
        return;
      }
      setStep(i);
    }, 850);
  }
  return (
    <div className="course-explorer">
      <div className="explorer-controls">
        <label>
          <span className="mono">REPLAY A REAL ROUTE</span>
          <select
            value={selected}
            onChange={(e) => {
              stop();
              setSelected(Number(e.target.value));
              setStep(-1);
            }}
          >
            {cases.map((c, i) => (
              <option key={c.question} value={i}>
                {labels[i]}
              </option>
            ))}
          </select>
        </label>
        <button
          className="race-button"
          onClick={() => (playing ? stop() : play())}
        >
          {playing ? "Pause route" : "Launch the shell"}{" "}
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className="explorer-question">{cases[selected].question}</p>
      <CourseMap interactive path={cases[selected].path} step={step} />
      <p className="explorer-outcome">
        <span className="mono">RECORDED OUTCOME</span>
        {cases[selected].actual === "refusal" ? "Refused" : "Answered"}
        {!cases[selected].passed
          ? " · False refusal, counted as a failure."
          : ""}
      </p>
    </div>
  );
}
