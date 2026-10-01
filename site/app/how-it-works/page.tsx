import type { Metadata } from "next";
import { existsSync } from "node:fs";
import path from "node:path";
import RaceScene from "@/components/RaceScene";
import ScrollLane from "@/components/ScrollLane";
import CourseExplorer from "@/components/CourseExplorer";
import RowingPhoto from "@/components/RowingPhoto";
import report from "@/data/eval_results.json";
import project from "@/data/project.json";
import diagnosis from "@/data/diagnosis.json";
import { cases, github, linkedin } from "@/lib/records";
export const metadata: Metadata = {
  title: "The course behind the answer — Rowing Rules Agent",
};
function Marker({
  distance,
  children,
}: {
  distance: string;
  children: React.ReactNode;
}) {
  return (
    <p className="section-marker">
      <span>{distance}</span>
      {children}
    </p>
  );
}
export default function HowItWorks() {
  const fixed = cases[0].result.citations[0];
  const hasPhoto = (file: string) =>
    existsSync(path.join(process.cwd(), "public/photos", file));
  return (
    <>
      <ScrollLane />
      <main id="main" className="story">
        <section className="story-hero">
          <div className="story-hero-copy">
            <p className="eyebrow">A 2,000-METER LOOK INSIDE THE BUILD</p>
            <h1>
              Every answer
              <br />
              has to <em>earn its place.</em>
            </h1>
            <div>
              <p>
                A rowing rules agent that checks its evidence,
                <br />
                retraces its steps, and refuses instead of guessing.
              </p>
              <a
                href="#problem"
                className="round-link"
                aria-label="Start the course"
              >
                ↓
              </a>
            </div>
          </div>
          <RaceScene />
          <div className="hero-bottom mono">
            <span>PYTHON / LANGGRAPH / EVIDENCE-GATED Q&A</span>
            <span>START → FINISH</span>
          </div>
        </section>
        <section className="story-section problem-section" id="problem">
          <Marker distance="250m">THE PROBLEM</Marker>
          <div className="editorial-grid">
            <h2>
              On the water,
              <br />
              “probably”
              <br />
              <em>isn’t enough.</em>
            </h2>
            <div className="editorial-copy">
              <p className="lead">
                Rules questions come up constantly at regattas. A wrong answer
                can mean a penalty or disqualification.
              </p>
              <p>
                A confident chatbot response isn’t evidence. This agent searches
                the official USRowing rulebook, cites the exact rule and page,
                and checks whether the source supports its answer.
              </p>
              <div className="margin-note">
                <span className="mono">THE DESIGN DECISION</span>
                <p>An unsupported answer should stop at the evidence gate.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="story-section biography-section" id="builder">
          <Marker distance="500m">WHY I BUILT THIS</Marker>
          <div className="builder-grid">
            <div className="photo-pair">
              <RowingPhoto
                file="henley-crew.webp"
                alt="A sweep eight racing past spectators at Henley Royal Regatta"
                orientation="landscape"
                available={hasPhoto("henley-crew.webp")}
              />
              <RowingPhoto
                file="rowing-portrait.webp"
                alt="Close-up of a rower pulling an oar through the water"
                orientation="portrait"
                available={hasPhoto("rowing-portrait.webp")}
              />
            </div>
            <div className="builder-copy">
              <span className="eyebrow">ALEX COWAN / BUILDER & ROWER</span>
              <h2>
                From the boat
                <br />
                <em>to the build.</em>
              </h2>
              <p>{project.biography}</p>
              <a href={linkedin} className="line-link">
                More about Alex <span>↗</span>
              </a>
            </div>
          </div>
        </section>
        <section className="workflow-section" id="workflow">
          <div className="story-section">
            <Marker distance="1000m">HOW IT WORKS</Marker>
            <div className="section-intro">
              <h2>
                A clear course.
                <br />
                <em>Room to turn back.</em>
              </h2>
              <p>
                Follow a recorded question around the course. Click any marker
                to understand the evidence check behind it.
              </p>
            </div>
            <CourseExplorer cases={cases} />
            <div className="technical-strip">
              <div>
                <b>{project.chunks}</b>
                <span>chunks across {project.rules} rules</span>
              </div>
              <div>
                <b>3</b>
                <span>query rewrites at most</span>
              </div>
              <div>
                <b>1</b>
                <span>unchanged original question</span>
              </div>
            </div>
            <div className="system-notes">
              <div>
                <h3>Check the evidence.</h3>
                <p>
                  Retrieved text is graded for relevance before generation. A
                  separate support check examines whether the evidence supports
                  the complete answer.
                </p>
              </div>
              <div>
                <h3>Keep the source attached.</h3>
                <p>
                  Each quote must match one chunk after formatting
                  normalization, with exactly matching rule and page metadata.
                </p>
              </div>
            </div>
            <details className="engine-details">
              <summary>
                Open the technical logbook <span>+</span>
              </summary>
              <div>
                <p>
                  The numbered Rules of Racing are extracted with pypdf. Long
                  sections become up to 800-character chunks with approximately
                  120-character overlap at word boundaries. Page boundaries
                  remain intact.
                </p>
                <p>
                  Document embeddings are cached and reused until the source,
                  extraction, or model changes. Search uses in-memory cosine
                  similarity. Pydantic defines typed Answer and Citation models.
                  API errors remain distinct from evidence refusals.
                </p>
                <p className="mono">
                  PYTHON · LANGGRAPH · PYDANTIC · PYPDF
                  <br />
                  {report.model} · {report.embedding_model}
                </p>
                <a href={`${github}/blob/main/engine.py`} className="line-link">
                  Read engine.py ↗
                </a>
              </div>
            </details>
          </div>
        </section>
        <section className="story-section fix-section" id="citation-fix">
          <Marker distance="1500m">THE CITATION FIX</Marker>
          <div className="section-intro">
            <h2>
              A near match
              <br />
              <em>wasn’t a match.</em>
            </h2>
            <p>
              The right rule was retrieved. The generated quote still failed.
              Here’s a real punctuation difference from the diagnosis.
            </p>
          </div>
          <div className="paper-diff">
            <article>
              <div className="diff-label mono">
                <span>BEFORE / REPRODUCED FAILURE</span>
                <span>−</span>
              </div>
              <h3>
                {fixed.rule} <span>page {fixed.page}</span>
              </h3>
              <blockquote>
                {diagnosis.rejectedExcerpt.split(/(\u0019)/).map((part, i) =>
                  part === "\u0019" ? (
                    <del key={i} title="Invalid control character U+0019">
                      {"\\u0019"}
                    </del>
                  ) : (
                    <span key={i}>{part}</span>
                  ),
                )}
              </blockquote>
              <p>
                Excerpt from a rejected quote. Control characters are shown
                escaped so the corruption is visible.
              </p>
            </article>
            <article>
              <div className="diff-label mono">
                <span>AFTER / CAPTURED VALID QUOTE</span>
                <span>+</span>
              </div>
              <h3>
                {fixed.rule} <span>page {fixed.page}</span>
              </h3>
              <blockquote>
                {fixed.quote
                  .split(/(")/)
                  .map((part, i) =>
                    part === '"' ? (
                      <ins key={i}>{part}</ins>
                    ) : (
                      <span key={i}>{part}</span>
                    ),
                  )}
              </blockquote>
              <p>
                A shorter, contiguous copied span from the latest evaluation.
                This is the quote the agent actually returned.
              </p>
            </article>
          </div>
          <div className="fix-explanation">
            <p>
              <strong>The full diagnosis went beyond punctuation.</strong>{" "}
              Quotes omitted intervening passages and reconstructed a prefix
              missing from a clipped chunk. Those are content changes;
              normalization must not make them pass.
            </p>
            <p>
              <strong>The fix preserved strictness.</strong> Send literal
              Unicode, request copied spans, and align overlap to word
              boundaries. Normalize source and quote identically for whitespace,
              line-break hyphens, typographic quotes, and dashes. Keep exact
              rule/page checks. Never repair omitted text or arbitrary control
              characters.
            </p>
          </div>
          <p className="fine-print">
            The diagnosis is a fresh reproduction: the original evaluation did
            not retain rejected drafts. The before and after excerpts are not
            from the same run.
          </p>
          <a
            className="line-link"
            href={`${github}/blob/main/docs/citation-diagnosis.md`}
          >
            Read the quote-by-quote diagnosis ↗
          </a>
        </section>
        <section className="story-section limits-section" id="limitations">
          <Marker distance="1750m">KNOW THE BOUNDARIES</Marker>
          <div className="editorial-grid">
            <h2>
              Built to be useful.
              <br />
              <em>Not infallible.</em>
            </h2>
            <ol className="limits-list">
              <li>
                <span>01</span>
                <div>
                  <h3>A snapshot, not a live rulebook.</h3>
                  <p>
                    The local 2026 edition has no automatic freshness check.
                    Only numbered Rules of Racing are indexed; accompanying
                    manuals are excluded.
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h3>Context can fall outside the lane.</h3>
                  <p>
                    Top-four retrieval, chunk size, and page boundaries can miss
                    exceptions. Exact quotes verify text and location, not the
                    meaning of every claim. The LLM support check can also be
                    wrong.
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h3>Refusal doesn’t mean no answer exists.</h3>
                  <p>
                    Strict gates can reject answerable questions. Confidence
                    labels are qualitative, not calibrated probabilities. Six
                    questions don’t establish broad reliability.
                  </p>
                </div>
              </li>
            </ol>
          </div>
          <p className="official-note">
            This is a research aid, not an official USRowing interpretation.
            Event-specific exceptions and referee decisions may require more
            context. Consult{" "}
            <a href="https://usrowing.org/resources/rules-of-rowing">
              USRowing’s official Rules of Rowing ↗
            </a>
            .
          </p>
        </section>
        <section className="finish-section" id="results">
          <div className="story-section">
            <Marker distance="FINISH">RESULTS, TOLD HONESTLY</Marker>
            <div className="section-intro">
              <h2>
                Every split.
                <br />
                <em>Including the slow one.</em>
              </h2>
              <p>
                The fix helped. The unchanged repeat didn’t reproduce a perfect
                score. Both results belong on the board.
              </p>
            </div>
            <div className="regatta-board">
              <div className="board-title mono">
                <span>ROWING RULES AGENT / EVALUATION RECORD</span>
                <span>NOT A RELIABILITY BENCHMARK</span>
              </div>
              <div className="split-sheet">
                <div>
                  <span className="mono">SPLIT 01 / INITIAL</span>
                  <strong>
                    4<small>/6</small>
                  </strong>
                  <p>Before the citation fix</p>
                </div>
                <div>
                  <span className="mono">SPLIT 02 / POST-FIX</span>
                  <strong>
                    6<small>/6</small>
                  </strong>
                  <p>First post-fix run</p>
                </div>
                <div>
                  <span className="mono">FINISH / REPEAT</span>
                  <strong>
                    {report.correct}
                    <small>/{report.total}</small>
                  </strong>
                  <p>Unchanged code and questions</p>
                </div>
              </div>
              <div
                className="results-table-wrap"
                tabIndex={0}
                role="region"
                aria-label="Evaluation results, horizontally scrollable"
              >
                <table>
                  <caption>
                    Latest recorded run:{" "}
                    {new Date(report.completed_at).toLocaleString("en-GB", {
                      timeZone: "UTC",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    UTC · {report.errors} API errors
                  </caption>
                  <thead>
                    <tr>
                      <th>LANE</th>
                      <th>QUESTION</th>
                      <th>EXPECTED</th>
                      <th>OBSERVED</th>
                      <th>RESULT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.cases.map((c, i) => (
                      <tr
                        key={c.question}
                        className={!c.passed ? "miss-row" : ""}
                      >
                        <td>0{i + 1}</td>
                        <th scope="row">{c.question}</th>
                        <td>{c.expected}</td>
                        <td>{c.actual}</td>
                        <td>{c.passed ? "PASS" : "FAIL"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="finish-notes">
              <div className="false-refusal-note">
                <span className="mono">LANE 03 / THE COXSWAIN QUESTION</span>
                <h3>
                  The agent chose not to answer
                  <br />
                  because it couldn’t verify its quote.
                </h3>
                <p>
                  The rulebook contains the answer. The recorded reason was
                  “Missing or invalid source citations.” This false refusal
                  counts as a failure, not a success. It shows the tradeoff of
                  strict evidence gates.
                </p>
                <a className="line-link" href="/">
                  Replay it in the demo ↗
                </a>
              </div>
              <div className="test-strokes">
                <div>
                  <strong>
                    {project.testsPassed}
                    <small>/{project.testsTotal}</small>
                  </strong>
                  <span className="mono">OFFLINE TESTS PASSED</span>
                </div>
                <div
                  className="stroke-grid"
                  role="img"
                  aria-label={`${project.testsPassed} of ${project.testsTotal} offline tests passed, shown as completed strokes`}
                >
                  {Array.from({ length: project.testsTotal }, (_, i) => (
                    <span key={i} aria-hidden="true">
                      <svg viewBox="0 0 30 50">
                        <path
                          d="M9 7L24 42"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path d="M4 2l8-2 6 15-9 4Z" fill="currentColor" />
                      </svg>
                      <small>{String(i + 1).padStart(2, "0")}</small>
                    </span>
                  ))}
                </div>
                <p>
                  Extraction, caching, retrieval, retries, and validation. The
                  eval score measures answer/refusal classification, not
                  comprehensive factual accuracy.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div>
          <span className="eyebrow">BUILT BY ALEX COWAN</span>
          <a href="/" className="footer-cta">
            Back to the starting line <span>↗</span>
          </a>
        </div>
        <nav aria-label="Footer links">
          <a href={github}>GitHub ↗</a>
          <a href={linkedin}>LinkedIn ↗</a>
          <a href="https://usrowing.org/resources/rules-of-rowing">
            Official rulebook ↗
          </a>
        </nav>
      </footer>
    </>
  );
}
