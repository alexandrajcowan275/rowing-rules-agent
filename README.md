# Rowing Rules Agent: Evidence-Gated Q&A over the USRowing Rules of Rowing

A small Python agent that answers rowing rules questions from a local copy of the official USRowing rulebook. It checks retrieved evidence, retries unsuccessful searches, and refuses when it cannot support a complete answer. LangGraph controls the workflow; the OpenAI API provides embeddings and structured LLM responses.

## Why I built this

I rowed competitively for years, including as an NCAA Division I athlete at USC. Rules questions come up constantly at regattas, and a wrong answer can mean a penalty or disqualification. Previously I built a RAG research tool at a VC firm; this project adds an agentic layer that checks its own evidence, retries, and refuses instead of guessing.

## Graph

```mermaid
flowchart TD
    S([Start]) --> R[retrieve]
    R --> G[grade_documents]
    G --> D{decide}
    D -->|at least one relevant chunk| A[generate]
    D -->|none and attempts below 3| W[rewrite_query]
    W --> R
    D -->|none and attempts equals 3| F[refuse]
    A -->|validated answer| E([End])
    A -->|weak evidence or failed validation| F
    F --> E
```

## How it works

- **retrieve:** Rank local rule chunks by embedding similarity and return the top four.
- **grade_documents:** Keep only chunks the LLM grades relevant to the original question, with a one-line reason per chunk.
- **decide:** Generate if evidence exists, rewrite if none exists and retries remain, or refuse after three rewrites.
- **rewrite_query:** Improve search wording while preserving the original question and incrementing the retry count.
- **generate:** Produce a typed answer, validate exact quotes and rule/page metadata, then check that evidence supports the full answer.
- **refuse:** Return `Not enough evidence in the sources to answer.` with no citations and low confidence.

The typed state records the question, retrieval query, attempts, grades, relevant chunks, answer, refusal reason, and executed path. Attempts start at zero, allowing the initial retrieval plus three rewrites. Generation also refuses on low confidence, missing citations, fabricated quotes, or failed support checks. API errors remain errors rather than evidence refusals.

`Citation` contains `rule: str`, `page: int`, and `quote: str`. `Answer` contains `answer: str`, `citations: list[Citation]`, and `confidence: Literal["high", "medium", "low"]`.

## Source and chunking

