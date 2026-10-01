import report from "@/data/eval_results.json";
export type RecordedCase = {
  question: string;
  actual: string;
  passed: boolean;
  path: string[];
  refusal_reason: string;
  result: {
    answer: string;
    confidence: string;
    citations: { rule: string; page: number; quote: string }[];
  };
};
// Only final captured responses cross the client boundary. Rejected drafts stay out.
export const cases: RecordedCase[] = report.cases.map(
  ({ question, actual, passed, path, refusal_reason, result }) => ({
    question,
    actual,
    passed,
    path,
    refusal_reason,
    result,
  }),
);
export const github =
  "https://github.com/alexandrajcowan275/rowing-rules-agent";
export const linkedin =
  "https://www.linkedin.com/in/alexandra-cowan-24705331b/";
export const topics = [
  "False starts",
  "Bowball size",
  "Coxswain eligibility",
  "Steering",
  "Olympic results",
  "USC budget",
];
