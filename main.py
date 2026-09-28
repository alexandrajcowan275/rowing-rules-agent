import argparse
import sys

from openai import OpenAIError

from engine import build_graph, configured_client, initial_state


def main():
    parser = argparse.ArgumentParser(description="Ask a question using the official USRowing rulebook.")
    parser.add_argument("question", help="Question in quotation marks")
    args = parser.parse_args()
    try:
        state = initial_state(args.question)
        with configured_client() as client:
            state = build_graph(client).invoke(state)
    except (ValueError, OpenAIError, OSError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    result = state["result"]
    print(f"Answer: {result.answer}\nConfidence: {result.confidence}\nCitations:")
    for citation in result.citations:
        print(f'  - {citation.rule}, page {citation.page}: "{citation.quote}"')
    if not result.citations:
        print("  (none)")
    print("Path: " + " -> ".join(state["path"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
