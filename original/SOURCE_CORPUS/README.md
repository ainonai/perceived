# Julius Perceiver — standalone consolidated knowledgebase

## Contents

- `JULIUS_KNOWLEDGEBASE.md` — **the one file to upload to ChatGPT / a WebUI**.
  Contains all source-attributed consolidated video material, not just an index.
- `CATALOG.json` — machine-readable per-video index, publication dates, links,
  source and consolidated word counts, fallbacks, and content checksums.
- `CATALOG.csv` — convenient spreadsheet-style video list.
- `AUDIT.json` — verification totals and token counts (if tiktoken installed).

## What was compressed?

Only redundant, repeated per-timestamp Markdown URL wrappers. For example:

`[00:00:52](https://www.youtube.com/watch?v=zxTCGMl_KBg&t=52s)`

becomes `[00:00:52]`, while its parent video section **retains**:

`- Video: https://www.youtube.com/watch?v=zxTCGMl_KBg`

The script checks that all original per-video files can be reconstructed
*exactly* (modulo Windows/Unix newline normalization) by restoring these
links. It also cross-checks time labels against the encoded seconds and each
YouTube video ID against its own source header. It rejects missing or duplicate
videos rather than silently exporting a partial corpus.

**No AI calls, no summarization, no deletion of distinct claims.**
This is mechanical token compaction only. A further semantic reduction would
be a separate, lossy operation and is intentionally not performed here.

## Citation reconstruction

For each passage, use its video's URL with the passage timestamp. Example:
`[00:00:52]` is `&t=52s`; `[01:02:03]` is `&t=3723s`.

In a ChatGPT file upload, the file may be indexed/retrieved rather than read
entirely into a single prompt. Successful upload does NOT prove exhaustive
one-pass model attention over every claim. The audit confirms export fidelity,
not downstream language-model analysis fidelity.

## Integrity / scope

- The original `julius_archive` and `faithful_pilot_v2` directories are untouched.
- Fallback sections from the original transcripts remain labeled and visible.
- Source statements are not independently fact-checked.
- The original full 202 per-video consolidated documents remain the baseline.
