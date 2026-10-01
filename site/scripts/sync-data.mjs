import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = new URL("../../", import.meta.url);
const target = new URL("../data/", import.meta.url);
const source = new URL("eval_results.json", root);
// Vercel can build site/ alone using the checked-in snapshot. Full checkouts refresh it.
if (existsSync(source)) {
  writeFileSync(new URL("eval_results.json", target), readFileSync(source));
  const readme = readFileSync(new URL("README.md", root), "utf8");
  const diagnosis = readFileSync(
    new URL("docs/citation-diagnosis.md", root),
    "utf8",
  );
  const rejected = diagnosis.match(
    /Model quote \(JSON-escaped\):\s*```json\s*([^\n]+)\s*```/,
  );
  if (!rejected)
    throw new Error(
      "Citation diagnosis format changed: review source mapping.",
    );
  const rejectedQuote = JSON.parse(rejected[1]);
  const excerpt = rejectedQuote
    .slice(
      rejectedQuote.indexOf("(b)"),
      rejectedQuote.indexOf(" (c) In the event"),
    )
    .trim();
  if (!excerpt.includes("\u0019"))
    throw new Error("Expected reproduced punctuation difference is missing.");
  writeFileSync(
    new URL("diagnosis.json", target),
    JSON.stringify({ rejectedExcerpt: excerpt }, null, 2) + "\n",
  );
  const biography = readme.match(/## Why I built this\s+([\s\S]*?)\n\n##/)?.[1];
  const counts = readme.match(/producing (\d+) chunks across (\d+) rules/);
  const tests = readme.match(/\*\*(\d+)\/(\d+) offline tests passed/);
  if (!biography || !counts || !tests)
    throw new Error("README facts changed: review showcase source mapping.");
  writeFileSync(
    new URL("project.json", target),
    JSON.stringify(
      {
        biography,
        chunks: Number(counts[1]),
        rules: Number(counts[2]),
        testsPassed: Number(tests[1]),
        testsTotal: Number(tests[2]),
      },
      null,
      2,
    ) + "\n",
  );
}
const report = JSON.parse(
  readFileSync(new URL("eval_results.json", target), "utf8"),
);
if (
  report.cases.length !== report.total ||
  report.cases.filter((c) => c.passed).length !== report.correct
)
  throw new Error("Evaluation score does not match captured cases.");
for (const item of report.cases) {
  if (!item.result || !item.path?.length)
    throw new Error(
      "A captured output is missing. Review eval_results.json before publishing.",
    );
}
console.log(
  `Static data: ${report.correct}/${report.total} from ${report.completed_at}; ${fileURLToPath(target)}`,
);
