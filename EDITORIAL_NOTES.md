# Perceived

A single-page reading archive of Julius Perceiver's ideas, built from the supplied YouTube-transcript consolidation. The site connects attraction, inheritance, relationships, purpose, society, and physical reality while keeping original arguments, qualifications, source links, and the scientific review accessible.

Repository: [ainonai/perceived](https://github.com/ainonai/perceived).

## Read or publish

Open `index.html` after extracting the package. The generated page, images, fonts, scripts, and data are local. Reading and publishing require no installation, account system, API key, or build service.

For GitHub Pages:

1. Upload the package's **contents** to the repository root, including `index.html`, `assets/`, `original/`, and `.nojekyll`.
2. In **Settings → Pages**, choose **Deploy from a branch**, select your branch (usually `main`), and choose **/(root)**.
3. Open the site URL provided by GitHub after deployment finishes.

Do not upload only the ZIP or leave the files inside another directory. Relative paths support a project URL such as a repository subdirectory. GitHub's official [publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) explain the branch settings.

## Preserved material

- All **40 original files**, unchanged, in `original/`.
- All **202 consolidated video-transcript sections**, embedded in the page, with catalog dates and original video links.
- The full attraction model, applications, practical philosophy, reality discussion, Julius profile, chronology, and coverage notes.
- **27 scientific claim reviews**, **55 bibliography entries**, **88 glossary terms** (55 original terms and 33 additional explanations), and **34 reader questions**.
- Seven original diagrams and all **77 directed links**, plus readable overviews and complete redesigned causal maps.

The audit records 516,553 original transcript words. The included compact knowledgebase contains 296,272 whitespace-delimited words. This is transcript-derived knowledge consolidation; the export does not include the original raw transcript files. The shorter reading chapters and interactive map supplement the complete material.

## Reader features

The site provides full-text search, a filterable transcript archive, an expandable complete reference, evidence assessments, glossary lookup, and a saved reading position. The 86-concept map supports panning, zooming, individual node dragging, centered labels that scale with their circles, search, subject filters, and an expanded view with related source links.

Images blend into the page through fixed backdrop artwork and soft gradients. Nine larger subsection photographs accompany concrete, timestamp-linked examples. Only the “A shadow…” opening uses a drop capital; other chapter openings retain their full first word. Underlined vocabulary opens definitions on hover, tap, or keyboard focus. Expanded maps close with ×, Escape, or a click outside; the background stays inactive until closed. Expanded references include a contents column and close buttons.

## Develop

Use Node 20 or newer and Python 3. The supplied generated files are ready to publish; this toolchain is needed only when rebuilding.

```sh
npm ci
npm run verify
```

`verify` rebuilds the page, style bundle, and diagrams, then checks source preservation, anchors, assets, counts, graph destinations, and diagram integrity. `npm run package` creates `Perceived_GitHub_Pages.zip` outside the project directory and excludes development dependencies and temporary QA files.

| Source | Purpose |
|---|---|
| `site.config.json` | Name, edition, repository URL, and channel URLs |
| `editorial/` | The six shorter reading chapters |
| `styles/site.css` | Canonical readable stylesheet; design tokens are at the top |
| `assets/fonts.css`, `assets/fonts/` | Self-hosted typefaces, manifests, and original licenses |
| `assets/reader.js` | Search, source filters, navigation, and diagram viewer |
| `assets/idea-space.js` | Graph interaction |
| `assets/map-labels.js` | Centered, proportionally scaled map labels |
| `editorial/terminology.json` | Additional source-linked definitions and aliases |
| `assets/vocabulary.js` | Inline glossary definitions and source links |
| `scripts/build.mjs` | Page assembly and source routing |
| `scripts/idea-space.mjs` | Concept map content and related source records |
| `scripts/overview-diagrams.mjs` | Simplified diagram definitions |
| `scripts/diagrams.mjs` | Full diagrams preserving original semantics |
| `scripts/styles.mjs` | Local stylesheet assembly |
| `scripts/check.py` | Preservation, asset checksums, and structural checks |
| `scripts/check_images.py` | Optional Pillow-based raster decoding and integrity-manifest refresh |

`assets/perceived.css`, `index.html`, diagram SVGs, and the data/report JSON files are generated outputs. Keep them in the repository because GitHub Pages serves the static files directly. Use `npm run format` for JavaScript and source-style formatting.

The included GitHub workflow runs verification on pushes and pull requests and checks that published outputs match their sources. The lockfile pins development dependencies. Markdown and diagram libraries run during the build, not in the reader's browser. The stylesheet is built from one canonical source instead of a stack of edition-specific overrides. Legacy browser preference keys remain compatible with previous reader versions.

Keep `original/` unchanged. `.gitattributes` disables text conversion for that directory, preserving its hashes when checking out the repository on Windows. New research and corrections belong in identified editorial material rather than silent changes to the source record.

## Attribution and scope

Sixteen real photographs and three generated editorial images are distinguished in the image-credit section. Source pages, creators, transformations, and reuse guidance are in `assets/photo-credits.json` and [ARTWORK_NOTES.md](ARTWORK_NOTES.md). Self-hosted Cormorant Garamond, Literata, and Source Sans 3 retain their SIL Open Font License files.

The supplied scientific review is preserved rather than represented as a newly rerun systematic review. The Terra extraction index is documented in the audit; the later Sol consolidation stage is identified as the project owner's account. See [EDITORIAL_NOTES.md](EDITORIAL_NOTES.md), `preservation-report.json`, and `validation-report.json` for scope and checks.

No blanket license is asserted for third-party source text or photographs. Keep the supplied credits and provenance when republishing. No analytics or visitor tracking is included.

## Link previews

The page includes a 1200 × 630 PNG sharing card, Open Graph metadata, a canonical URL, and a large-image Twitter Card declaration. The source artwork is `assets/social-card.svg`; the published preview is `assets/social-card.png`.

`site.config.json` sets the expected GitHub Pages address to `https://ainonai.github.io/perceived/`. This is deployment configuration, not a claim that the site is already published. If you use a custom domain or a different Pages address, update `url` and rebuild so preview images use the correct absolute URL. Link previews can load once the page and image are publicly accessible. Protocol reference: [Open Graph](https://ogp.me/).

After replacing photographs, run `python3 scripts/check_images.py` in an environment with Pillow, then `npm run verify`. The image manifest is checked during packaging as well, so damaged thumbnails cannot pass unnoticed just because their paths exist.

A final copy edit removes em dashes and stock framing from the reading chapters. Map typography distinguishes the center, subject, concept, and subtopic levels. Labels remain centered inside their own nodes and scale continuously with the graph. The original supplied texts and historical document titles remain unchanged.

Expanded-map performance: no live backdrop blur or collision-based label layout. Decorative background layers pause while the map is open, and graph drawing is batched through requestAnimationFrame. Labels move and scale directly with their node.

Final research presentation: the 27 main entries now separate the source proposition, reported findings, and study scope. Filters describe research designs rather than verdicts. Prescriptive advice and reviewer judgments remain in an explicitly labeled “Original supplied review” within each entry; the original review file is unchanged. These notes summarize the supplied review and do not claim a new literature search. Their editable source is `editorial/evidence-notes.json`. Transcript bullet lists now inherit the body text size and line spacing instead of using a small metadata font.

Profile copy edit: the displayed extended profile now uses `editorial/profile.md`, retaining all of the original profile’s video links and section destinations while replacing defensive framing with informative prose. The original profile remains unchanged in `original/`. The return-to-top control now scrolls directly on every click, including when the URL already ends in `#top`; its icon is centered in a 44px button.

`editorial/source-grounding.json` records the paragraph hashes and timestamped sources for the six reading chapters and the guide to reading studies. `scripts/check_grounding.py` verifies coverage and pointer integrity. The Biology and study-reading additions also draw on checked raw captions and linked primary research.

The reading presentation now separates source-account material from the original atlas reviewer’s commentary. Edited extended source views are in `editorial/references/`; all original documents and the complete 202-section corpus remain unchanged in `original/`. Reader questions, glossary copy edits, and map summaries have editable sources in `editorial/reader-questions.json`, `editorial/glossary-copy.json`, and `editorial/map-notes.json`. Research notes retain study findings and scope; the original full review remains available through its file link. Chronological comparisons retain the source formulations without reviewer verdict paragraphs.

The former floating map-label system has been removed. Each label is now a child of its node, centered in local coordinates and scaled by exactly the same parent transform as the circle. No screen-size floor, label boxes, displacement search, or separate collision pass remains.

The reading chapters explain mechanisms directly, using concrete stories and channel vocabulary. Expanded passages, reader questions, map descriptions, definitions, and image captions use the same voice. The study-reading guide follows analysis choices, hypotheses, and selective publication through examples from the videos. The evidence notes link to the relevant research.

Glossary review: all 55 original terms now have concise reading-edition definitions, preserving their source links and the additional 33 terms. Definitions describe concepts directly; scientific distinctions and hypothetical status remain where they affect the meaning.
