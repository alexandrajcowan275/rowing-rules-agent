"""Six live questions: report answer/refusal accuracy, not full factual accuracy."""

import hashlib
import json
import os
import sys
from datetime import datetime, timezone

from corpus import PDF_NAME, load_chunks

from openai import OpenAIError

from engine import ROOT, REFUSAL, build_graph, configured_client, initial_state

CASES = [
    ("In an on-water race, what penalty is assessed for a false start, and what happens after two warnings in the same race?", True),
    ("What is the minimum diameter of a boat's bowball?", True),
    ("Under the general coxswain rules, may a male coxswain compete in a women's event?", True),
    ("Who is responsible for a crew's steering, and when will the referee instruct it to alter course?", True),
    ("Who won the 2024 Olympic women's eight?", False),
    ("What is USC's rowing budget?", False),
]

# Verify the four answerable cases against the extracted source before live calls.
EVIDENCE = [
    ("Rule 2-308", 25, ["assessed a warning", "two warnings", "shall be excluded"]),
    ("Rule 3-105", 41, ["at least 4 centimeters in diameter"]),
    ("Rule 4-105", 52, ["A male Coxswain may compete in Events for women"]),
    ("Rule 2-402", 27, ["responsible for its own steering", "prevent Interference", "ensure safety", "fairness"]),
]


def verify_evidence():
    chunks = load_chunks(ROOT / "data" / PDF_NAME)
    for rule, page, phrases in EVIDENCE:
        text = " ".join(c["text"] for c in chunks if c["rule"] == rule and c["page"] == page)
        if not all(phrase in text for phrase in phrases):
            raise ValueError(f"Evaluation evidence no longer matches {rule}, page {page}; review the PDF edition.")



def main():
    try:
        verify_evidence()
        client = configured_client()
        graph = build_graph(client)
    except (ValueError, OpenAIError, OSError) as exc:
        print(f"Evaluation not run: {exc}", file=sys.stderr)
        return 1
    correct = 0
    records = []
    errors = 0
    with client:
        for question, should_answer in CASES:
            try:
                state = graph.invoke(initial_state(question))
                result = state["result"]
                answered = result.answer != REFUSAL
                passed = answered == should_answer
                correct += int(passed)
                print(f"{'PASS' if passed else 'FAIL'} | expected "
                      f"{'answer' if should_answer else 'refusal'} | got "
                      f"{'answer' if answered else 'refusal'} | {question}")
                records.append({"question": question, "expected": "answer" if should_answer else "refusal",
                                "actual": "answer" if answered else "refusal", "passed": passed,
                                "result": result.model_dump(), "path": state["path"],
                                "refusal_reason": state["refusal_reason"]})
                print(f"  {result.answer}")
                for citation in result.citations:
                    print(f'  {citation.rule}, page {citation.page}: "{citation.quote}"')
                print("  Path: " + " -> ".join(state["path"]))
            except (ValueError, OpenAIError, OSError) as exc:
                errors += 1
                records.append({"question": question, "passed": False, "error": type(exc).__name__})
                print(f"ERROR | {question} | {exc}")
    report = {"completed_at": datetime.now(timezone.utc).isoformat(),
              "model": os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
              "embedding_model": os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
              "pdf_sha256": hashlib.sha256((ROOT / "data" / PDF_NAME).read_bytes()).hexdigest(),
              "correct": correct, "total": len(CASES), "errors": errors, "cases": records}
    (ROOT / "eval_results.json").write_text(json.dumps(report, indent=2) + "\n")
    print(f"{correct}/{len(CASES)} correct")
    print("Metric: answer/refusal classification; review printed answers and citations for factual accuracy.")
    if errors:
        print(f"{errors} API/runtime error(s); errors are not counted as refusals.")
    return 0 if correct == len(CASES) else 1


if __name__ == "__main__":
    sys.exit(main())
