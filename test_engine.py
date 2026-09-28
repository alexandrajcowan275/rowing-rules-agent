"""Offline graph tests with scripted API responses, not a live quality evaluation."""

import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

from engine import (Answer, Grade, REFUSAL, Rewrite, Support, build_graph,
                    initial_state)


class GraphTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.data = Path(self.folder.name)
        (self.data / "usrowing-rules.pdf").write_bytes(b"mock PDF for cache identity")
        chunks = [{"rule": f"Rule 1-{100+i}", "page": i+1,
                   "text": f"Test crew {i} must use lane {i+1}."} for i in range(6)]
        patcher = patch("engine.load_chunks", return_value=chunks)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.cache = self.data / "cache"
        self.client = Mock()
        self.embedding_batches = []

        def embeddings(*, model, input):
            self.embedding_batches.append(input)
            # A query matches document 0 most closely; each next document scores lower.
            vectors = [[1.0, float(i)] for i in range(len(input))]
            return SimpleNamespace(data=[SimpleNamespace(index=i, embedding=v)
                                         for i, v in reversed(list(enumerate(vectors)))])

        self.client.embeddings.create.side_effect = embeddings

    def scripted(self, relevant=True, confidence="high", quote="Test crew 0 must use lane 1.",
                 supported=True, rule="Rule 1-100", page=1, missing_answer=False, no_citations=False):
        def parse(*, model, input, text_format):
            if text_format is Grade:
                value = Grade(relevant=relevant, reason="Direct evidence." if relevant else "Missing fact.")
            elif text_format is Rewrite:
                value = Rewrite(query="Test crew lane assignment")
            elif text_format is Support:
                value = Support(supported=supported, reason="Evidence checked.")
            else:
                value = None if missing_answer else Answer(
                    answer="Test crew 0 must use lane 1.", confidence=confidence,
                    citations=[] if no_citations else [{"rule": rule, "page": page, "quote": quote}])
            return SimpleNamespace(output_parsed=value)
        self.client.responses.parse.side_effect = parse

    def run_graph(self):
        return build_graph(self.client, self.data, self.cache).invoke(initial_state("What lane must test crew 0 use?"))

    def test_direct_answer_and_top_four(self):
        self.scripted()
        state = self.run_graph()
        self.assertEqual(state["path"], ["retrieve", "grade_documents", "generate"])
        self.assertEqual([c["rule"] for c in state["chunks"]], ["Rule 1-100", "Rule 1-101", "Rule 1-102", "Rule 1-103"])
        self.assertEqual(state["result"].confidence, "high")
        self.assertEqual(len(state["grades"]), 4)

    def test_three_rewrites_then_refusal(self):
        self.scripted(relevant=False)
        state = self.run_graph()
        self.assertEqual(state["attempts"], 3)
        self.assertEqual(state["path"].count("retrieve"), 4)
        self.assertEqual(state["path"].count("rewrite_query"), 3)
        self.assertEqual(state["result"].answer, REFUSAL)
        self.assertEqual(len(self.embedding_batches), 5)  # One corpus + four queries.

    def test_rewrite_can_recover_without_changing_original_question(self):
        self.scripted()
        normal = self.client.responses.parse.side_effect
        grades = 0

        def parse(**kwargs):
            nonlocal grades
            if kwargs["text_format"] is Grade:
                grades += 1
                if grades <= 4:
                    return SimpleNamespace(output_parsed=Grade(relevant=False, reason="Missing."))
            return normal(**kwargs)

        self.client.responses.parse.side_effect = parse
        state = self.run_graph()
        self.assertEqual(state["attempts"], 1)
        self.assertEqual(state["question"], "What lane must test crew 0 use?")
        self.assertEqual(state["path"], ["retrieve", "grade_documents", "rewrite_query",
                                         "retrieve", "grade_documents", "generate"])

    def test_bad_or_weak_generations_refuse(self):
        cases = [{"confidence": "low"}, {"quote": "invented quote"},
                 {"quote": ""}, {"rule": "Rule 9-999"}, {"page": 999}, {"supported": False},
                 {"no_citations": True}, {"missing_answer": True}]
        for case in cases:
            with self.subTest(case=case):
                self.scripted(**case)
                state = self.run_graph()
                self.assertEqual(state["path"][-2:], ["generate", "refuse"])
                self.assertEqual(state["result"].answer, REFUSAL)
                self.assertEqual(state["result"].citations, [])

    def test_repeated_questions_share_embeddings_not_state(self):
        self.scripted()
        graph = build_graph(self.client, self.data, self.cache)
        for _ in range(2):
            state = graph.invoke(initial_state("What lane must test crew 0 use?"))
            self.assertEqual(len(state["path"]), 3)
        self.assertEqual(len(self.embedding_batches), 3)

    def test_empty_question_rejected(self):
        with self.assertRaises(ValueError):
            initial_state("   ")

    def test_api_failure_is_not_evidence_refusal(self):
        self.client.embeddings.create.side_effect = RuntimeError("API unavailable")
        with self.assertRaisesRegex(RuntimeError, "API unavailable"):
            self.run_graph()

    def test_cache_survives_graph_rebuild(self):
        self.scripted()
        self.run_graph()
        self.run_graph()
        self.assertEqual(len(self.embedding_batches), 3)

    def test_source_change_invalidates_cache(self):
        self.scripted()
        self.run_graph()
        (self.data / "usrowing-rules.pdf").write_bytes(b"changed PDF")
        self.run_graph()
        self.assertEqual(len(self.embedding_batches), 4)


if __name__ == "__main__":
    unittest.main()