Download the rulebook from [USRowing's official Rules of Rowing page](https://usrowing.org/resources/rules-of-rowing). This project was verified with the [2026 edition PDF](https://usrowing-craft-storage-production.nyc3.digitaloceanspaces.com/staging/2026ROR-Final-Web2.pdf). Save it as `data/usrowing-rules.pdf`. **The PDF is USRowing's document and is not committed; users must download it themselves.**

`pypdf` extracts text from the numbered Rules of Racing, producing 292 chunks across 160 rules from PDF pages 12–87. The table of contents, change summary, and accompanying manuals are excluded. Rule sections are kept together when possible and split at page boundaries so every citation identifies the actual page containing its quote. Long sections use up to 800 characters with approximately 120-character overlap aligned to word boundaries. Whitespace, line-break hyphenation, typographic quotes, and dashes are normalized by the same function on both the source and the generated quote. The normalized quote must remain a contiguous substring of one chunk with exactly matching rule/page metadata. Page numbers are one-based PDF positions.

Embeddings are stored in an ignored `.cache/` directory and reused across questions and program restarts. A cache key includes the PDF hash, embedding model, extracted chunks, and pypdf version. A changed PDF, extraction, or model triggers a new embedding pass; query embeddings are still created per retrieval. Search uses in-memory cosine similarity, with no external web search at runtime.

## Setup

Requires Python 3.11+ and an OpenAI API key.

```bash
cd rowing-rules-agent
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` to set `OPENAI_API_KEY`. If you already have a configured `.env`, keep it instead of copying the example over it. Defaults are `gpt-4.1-mini` and `text-embedding-3-small`; optional model settings are in `.env.example`. The key is loaded relative to the project, and existing environment variables take precedence.

```bash
mkdir -p data
curl -fL 'https://usrowing-craft-storage-production.nyc3.digitaloceanspaces.com/staging/2026ROR-Final-Web2.pdf' -o data/usrowing-rules.pdf
python main.py "What is the minimum diameter of a boat's bowball?"
python eval.py
python -m unittest -v
```

The API receives the query and retrieved rule text, and calls incur usage charges. `.env`, the PDF, the virtual environment, and the embedding cache are gitignored.

## Real outputs

Captured by `eval.py` in the live run recorded in [eval_results.json](eval_results.json).

### Answered example

Question: In an on-water race, what penalty is assessed for a false start, and what happens after two warnings in the same race?

```text
PASS | expected answer | got answer | In an on-water race, what penalty is assessed for a false start, and what happens after two warnings in the same race?
  In an on-water race, a Crew that commits a false start is assessed a warning. If the same Crew receives two warnings, including those for false starts, applicable to the same race, the Crew shall be excluded from that race under Rule 2-602(c).
  Rule 2-308, page 25: "(b) Crew(s) committing a false start will be assessed a warning. A Crew that receives two warnings, including false starts, applicable to the same Race shall be excluded under Rule 2-602(c) ("Types of Penalties")."
  Path: retrieve -> grade_documents -> generate
```

### Refusal example

Question: Who won the 2024 Olympic women's eight?

```text
PASS | expected refusal | got refusal | Who won the 2024 Olympic women's eight?
  Not enough evidence in the sources to answer.
  Path: retrieve -> grade_documents -> rewrite_query -> retrieve -> grade_documents -> rewrite_query -> retrieve -> grade_documents -> rewrite_query -> retrieve -> grade_documents -> refuse
```

## Evaluation results

**6/6 correct**, with 0 API errors. Completed 2026-09-28T07:52:28.786450+00:00 using `gpt-4.1-mini` and `text-embedding-3-small`.

| Question | Expected | Observed | Result |
| --- | --- | --- | --- |
| In an on-water race, what penalty is assessed for a false start, and what happens after two warnings in the same race? | answer | answer | PASS |
| What is the minimum diameter of a boat's bowball? | answer | answer | PASS |
| Under the general coxswain rules, may a male coxswain compete in a women's event? | answer | answer | PASS |
| Who is responsible for a crew's steering, and when will the referee instruct it to alter course? | answer | answer | PASS |
| Who won the 2024 Olympic women's eight? | refusal | refusal | PASS |
| What is USC's rowing budget? | refusal | refusal | PASS |

The same six questions previously scored 4/6 because generated citations for false starts and steering failed validation. After the citation handling fix, all four answerable questions returned validated citations and both unsupported questions refused after three rewrites. No question, expected outcome, or rule/page matching requirement was changed.

The four answerable questions are verified in extracted Rules 2-308 (page 25), 3-105 (page 41), 4-105 (page 52), and 2-402 (page 27) before live calls. `eval.py` checks these facts on startup. The two unsupported questions ask for Olympic results and a university budget, which the indexed rules do not provide.

The score measures answer/refusal classification, not comprehensive factual accuracy. The returned answers and citations were also reviewed against the source text. This is one live run of a small evaluation; model outputs can vary.

## Test results

**21/21 offline tests passed** with `python -m unittest -v`. Tests cover section boundaries, continuation pages, subrule numbers, contents/manual exclusion, wrapped rule references, overlap, layout normalization, embedding cache reuse/invalidation, top-four retrieval, query rewriting, retry limits, citation metadata, weak-answer refusal, API error propagation, symmetric normalization, strict rejection of altered facts and noncontiguous quotes, and word-aligned overlap. `python -m pip check` also passed.

Verified on Python 3.13.7 with LangGraph 1.2.12, OpenAI 2.54.0, Pydantic 2.13.5, python-dotenv 1.2.3, and pypdf 6.19.0. Offline tests use synthetic fixtures and need neither an API key nor the downloaded PDF.

## What I fixed

The two failures were reproduced before changing the code. The [diagnosis report](docs/citation-diagnosis.md) prints each model quote, the closest retrieved passage, and exact differences. The original run did not retain rejected drafts, so the report clearly labels these as fresh reproductions.

False-start citations omitted intervening sentences or paragraphs, so they were not contiguous quotations. In the steering answer, Rule 2-402 matched, but additional citations corrupted Unicode punctuation and reconstructed a prefix absent from a clipped chunk. The correct rules had been retrieved; formatting normalization alone would not repair these failures.

The API now receives literal Unicode rather than ASCII escape sequences. Generation is instructed to copy short necessary passages, use separate citations for separated passages, and never reconstruct clipped text. One normalization function handles whitespace, line-break hyphenation, quotes, and dashes on both sides of comparison. Overlapping chunks start at word boundaries. Wrong rule/page metadata, missing words, malformed control characters, and noncontiguous quotations still fail. Rejected drafts are now retained in evaluation output for future diagnosis. The graph, six evaluation questions, and expected outcomes are unchanged.

## Limitations

- This is a rulebook research aid, not an official USRowing interpretation. Event-specific exceptions and referee decisions may require additional context.
- Only the numbered Rules of Racing are indexed. The accompanying referee/organizer manuals and other documents are outside the searchable corpus.
- Top-four retrieval and 800-character chunks can omit relevant exceptions or context; page boundaries can split a rule.
- Exact quote checks verify text and location, not the meaning of every claim. The separate support check is also an LLM and can make mistakes.
- Strict evidence gates can reject answerable questions, as the previous 4/6 run demonstrated. A refusal does not mean the rulebook lacks an answer.
- Confidence is qualitative, not a calibrated probability. The six-question evaluation is small and does not establish broad reliability.
- The downloaded 2026 edition is a local snapshot. Check the official source for updates; there is no automatic freshness check. Extraction assumes the current numbered-rule layout and text-based PDF.

## Publish to GitHub

After installing the GitHub CLI, run these commands from the project directory. The first local commit already exists; this creates a public repository and pushes it.

```bash
gh auth login
gh repo create rowing-rules-agent --public --source=. --remote=origin --push
```
