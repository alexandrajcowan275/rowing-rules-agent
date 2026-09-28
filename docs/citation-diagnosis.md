# Citation failure diagnosis

Fresh reproduction with unchanged commit `43470ae`. The original evaluation discarded rejected drafts, so these are reproduced failures, not recovered original quotes. Unicode control characters are escaped below so every difference is visible.

## In an on-water race, what penalty is assessed for a false start, and what happens after two warnings in the same race?

### Citation 1: Rule 2-308, PDF page 25

Model quote (JSON-escaped):
```json
"(a) A Crew commits a false start when its bow crosses the plane of the starting line before the Starter\u0019s red flag begins to move or green light illuminates. (b) Crew(s) committing a false start will be assessed a warning. A Crew that receives two warnings, including false starts, applicable to the same Race shall be excluded under Rule 2-602(c) (\u0019Types of Penalties\u0019). (c) In the event of a false start, the Judge at Start shall raise a red flag or cause a red light to be illuminated. The Starter shall stop the Race by sounding a bell or sound device, waving a red flag, or illuminating a flashing red light, and calling \u0019Stop!\u0019"
```

Closest passage in the retrieved chunk (JSON-escaped):
```json
"(a) A Crew commits a false start when its bow crosses the plane of the starting line before the Starter\u2019s red flag begins to move or green light illuminates. More than one Crew may be assessed a false start at the same time. (b) Crew(s) committing a false start will be assessed a warning. A Crew that receives two warnings, including false starts, applicable to the same Race shall be excluded under Rule 2-602(c) (\u201cTypes of Penalties\u201d). (c) In the event of a false start, the Judge at Start shall raise a red flag or cause a red light to be illuminated. The Starter shall stop the Race by sounding a bell or sound device, waving a red flag, or illuminating a flashing red light, and calling \u201cStop!\u201d"
```

Exact differences (quote → source):
```json
[
  {
    "operation": "replace",
    "quote": "\u0019",
    "source": "\u2019"
  },
  {
    "operation": "insert",
    "quote": "",
    "source": ". More than one Crew may be assessed a false start at the same time"
  },
  {
    "operation": "replace",
    "quote": "\u0019",
    "source": "\u201c"
  },
  {
    "operation": "replace",
    "quote": "\u0019",
    "source": "\u201d"
  },
  {
    "operation": "replace",
    "quote": "\u0019",
    "source": "\u201c"
  },
  {
    "operation": "replace",
    "quote": "\u0019",
    "source": "\u201d"
  }
]
```

Rule/page match: True. Literal substring match: False.

### Citation 2: Rule 2-602, PDF page 34

Model quote (JSON-escaped):
```json
"(b) Warning: A Crew that receives two warnings applying to the same Race shall be excluded pursuant to subsection (c) below. A false start shall have the same effect as a warning. (c) Exclusion: A Crew that is excluded shall be removed from the Event."
```

Closest passage in the retrieved chunk (JSON-escaped):
```json
"(b) Warning: A Crew that receives two warnings applying to the same Race shall be excluded pursuant to subsection (c) below. A false start shall have the same effect as a warning. (1) All warnings shall expire and be of no further effect once the Race to which they apply has been successfully completed. However, if a Race is rerowed, warnings applicable to the original Race shall apply to the rerow. (c) Exclusion: A Crew that is excluded shall be removed from the Event."
```

Exact differences (quote → source):
```json
[
  {
    "operation": "insert",
    "quote": "",
    "source": "1) All warnings shall expire and be of no further effect once the Race to which they apply has been successfully completed. However, if a Race is rerowed, warnings applicable to the original Race shall apply to the rerow. ("
  }
]
```

Rule/page match: True. Literal substring match: False.

## Who is responsible for a crew's steering, and when will the referee instruct it to alter course?

### Citation 1: Rule 2-402, PDF page 27

Model quote (JSON-escaped):
```json
"Each Crew is responsible for its own steering. The Referee will not render assistance to Crews merely to steer a better course, even if a Crew leaves its own water, and will instruct a Crew to alter its course only to prevent Interference, otherwise ensure safety, or to ensure fairness to other Crews."
```

Closest passage in the retrieved chunk (JSON-escaped):
```json
"Each Crew is responsible for its own steering. The Referee will not render assistance to Crews merely to steer a better course, even if a Crew leaves its own water, and will instruct a Crew to alter its course only to prevent Interference, otherwise ensure safety, or to ensure fairness to other Crews."
```

Exact differences (quote → source):
```json
[]
```

Rule/page match: True. Literal substring match: True.

### Citation 2: Rule 2-407, PDF page 28

Model quote (JSON-escaped):
```json
"An instruction for a Crew to alter its course shall consist of raising a white flag vertically, calling out the Crew\u001219s name, and then dropping the flag laterally to whichever"
```

Closest passage in the retrieved chunk (JSON-escaped):
```json
"An instruction for a Crew to alter its course shall consist of raising a white flag vertically, calling out the Crew\u2019s name, and then dropping the flag laterally to whichever"
```

Exact differences (quote → source):
```json
[
  {
    "operation": "replace",
    "quote": "\u001219",
    "source": "\u2019"
  }
]
```

Rule/page match: True. Literal substring match: False.

### Citation 3: Rule 2-408, PDF page 29

Model quote (JSON-escaped):
```json
"If a crew is steering towards a previously unknown or unidentified obstacle or installation obstructing its assigned lane and is in reasonable danger of collision, the Referee shall alert the Crew by raising a white flag vertically, calling out the name of the Crew, and then calling out \u0016Obstacle!\u0017, and instruct the Crew to alter its course as described in Rule 2-407(a)"
```

Closest passage in the retrieved chunk (JSON-escaped):
```json
"s steering towards a previously unknown or unidentified obstacle or installation obstructing its assigned lane and is in reasonable danger of collision, the Referee shall alert the Crew by raising a white flag vertically, calling out the name of the Crew, and then calling out \u201cObstacle!\u201d, and instruct the Crew to alter its course as described in Rule 2-407(a)"
```

Exact differences (quote → source):
```json
[
  {
    "operation": "delete",
    "quote": "If a crew i",
    "source": ""
  },
  {
    "operation": "replace",
    "quote": "\u0016",
    "source": "\u201c"
  },
  {
    "operation": "replace",
    "quote": "\u0017",
    "source": "\u201d"
  }
]
```

Rule/page match: True. Literal substring match: False.

## Findings

- False-start quotes combined noncontiguous passages, omitting an intervening sentence or paragraph. Normalization must not accept those quotations.
- Steering Rule 2-402 matched exactly. Extra citations introduced corrupted control characters and reconstructed a prefix missing from a clipped chunk. The all-citations gate therefore rejected the draft.
- Both questions retrieved their expected rule and page. The main failure was generated citation fidelity, with midword overlap boundaries contributing to a reconstructed quotation.
- The API payload used ASCII-escaped Unicode, while the rejected output contained malformed escapes/control characters. Sending literal Unicode avoids that encoding ambiguity. This is an observed failure pattern, not proof of the model’s internal cause.

## Fix

Use one normalization function on extracted text and on both sides of citation comparison. Normalize whitespace, line-break hyphenation, typographic quotes, and dashes only. Keep exact rule/page matching and contiguous substring matching; do not repair arbitrary control characters or omitted text. Send literal Unicode to the model and request short copied spans, separate citations for separated passages, and no reconstructed chunk prefixes. Start overlapping chunks at word boundaries. Keep the graph and evaluation questions unchanged.
