# Maintain the archive in Codex

Clone the archive repository and read [AGENTS.md](AGENTS.md). Review a local diff before publishing. The site includes the creator’s satire and tangent corrections, fixed background artwork, and text-sized SVG icons for outward arrows.

Open the repository folder as its own local Codex project in the ChatGPT desktop app, or run the Codex CLI there. In a desktop worktree setup use `npm ci` as the setup command. To validate your local project:

```text
npm ci
npm run verify
```

Set `npm run verify` as an optional action. For local reading, open the generated index.html or serve the repository root with `python -m http.server 4173`. Production uses the GitHub Pages branch already configured for this repo. [Codex local environments](https://learn.chatgpt.com/docs/environments/local-environment)

## Reviewed video additions

The build pairs the 202 baseline videos in `original/SOURCE_CORPUS` with reviewed additions from `editorial/updates/videos.json`. Keep pipeline trials on a separate local branch until the owner selects content for the archive.

1. Read existing video IDs and ordinals. Discover both channel feeds, resolve stable YouTube IDs and deduplicate collaborative listings. Return candidate IDs with publication precision and transcript availability. Stop at a date or count boundary. Ask for the correct input if a particular new video cannot be identified.
2. For the chosen new ID, prefer supplied VTT/SRT or the private timed JSON. Retain the original transcript in a separate local source kit. Record title, channel, publication timestamp or date precision, provenance, status and source hash. Log an unavailable or silent video explicitly. Use the source kit’s recovery/import scripts as references and keep paid calls explicitly bounded.
3. Produce one checked per-video consolidation or a small set of evidence cards. Cite actual source spans, preserve omissions as gaps and label satire or hypothetical tangents. Verify each chapter or map change against the adjacent raw passages. Do not mix quoted speech or inferred motives with creator statements.
4. Append a reviewed entry to `editorial/updates/videos.json` and save the notes in `editorial/updates/<video_id>.md`. Use the next `ordinal`, the verified `video_id` and `title`, `main` or `raw` for `channel`, and `published_at` as a UTC ISO timestamp or a date-only `YYYY-MM-DD` when that is all the source provides. Set `transcript_provenance` to `creator-provided` or `native-captions`, record the private input’s lowercase `source_sha256`, and set `status` to `reviewed`. Start each note with a bare `[HH:MM:SS]` marker so the build can link the video at that time. Keep metadata-only and unavailable entries in the private source log.
5. Keep the new source and any warranted reading or map edits in the same reviewable branch. Check all video IDs and times and run `npm run verify`. Confirm that old source hashes, anchors, image assets and source-trail links still pass. Check the staged diff for private data. Publish only the approved changes.

Aim to review about 10 new videos per month across the main and Raw channels. For each batch, set a date boundary and an item limit. Compare stable video IDs and hashes before requesting captions or editing notes. A local build reads the reviewed files and makes zero provider requests. Preview the batch locally and wait for explicit owner approval before pushing. Keep captions, source logs and caches outside the public checkout.

## Private inputs

If Codex needs original timed text or historical scripts, extract **Perceived_Codex_Source_Kit.zip** outside the public repository and give Codex the local folder path. Start with a few relevant files and the new video transcript. The site’s existing compact corpus is already committed. The raw chat, large original ZIP, private links, local audio and API keys should not go into the public repo.
