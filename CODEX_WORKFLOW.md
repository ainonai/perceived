# Maintain the archive in Codex

Clone the archive repository and read [AGENTS.md](AGENTS.md). Review a local diff before publishing. The site includes the creator’s satire and tangent corrections, fixed background artwork, and text-sized SVG icons for outward arrows.

Open the repository folder as its own local Codex project in the ChatGPT desktop app, or run the Codex CLI there. In a desktop worktree setup use `npm ci` as the setup command. To validate your local project:

```text
npm ci
npm run verify
```

Set `npm run verify` as an optional action. On Windows, serve the checkout with `py -3 -m http.server 4173 --bind 127.0.0.1` and open [the local review](http://127.0.0.1:4173/). Production uses the GitHub Pages branch already configured for this repo. [Codex local environments](https://learn.chatgpt.com/docs/environments/local-environment)

## Creator feedback and source review

A request from Julius can name a topic or point to videos. Locate the existing archive entries first. Read the timed passage and adjacent cues, then consult the saved per-video consolidation for other relevant passages. Explain the idea and its mechanism in ordinary reading prose. Preserve a concrete example and the source’s own conditions. Use bold for the term the reader should remember. If you introduce an illustrative example, make clear it is an illustration. Keep independent research in the evidence review unless it was discussed in the source or requested as part of the feature. When a study belongs in a reading, check the original paper, explain what it measured, and make clear how it entered the article.

From this checkout, give the source review command the private timed-source folder. This example locates all three videos behind the biology and study-reading additions:

```powershell
$sources = 'C:\path\to\private\julius_archive'
py -3 scripts/review_sources.py --archive $sources --video uZZHNSxx5qw --video cWhbzFZDWYE --at u7lsEOFUwQA@12:47
```

The command finds stable archive numbers, caption provenance, the raw file, and any saved Terra consolidation. An `--at` argument includes nearby cues. For a monthly plan, omit `--video` and `--at`, give it the current private inventories with repeated `--archive` flags, and leave the default limit of ten. Refresh the inventories from both channel feeds when needed. The review command reads local files and makes zero provider calls.

Open with the scene, question, or mechanism that makes the idea worth reading. Use the vocabulary to explain what happened. Read the whole revised subsection in the browser, including the transitions into and out of it. Check the actual paragraph and its open source list at phone and desktop widths. Video and paper notes in a reading share one local sequence, small markers, and one source list. Update the grounding entries and any dependent glossary, timeline, or map text. Bring the owner a running local page and a concise account of the additions. Keep the release decision with the owner.

## Reviewed video additions

“Update Perceived for the month” is the kickoff for this workflow. Run it from this checkout with the private source kit available. The deliverable is a local reading edition and a batch report with new titles, caption gaps, what changed, provider usage, and the preview URL.

The build pairs the 202 baseline videos in `original/SOURCE_CORPUS` with reviewed additions from `editorial/updates/videos.json`. Keep pipeline trials on a separate local branch until the owner selects content for the archive.

1. Read existing video IDs and ordinals. Discover both channel feeds, resolve stable YouTube IDs and deduplicate collaborative listings. Return candidate IDs with publication precision and transcript availability. Stop at a date or count boundary. Ask for the correct input if a particular new video cannot be identified.
2. For the chosen new ID, prefer supplied VTT/SRT or the private timed JSON. Retain the original transcript in a separate local source kit. Record title, channel, publication timestamp or date precision, provenance, status and source hash. Log an unavailable or silent video explicitly. Use the source kit’s recovery/import scripts as references and keep paid calls explicitly bounded.
3. Review each video from start to finish. Compare caption coverage with the video runtime and check ambiguous cues against playback. Record the argument, examples, source changes, quoted speakers, and substantive tangents in the private consolidation. Keep the public edit focused on what the material adds. Update the relevant map node and links when an idea changes or gains a useful new reading path. Reuse existing nodes when new evidence deepens an existing idea.
4. Append a reviewed entry to `editorial/updates/videos.json` and save the notes in `editorial/updates/<video_id>.md`. Use the next `ordinal`, the verified `video_id` and `title`, `main` or `raw` for `channel`, and `published_at` as a UTC ISO timestamp or a date-only `YYYY-MM-DD` when that is all the source provides. Set `transcript_provenance` to `creator-provided` or `native-captions`, record the private input’s lowercase `source_sha256`, and set `status` to `reviewed`. Start each note with a bare `[HH:MM:SS]` marker so the build can link the video at that time. Keep metadata-only and unavailable entries in the private source log.
5. Keep the new source and any warranted reading or map edits in the same reviewable branch. Check all video IDs and times and run `npm run verify`. Confirm that old source hashes, anchors, image assets and source-trail links still pass. Check the staged diff for private data. Publish only the approved changes.

Aim to review about 10 new videos per month across the main and Raw channels. For each batch, set a date boundary and an item limit. Compare stable video IDs and hashes before requesting captions or editing notes. A local build reads the reviewed files and makes zero provider requests. Preview the batch locally and wait for explicit owner approval before pushing. Keep captions, source logs and caches outside the public checkout.

Carry the approved batch forward in the reviewed manifest, grounding ledger, and Git diff. Keep the private batch report with the source kit and record the exact inputs and any unresolved gaps. In another Codex checkout, begin from the reviewed branch and pass the location of that environment’s private source kit to the review command.

## Private inputs

For original timed text, pass the private source kit directory to the source review command. Perceived’s build uses its committed compact corpus and reviewed additions. Read the relevant spans and open the local HTML preview for review. Keep raw chat, private links, local audio and API keys outside the public repo.
