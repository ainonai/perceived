# Maintain the archive in Codex

Clone the archive repository and read [AGENTS.md](AGENTS.md). Review a local diff before publishing. The site includes the creator’s satire and tangent corrections, fixed background artwork, and text-sized SVG icons for outward arrows.

Open the repository folder as its own local Codex project in the ChatGPT desktop app, or run the Codex CLI there. In a desktop worktree setup use `npm ci` as the setup command. To validate your local project:

```text
npm ci
npm run verify
```

Set `npm run verify` as an optional action. On Windows, serve the checkout with `py -3 -m http.server 4173 --bind 127.0.0.1` and open [the local review](http://127.0.0.1:4173/). Production uses the GitHub Pages branch already configured for this repo. [Codex local environments](https://learn.chatgpt.com/docs/environments/local-environment)

## Creator feedback and source review

A request from Julius can name a topic or point to videos. Locate the existing archive entries first. Read the timed passage and adjacent cues, then consult the saved per-video consolidation for other relevant passages. Explain the idea and its mechanism in ordinary reading prose. Preserve a concrete example and the source’s own conditions. Use bold for the term the reader should remember. For an outside research claim, check the original study and explain what it measured.

From this checkout, give the source review command the private timed-source folder. This example locates all three videos behind the biology and study-reading additions:

```powershell
$sources = '..\project-perceived\local-data\julius_archive'
py -3 scripts/review_sources.py --archive $sources --video uZZHNSxx5qw --video cWhbzFZDWYE --at u7lsEOFUwQA@12:47
```

The command finds stable archive numbers, caption provenance, the raw file, and any saved Terra consolidation. An `--at` argument includes nearby cues. For a monthly plan, omit `--video` and `--at`, give it the current private inventories with repeated `--archive` flags, and leave the default limit of ten. Use the private product’s channel preview to discover newer uploads when the inventories need refreshing. The review command reads local files and makes zero provider calls.

Make the smallest set of changes that fully tells the story. Update the authored paragraphs, grounding entries, and any dependent glossary, timeline, or map text. Check the rendered writing and source links on a phone and desktop. Bring the owner a running local page and a concise account of the additions. Keep the release decision with the owner.

## Reviewed video additions

The build pairs the 202 baseline videos in `original/SOURCE_CORPUS` with reviewed additions from `editorial/updates/videos.json`. Keep pipeline trials on a separate local branch until the owner selects content for the archive.

1. Read existing video IDs and ordinals. Discover both channel feeds, resolve stable YouTube IDs and deduplicate collaborative listings. Return candidate IDs with publication precision and transcript availability. Stop at a date or count boundary. Ask for the correct input if a particular new video cannot be identified.
2. For the chosen new ID, prefer supplied VTT/SRT or the private timed JSON. Retain the original transcript in a separate local source kit. Record title, channel, publication timestamp or date precision, provenance, status and source hash. Log an unavailable or silent video explicitly. Use the source kit’s recovery/import scripts as references and keep paid calls explicitly bounded.
3. Produce one checked per-video consolidation or a small set of evidence cards. Cite actual source spans, preserve omissions as gaps and label satire or hypothetical tangents. Verify each chapter or map change against the adjacent raw passages. Do not mix quoted speech or inferred motives with creator statements.
4. Append a reviewed entry to `editorial/updates/videos.json` and save the notes in `editorial/updates/<video_id>.md`. Use the next `ordinal`, the verified `video_id` and `title`, `main` or `raw` for `channel`, and `published_at` as a UTC ISO timestamp or a date-only `YYYY-MM-DD` when that is all the source provides. Set `transcript_provenance` to `creator-provided` or `native-captions`, record the private input’s lowercase `source_sha256`, and set `status` to `reviewed`. Start each note with a bare `[HH:MM:SS]` marker so the build can link the video at that time. Keep metadata-only and unavailable entries in the private source log.
5. Keep the new source and any warranted reading or map edits in the same reviewable branch. Check all video IDs and times and run `npm run verify`. Confirm that old source hashes, anchors, image assets and source-trail links still pass. Check the staged diff for private data. Publish only the approved changes.

Aim to review about 10 new videos per month across the main and Raw channels. For each batch, set a date boundary and an item limit. Compare stable video IDs and hashes before requesting captions or editing notes. A local build reads the reviewed files and makes zero provider requests. Preview the batch locally and wait for explicit owner approval before pushing. Keep captions, source logs and caches outside the public checkout.

## Private inputs

Use the sibling Project Perceived checkout’s `local-data/julius_archive` for original timed text and historical scripts. If it lives elsewhere, pass its existing directory to the source review command. Read the relevant spans and open the local HTML preview for review. The site’s existing compact corpus is already committed. Keep raw chat, private links, local audio and API keys outside the public repo.
