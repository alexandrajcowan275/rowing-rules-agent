"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { RecordedCase } from "@/lib/records";
import CourseMap from "./CourseMap";
import useReducedMotion from "./useReducedMotion";
type Message = { id: number; index: number; complete: boolean };
function RefusalFlag() {
  return (
    <svg className="refusal-flag" viewBox="0 0 100 92" aria-hidden="true">
      <path d="M25 75V12" stroke="currentColor" strokeWidth="2" />
      <path d="M26 13Q43 6 56 13T87 13V45Q69 51 56 45T26 45Z" fill="#e5e2d8" />
      <path d="M56 13Q69 19 87 13V45Q69 51 56 45Z" fill="#ad4d3c" />
      <path
        d="M6 79q13-5 26 0t26 0t26 0"
        stroke="currentColor"
        fill="none"
        strokeWidth="1"
      />
    </svg>
  );
}
export function RecordedAnswer({ record }: { record: RecordedCase }) {
  return (
    <div
      className={`recorded-answer ${record.actual === "refusal" ? "is-refusal" : ""}`}
    >
      <div className="answer-kicker">
        <span className="mono">
          {record.actual === "refusal"
            ? "EVIDENCE GATE / STOP"
            : "RULEBOOK / ANSWER"}
        </span>
        <span className={`confidence ${record.result.confidence}`}>
          {record.result.confidence} confidence
        </span>
      </div>
      {record.actual === "refusal" && <RefusalFlag />}
      <p className="answer-text">{record.result.answer}</p>
      {record.result.citations.map((c, i) => (
        <figure className="paper-citation" key={i}>
          <figcaption>
            <span>{c.rule}</span>
            <span>page {c.page}</span>
          </figcaption>
          <blockquote>
            <mark>{c.quote}</mark>
          </blockquote>
          <div className="paper-footer">
            USROWING RULES OF ROWING / EXACT CAPTURED QUOTE
          </div>
        </figure>
      ))}
      {record.refusal_reason && (
        <p className="refusal-reason">
          <span className="mono">RECORDED REASON</span>
          {record.refusal_reason}
        </p>
      )}
      {!record.passed && (
        <div className="honest-miss">
          <span className="mono">THE FALSE REFUSAL</span>
          <p>
            The agent chose not to answer because it couldn’t verify its quote.
            The rulebook does contain an answer. This counts as a failed
            evaluation case.
          </p>
        </div>
      )}
    </div>
  );
}
export default function ChatExperience({ cases }: { cases: RecordedCase[] }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [step, setStep] = useState(-1);
  const [phase, setPhase] = useState<"idle" | "typing" | "running">("idle");
  const [hint, setHint] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequence = useRef(0);
  const thread = useRef<HTMLDivElement>(null);
  const inputEl = useRef<HTMLTextAreaElement>(null);
  const reduced = useReducedMotion();
  const busy = phase !== "idle";
  function cancel() {
    if (timer.current) clearTimeout(timer.current);
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (!thread.current || !messages.length || phase === "typing") return;
    const latest = thread.current.lastElementChild;
    const target = latest?.querySelector<HTMLElement>(
      phase === "running" ? ".turn-course" : ".recorded-answer",
    );
    if (!target) return;
    const mobile = matchMedia("(max-width: 780px)").matches;
    const behavior = reduced ? "instant" : "smooth";
    // Reply is below the visualization in both layouts; move forward to its beginning.
    if (mobile) target.scrollIntoView({ block: "start", behavior });
    else
      thread.current.scrollTo({
        top:
          thread.current.scrollTop +
          target.getBoundingClientRect().top -
          thread.current.getBoundingClientRect().top -
          20,
        behavior,
      });
  }, [messages, phase, reduced]);
  function finish(id: number, index: number) {
    cancel();
    setStep(cases[index].path.length - 1);
    setMessages((m) =>
      m.map((x) => (x.id === id ? { ...x, complete: true } : x)),
    );
    setPhase("idle");
  }
  function send(index: number, instant = false) {
    cancel();
    setInput("");
    setSelected(index);
    setHint(false);
    const id = ++sequence.current;
    setMessages((m) => [...m, { id, index, complete: instant || reduced }]);
    setStep(instant || reduced ? cases[index].path.length - 1 : 0);
    if (instant || reduced) {
      setPhase("idle");
      return;
    }
    setPhase("running");
    let cursor = 0;
    function next() {
      cursor++;
      if (cursor < cases[index].path.length) {
        setStep(cursor);
        timer.current = setTimeout(next, 850);
      } else finish(id, index);
    }
    timer.current = setTimeout(next, 850);
  }
  function choose(index: number) {
    cancel();
    setHint(false);
    setSelected(index);
    setStep(-1);
    if (reduced) {
      send(index, true);
      return;
    }
    setPhase("typing");
    setInput("");
    let cursor = 0;
    function type() {
      cursor = Math.min(cursor + 4, cases[index].question.length);
      setInput(cases[index].question.slice(0, cursor));
      if (cursor < cases[index].question.length)
        timer.current = setTimeout(type, 18);
      else timer.current = setTimeout(() => send(index), 220);
    }
    type();
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const normalized = input.trim().replace(/\s+/g, " ").toLowerCase();
    const i = cases.findIndex((c) => c.question.toLowerCase() === normalized);
    if (i >= 0) send(i);
    else setHint(true);
  }
  function skip() {
    if (selected === null) return;
    if (phase === "typing") send(selected, true);
    else finish(sequence.current, selected);
  }
  function reset() {
    cancel();
    setMessages([]);
    setSelected(null);
    setStep(-1);
    setPhase("idle");
    setInput("");
    setHint(false);
    inputEl.current?.focus();
  }
  return (
    <main id="main" className="chat-app">
      {messages.length > 0 && (
        <h1 className="sr-only">Ask the Agent — recorded conversation</h1>
      )}
      <section className="chat-panel" aria-label="Recorded agent conversation">
        <div className="chat-panel-top">
          <span className="mono">
            <span className="status-dot" />
            RECORDED SESSION / SIX QUESTIONS
          </span>
          {messages.length > 0 && (
            <button onClick={reset} className="text-button">
              Clear thread
            </button>
          )}
        </div>
        <div
          className="message-thread"
          ref={thread}
          tabIndex={0}
          role="log"
          aria-label="Conversation messages"
        >
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <p className="eyebrow">
                A RULEBOOK. AN EVIDENCE GATE. NO GUESSWORK.
              </p>
              <h1>
                Ask the
                <br />
                <em>rulebook.</em>
              </h1>
              <p>
                At a regatta, the right answer matters.
                <br />
                See an agent find the rule, verify the quote,
                <br className="desktop-break" /> and know when to stop.
              </p>
              <div className="welcome-note">
                <span className="small-flag" aria-hidden="true" />
                <span>
                  Try{" "}
                  <button
                    className="olympic-replay"
                    disabled={busy}
                    onClick={() =>
                      choose(
                        cases.findIndex(
                          (c) =>
                            c.question ===
                            "Who won the 2024 Olympic women's eight?",
                        ),
                      )
                    }
                  >
                    Olympic results
                  </button>{" "}
                  to watch three retries turn into a refusal.
                </span>
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <article className="chat-turn" key={m.id}>
                <div className="user-message">
                  <span className="mono">YOU / RECORDED QUESTION</span>
                  <p>{cases[m.index].question}</p>
                </div>
                <div className="turn-course">
                  {m.id === messages.at(-1)?.id ? (
                    <CourseMap
                      path={cases[m.index].path}
                      step={m.complete ? cases[m.index].path.length - 1 : step}
                      animate={!m.complete}
                    />
                  ) : (
                    <details>
                      <summary>View recorded course</summary>
                      <CourseMap
                        path={cases[m.index].path}
                        step={cases[m.index].path.length - 1}
                        animate={false}
                      />
                    </details>
                  )}
                </div>
                {m.complete ? (
                  <RecordedAnswer record={cases[m.index]} />
                ) : (
                  <div className="thinking-message" role="status">
                    <span className="mono">FOLLOWING THE EVIDENCE COURSE</span>
                    <p>
                      {phase === "running" &&
                      cases[m.index].path[step] === "rewrite_query"
                        ? "No relevant evidence. Turning back for another search."
                        : "Replaying the agent’s evidence checks…"}
                    </p>
                    <button onClick={skip} className="text-button">
                      Skip to recorded result →
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
        <div className={`composer ${busy ? "is-running" : ""}`}>
          <div className="dock-suggestions" hidden={busy}>
            <div className="suggestion-heading">
              <span className="mono">CHOOSE A RECORDED QUESTION</span>
              <span className="mono">01—06</span>
            </div>
            <div
              className={`suggestions ${hint ? "is-highlighted" : ""}`}
              role="group"
              aria-label="Recorded question suggestions"
            >
              {cases.map((c, i) => (
                <button
                  key={c.question}
                  title={c.question}
                  disabled={busy}
                  onClick={() => choose(i)}
                >
                  <span className="chip-number">0{i + 1}</span>
                  <span>{c.question}</span>
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <p className={`custom-hint ${hint ? "visible" : ""}`} role="status">
              {hint
                ? "This demo replays recorded answers. Try one of these:"
                : "Replaying real recorded outputs from the agent."}
            </p>
          </div>
          <form onSubmit={submit} className="input-bar">
            <label className="sr-only" htmlFor="question">
              Your rules question
            </label>
            <textarea
              id="question"
              ref={inputEl}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setHint(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              maxLength={500}
              disabled={busy}
              placeholder="Ask a recorded rules question…"
            />
            <button
              type="submit"
              aria-label="Send question"
              disabled={busy || !input.trim()}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 19V5m-6 6 6-6 6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          </form>
          <p className="composer-foot" hidden={busy}>
            STATIC DEMO · NO LIVE AI · NO DATA SENT
          </p>
        </div>
      </section>
      <aside
        className={`chat-course ${messages.length ? "has-conversation" : ""}`}
        aria-label="About the evidence course"
      >
        <div className="course-intro">
          <span className="eyebrow">EVERY ANSWER HAS A COURSE</span>
          <h2>
            Evidence
            <br />
            sets the <em>direction.</em>
          </h2>
          <p>
            Follow the shell. Each turn is a real step from the recorded run.
          </p>
        </div>
        {selected === null ? (
          <CourseMap />
        ) : (
          <div className="course-guide">
            <span className="mono">FOLLOW THE CONVERSATION</span>
            <p>
              Follow the source from the first search to a verified answer—or a refusal.
            </p>
            <ol>
              <li>Find relevant rulebook text.</li>
              <li>Check the quote and its source.</li>
              <li>Answer with evidence—or refuse.</li>
            </ol>
          </div>
        )}
        <div className="course-status" aria-live="polite">
          <span className="mono">
            {phase === "typing"
              ? "AT THE START"
              : phase === "running"
                ? "ON THE COURSE"
                : selected === null
                  ? "AWAITING A QUESTION"
                  : "AT THE FINISH"}
          </span>
          <p>
            {phase === "running"
              ? cases[selected!].path[step]?.replaceAll("_", " ")
              : selected === null
                ? "A good answer starts with a source."
                : phase === "typing"
                  ? "Preparing the recorded question."
                  : cases[selected].actual === "refusal"
                    ? "The evidence gate held."
                    : "Answer and source, together."}
          </p>
          {busy && (
            <button className="text-button" onClick={skip}>
              Skip playback →
            </button>
          )}
        </div>
        <a className="course-story-link" href="/how-it-works/">
          Meet the builder. Explore the system. <span>↗</span>
        </a>
      </aside>
    </main>
  );
}
