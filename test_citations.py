"""Formatting tolerance must never accept different facts or fabricated quotations."""

import unittest

from corpus import normalize_text, split_pages
from engine import Answer, valid_citations


class CitationTests(unittest.TestCase):
    def answer(self, quote, rule='Rule 1-101', page=12):
        return Answer(answer='Test answer', confidence='high',
                      citations=[{'rule': rule, 'page': page, 'quote': quote}])

    def test_symmetric_normalization_of_layout_and_typography(self):
        extracted = 'The “Crew’s” equip-\r\n  ment\t must  remain — ready.\n'
        copied = 'The "Crew\'s" equipment must remain - ready.'
        self.assertEqual(normalize_text(extracted), copied)
        self.assertEqual(normalize_text(normalize_text(extracted)), copied)
        for source, quote in [(extracted, copied), (copied, extracted)]:
            with self.subTest(source=source):
                self.assertTrue(valid_citations(self.answer(quote),
                                [{'rule': 'Rule 1-101', 'page': 12, 'text': source}]))

    def test_normalization_preserves_content_and_metadata_checks(self):
        text = 'The crew must not start. The bowball is 4 centimeters. First. Middle. Last.'
        chunks = [{'rule': 'Rule 1-101', 'page': 12, 'text': text}]
        invalid = ['The crew must start.', 'The bowball is 5 centimeters.',
                   'First. Last.', 'first.', '', ' \n\t', 'The\x19crew must not start.']
        for quote in invalid:
            with self.subTest(quote=quote):
                self.assertFalse(valid_citations(self.answer(quote), chunks))
        self.assertFalse(valid_citations(self.answer('First.', page=13), chunks))
        self.assertFalse(valid_citations(self.answer('First.', rule='Rule 1-102'), chunks))
        self.assertEqual(normalize_text('on-water 2-308'), 'on-water 2-308')

    def test_observed_control_character_corruption_stays_invalid(self):
        text = 'calling out the Crew’s name'
        chunks = [{'rule': 'Rule 1-101', 'page': 12, 'text': text}]
        self.assertFalse(valid_citations(self.answer('calling out the Crew\x1219s name'), chunks))
        self.assertTrue(valid_citations(self.answer("calling out the Crew's name"), chunks))

    def test_no_matching_across_chunk_boundaries(self):
        chunks = [{'rule': 'Rule 1-101', 'page': 12, 'text': 'First sentence.'},
                  {'rule': 'Rule 1-101', 'page': 12, 'text': 'Second sentence.'}]
        self.assertFalse(valid_citations(self.answer('First sentence. Second sentence.'), chunks))

    def test_overlap_starts_at_word_boundary(self):
        words = [f'word{i:04}' for i in range(300)]
        chunks = split_pages(['1-101 Title\n' + ' '.join(words)])
        self.assertGreater(len(chunks), 1)
        for chunk in chunks[1:]:
            self.assertIn(chunk['text'].split()[0], words)
            self.assertLessEqual(len(chunk['text']), 800)

    def test_long_unbroken_text_terminates(self):
        chunks = split_pages(['1-101 Title\n' + 'x' * 2500])
        self.assertLess(len(chunks), 10)
        self.assertTrue(all(len(c['text']) <= 800 for c in chunks))


if __name__ == '__main__':
    unittest.main()
