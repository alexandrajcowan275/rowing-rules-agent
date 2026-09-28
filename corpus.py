"""Extract numbered rules and cache their embeddings outside version control."""

import hashlib
import json
import re
from pathlib import Path
from typing import TypedDict

import pypdf
from pypdf import PdfReader

PDF_NAME = "usrowing-rules.pdf"
CHUNK_SIZE = 800
OVERLAP = 120
# Match headings, including subrules such as 4-105.1, but not prose references.
HEADING = re.compile(r"^(?:Rule\s+)?(\d{1,2}-\d{3}(?:\.\d+)?)[ \t]+(?![ \t(])\S", re.MULTILINE)


class Chunk(TypedDict):
    rule: str
    page: int
    text: str


def split_pages(pages: list[str]) -> list[Chunk]:
    chunks = []
    current_rule = None
    started = False
    for page_number, raw in enumerate(pages, 1):
        # The PDF also contains manuals. Stop at their title, not at a prose reference.
        if started and re.search(r"^Referee Procedures\s*\nManual", raw, re.MULTILINE):
            break
        lines = [line.strip() for line in raw.splitlines()]
        lines = [line for line in lines if not line.isdigit()]
        text = "\n".join(lines)
        if not started:
            # Skip the change summary and table of contents (dotted leader lines).
            if not re.search(r"^1-101\s+Title\s*$", text, re.MULTILINE):
                continue
            started = True
        matches = [m for m in HEADING.finditer(text)
                   if not re.search(r"\.{3,}", text[m.start():].split("\n", 1)[0])]
        boundaries = [(0, current_rule)] + [(m.start(), "Rule " + m.group(1)) for m in matches]
        for i, (start, rule) in enumerate(boundaries):
            end = boundaries[i+1][0] if i+1 < len(boundaries) else len(text)
            if rule is None:
                continue
            section = text[start:end]
            # Remove layout-only article/part headings without losing rule text.
            section = re.sub(r"^(?:ARTICLE [IVX]+|Part [A-Z])[^\n]*$", "", section, flags=re.MULTILINE)
            section = re.sub(r"(?<=\w)-\s*\n(?=\w)", "", section)
            section = " ".join(section.split())
            start = 0
            while start < len(section):
                end = min(start + CHUNK_SIZE, len(section))
                if end < len(section):
                    space = section.rfind(" ", start + CHUNK_SIZE // 2, end)
                    if space > start:
                        end = space
                chunks.append(Chunk(rule=rule, page=page_number, text=section[start:end]))
                if end == len(section):
                    break
                start = end - OVERLAP
        if matches:
            current_rule = "Rule " + matches[-1].group(1)
    if not chunks:
        raise ValueError("No numbered rules extracted. Use the text-based official Rules of Rowing PDF.")
    return chunks


def load_chunks(pdf_path: Path) -> list[Chunk]:
    if not pdf_path.is_file():
        raise ValueError(f"Download the official rulebook to {pdf_path}; see README.md.")
    reader = PdfReader(pdf_path)
    return split_pages([page.extract_text() or "" for page in reader.pages])


def cached_vectors(client, pdf_path: Path, chunks: list[Chunk], model: str,
                   cache_dir: Path) -> list[list[float]]:
    # Source, extraction, chunking, or model changes invalidate the persistent cache.
    identity = {"pdf_sha256": hashlib.sha256(pdf_path.read_bytes()).hexdigest(),
                "model": model, "pypdf": pypdf.__version__, "chunks": chunks}
    key = hashlib.sha256(json.dumps(identity, sort_keys=True).encode()).hexdigest()
    cache_file = cache_dir / f"{key}.json"
    if cache_file.exists():
        try:
            vectors = json.loads(cache_file.read_text())
            if (len(vectors) == len(chunks) and vectors and all(
                isinstance(v, list) and len(v) == len(vectors[0]) and len(v) > 0
                and all(isinstance(x, (int, float)) for x in v) for v in vectors
            )):
                return vectors
        except (ValueError, TypeError):
            pass  # A broken local cache is rebuilt from the PDF.
    vectors = []
    for offset in range(0, len(chunks), 64):
        batch = chunks[offset:offset+64]
        result = client.embeddings.create(model=model, input=[c["text"] for c in batch])
        vectors.extend(item.embedding for item in sorted(result.data, key=lambda item: item.index))
    cache_dir.mkdir(parents=True, exist_ok=True)
    temporary = cache_file.with_suffix(".tmp")
    temporary.write_text(json.dumps(vectors))
    temporary.replace(cache_file)
    return vectors
