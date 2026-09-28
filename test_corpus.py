"""Offline extraction checks use synthetic text; the copyrighted PDF is optional."""

import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

from corpus import CHUNK_SIZE, cached_vectors, load_chunks, split_pages


class CorpusTests(unittest.TestCase):
    def test_skips_contents_and_manuals_and_preserves_subrules(self):
        chunks = split_pages([
            "1\n1-101 Title .......... 12\n4-105.1 Weight ...... 52",
            "12\n1-101 Title\nFirst rule text.\n1-102 Purposes\nSecond rule text.",
            "13\nContinued second rule.\n4-105.1 Weight\nThird rule text.",
            "88\nReferee Procedures\nManual 2026",
            "89\n1-101 Title\nNot a rule body.",
        ])
        self.assertEqual([c['rule'] for c in chunks],
                         ['Rule 1-101', 'Rule 1-102', 'Rule 1-102', 'Rule 4-105.1'])
        self.assertEqual([c['page'] for c in chunks], [2, 2, 3, 3])
        self.assertIn('Continued second rule.', chunks[2]['text'])

    def test_long_sections_overlap_without_crossing_rules(self):
        chunks = split_pages(['1-101 Title\n' + 'word ' * 500 + '\n1-102 Next\nShort.'])
        first = [c for c in chunks if c['rule'] == 'Rule 1-101']
        self.assertGreater(len(first), 1)
        self.assertTrue(all(len(c['text']) <= CHUNK_SIZE for c in chunks))
        for left, right in zip(first, first[1:]):
            self.assertTrue(any(left['text'][-n:] == right['text'][:n]
                                for n in range(120, 125)))
        self.assertNotIn('1-102', first[-1]['text'])

    def test_wrapped_rule_references_are_not_headings(self):
        chunks = split_pages(['1-101 Title\nSee\nRule 2-602 (“Types of Penalties”).\n'
                              'Also see\n5-202 (“Reporting of Entries”), for context.\n'
                              '1-102 Purposes\nActual next rule.'])
        self.assertEqual([c['rule'] for c in chunks], ['Rule 1-101', 'Rule 1-102'])
        self.assertIn('Rule 2-602', chunks[0]['text'])

    def test_normalizes_layout_hyphens(self):
        chunks = split_pages(['1-101 Title\nCompe-\ntitors must follow\n rules.'])
        self.assertIn('Competitors must follow rules.', chunks[0]['text'])

    def test_no_rules_and_missing_pdf_fail_clearly(self):
        with self.assertRaisesRegex(ValueError, 'No numbered rules'):
            split_pages(['Scanned page without text'])
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaisesRegex(ValueError, 'Download the official'):
                load_chunks(Path(folder) / 'missing.pdf')

    def test_cache_model_change_and_corruption(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            pdf = root / 'test.pdf'
            pdf.write_bytes(b'fixture')
            chunks = [{'rule': 'Rule 1-101', 'page': 1, 'text': 'Test.'}]
            client = Mock()
            client.embeddings.create.return_value.data = [Mock(index=0, embedding=[1.0, 0.0])]
            cached_vectors(client, pdf, chunks, 'model-a', root / 'cache')
            cached_vectors(client, pdf, chunks, 'model-a', root / 'cache')
            self.assertEqual(client.embeddings.create.call_count, 1)
            cached_vectors(client, pdf, chunks, 'model-b', root / 'cache')
            self.assertEqual(client.embeddings.create.call_count, 2)
            for file in (root / 'cache').glob('*.json'):
                file.write_text('broken')
            cached_vectors(client, pdf, chunks, 'model-b', root / 'cache')
            self.assertEqual(client.embeddings.create.call_count, 3)


if __name__ == '__main__':
    unittest.main()
