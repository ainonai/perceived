import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { renderDiagrams } from "./diagrams.mjs";
import { pageMetadata } from "./metadata.mjs";
import { compileStyles } from "./styles.mjs";
import { ideaSpace } from "./idea-space.mjs";
import { overviewDiagrams } from "./overview-diagrams.mjs";
import { loadSources } from "./sources.mjs";
const require = createRequire(import.meta.url);
let marked;
try {
  ({ marked } = require("marked"));
} catch {
  ({ marked } = require(
    path.join(
      process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ||
        "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules",
      "marked",
    ),
  ));
}
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const write = (p, s) => fs.writeFileSync(path.join(root, p), s);
const site = JSON.parse(read("site.config.json"));
const addedTerms = JSON.parse(read("editorial/terminology.json"));
const glossaryDestinations = new Set(addedTerms.map((term) => `#${term.chapter}`));
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const plain = (s) =>
  s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/[*_`]/g, "");
const slug = (s) =>
  plain(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s/g, "-");
const files = {
  start: "START_HERE.md",
  model: "FEMALE_NATURE/Complete_Model.md",
  applications: "FEMALE_NATURE/Relationship_and_Dating_Applications.md",
  reality: "REALITY_AND_UNIVERSE/Principles_of_Reality.md",
  life: "SUCCESS_AND_LIFE/Success_Happiness_and_Living.md",
  science: "SCIENCE/Scientific_Evidence_Review.md",
  diagrams: "DIAGRAMS/README.md",
  profile: "JULIUS_PROFILE/Who_Is_Julius.md",
  tensions:
    "EVOLUTION_AND_TENSIONS/Chronology_Contradictions_and_Development.md",
  reference: "REFERENCE/Glossary_Questions_and_Source_Index.md",
  coverage: "COVERAGE_AND_LIMITATIONS.md",
  quality: "QUALITY_AND_INTEGRITY.md",
};
const docs = Object.fromEntries(
  Object.entries(files).map(([k, p]) => [k, read("original/" + p)]),
);
const docByPath = Object.fromEntries(
  Object.entries(files).map(([k, p]) => [p, k]),
);
const headings = Object.fromEntries(
  Object.entries(docs).map(([key, text]) => [
    key,
    [...text.matchAll(/^(#{1,4}) (.+)$/gm)].map((m) => ({
      name: m[2],
      depth: m[1].length,
      fragment: slug(m[2]),
      id: `ref-${key}-${slug(m[2])}`,
    })),
  ]),
);
const anchorMap = {};
for (const [key, hs] of Object.entries(headings))
  for (const h of hs) anchorMap[`${key}#${h.fragment}`] = h.id;
for (let i = 1; i <= 55; i++)
  anchorMap[`science#r${String(i).padStart(2, "0")}`] =
    `r${String(i).padStart(2, "0")}`;
for (let i = 1; i <= 7; i++) anchorMap[`diagrams#d0${i}`] = `diagram-d0${i}`;
const photoList = JSON.parse(read("assets/photo-credits.json")),
  photos = Object.fromEntries(photoList.map((p) => [p.id, p]));
const svgNames = fs
  .readdirSync(path.join(root, "original/DIAGRAMS"))
  .filter((n) => n.endsWith(".svg"))
  .sort();
const {
  videos: sourceVideos,
  sections: sourceSections,
  updateCount,
} = loadSources(read);
await compileStyles();
await renderDiagrams();
overviewDiagrams();
const sourceCount = sourceVideos.length;
const baselineSourceCount = sourceCount - updateCount;
const sourceNoun = updateCount ? "video sources" : "video transcripts";
const sourceCountDetail = updateCount
  ? "titles, annotations, and indexed transcripts or reviewed notes"
  : "titles, annotations, and full consolidated text";
const sourceDates = sourceVideos.map((v) => v.published_at_utc.slice(0, 10)).sort();
const sourceYears = [...new Set(sourceDates.map((date) => date.slice(0, 4)))];
const dateFormat = (date, locale, options) =>
  new Date(date).toLocaleDateString(locale, { ...options, timeZone: "UTC" });
const dates = { day: "numeric", month: "long", year: "numeric" };
const months = { month: "long", year: "numeric" };
const sourceDateRange = [sourceDates[0], sourceDates.at(-1)]
  .map((date) => dateFormat(date, "en-GB", dates))
  .join("–");
const sourceMonthRange = [sourceDates[0], sourceDates.at(-1)]
  .map((date) => dateFormat(date, "en-US", months))
  .join(" – ");
const diagramSizes = JSON.parse(read("diagram-redesign-report.json")).diagrams;
const externalArrow =
  '<svg class="external-arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 10 10 2M4 2h6v6"/></svg>';
const icons = {
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  theme:
    '<path d="M20.7 13.4A8.8 8.8 0 0 1 10.6 3.3 8.8 8.8 0 1 0 20.7 13.4Z"/>',
  print:
    '<path d="M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7Z"/><path d="M17 11h.01"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  up: '<path d="m6 11 6-6 6 6M12 5v15"/>',
  github:
    '<path d="M9 19c-4.3 1.3-4.3-2.2-6-2.7M15.7 22v-3.4a3 3 0 0 0-.8-2.3c2.7-.3 5.5-1.3 5.5-6a4.7 4.7 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.3 1.2a11.4 11.4 0 0 0-6 0C7.4 3.6 6.4 3.9 6.4 3.9a4.3 4.3 0 0 0-.1 3.2A4.7 4.7 0 0 0 5 10.3c0 4.7 2.8 5.7 5.5 6a3 3 0 0 0-.8 2.3V22"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
};
const icon = (n) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n]}</svg>`;
let renderContext = "";
let renderer = new marked.Renderer();
renderer.html = ({ text }) => {
  // Only the atlas's simple, pre-existing anchor markers are recognized.
  const match = text.trim().match(/^<a id="(r\d\d|d0\d)"><\/a>$/);
  if (match)
    return match[1].startsWith("r") ? `<span id="${match[1]}"></span>` : "";
  return esc(text);
};
function route(href) {
  if (/^https?:\/\//i.test(href)) return href;
  if (/^(?:javascript|data|vbscript):/i.test(href)) return "#methods";
  if (renderContext === "reference" && glossaryDestinations.has(href)) return href;
  const [filename, fragment] = href.split("#");
  const target = filename
    ? path.posix.normalize(
        path.posix.join(
          path.posix.dirname(files[renderContext] || ""),
          filename,
        ),
      )
    : files[renderContext];
  const key = docByPath[target];
  if (key) {
    if (fragment)
      return "#" + (anchorMap[`${key}#${fragment}`] || `ref-${key}`);
    return "#ref-" + key;
  }
  if (filename?.match(/\.(svg|png|mmd)$/i)) return "original/" + target;
  if (
    filename?.startsWith("SOURCE_CORPUS/") ||
    target?.startsWith("SOURCE_CORPUS/")
  )
    return "original/" + target;
  return filename ? "original/" + target : "#methods";
}
renderer.link = function ({ href, title, tokens }) {
  const text = this.parser.parseInline(tokens),
    target = route(href);
  const external = /^https?:/.test(target);
  const cite = plain(text).match(
    /^(V\d{3,})\s*·\s*(\d{4}-\d\d-\d\d)\s*·\s*(.+)$/,
  );
  if (cite)
    return `<a class="citation" href="${esc(target)}" target="_blank" rel="noopener noreferrer" title="${esc(plain(text))} · opens the source video at this timestamp">${esc(cite[1])} ${esc(cite[3])}</a>`;
  return `<a href="${esc(target)}"${title ? ` title="${esc(title)}"` : ""}${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
};
renderer.image = ({ href, text }) =>
  `<img src="${esc(route(href))}" alt="${esc(text)}" loading="lazy" decoding="async">`;
renderer.heading = function ({ tokens, depth }) {
  const text = this.parser.parseInline(tokens),
    id =
      anchorMap[`${renderContext}#${slug(plain(text))}`] ||
      `ref-${renderContext}-${slug(plain(text))}`;
  const level = Math.min(depth + 1, 5);
  return `<h${level} id="${id}">${text}</h${level}>\n`;
};
marked.use({ renderer, gfm: true, breaks: false });
const paperAnchor = (number) =>
  `<a href="#r${number}" aria-label="Scientific reference ${Number(number)}" title="Open scientific reference ${Number(number)}">${Number(number)}</a>`;
const paperReference = (number) =>
  `<sup class="paper-reference">${paperAnchor(number)}</sup>`;
function joinCitationNotes(html) {
  let result = html.replace(
    /[ \t\r\n]+(?=<sup class="(?:paper-reference|example-citation)">)/g,
    "",
  );
  for (const kind of ["paper-reference", "example-citation"]) {
    const adjacent = new RegExp(
      `</sup>[ \t]*(?:·|,)?[ \t]*<sup class="${kind}">`,
      "g",
    );
    result = result.replace(
      adjacent,
      '<span class="citation-separator">,</span>',
    );
  }
  return result;
}
const fixRefs = (s) =>
  joinCitationNotes(
    s
      .replace(/<a[^>]+href="#r(\d{2})"[^>]*>\[?R\d{2}\]?<\/a>/g, (_, number) =>
        paperReference(number),
      )
      .replace(/\[R(\d{2})(?:[–-]R(\d{2}))?\]/g, (_, a, b) =>
        b
          ? `<sup class="paper-reference">${paperAnchor(a)}<span class="citation-separator">–</span>${paperAnchor(b)}</sup>`
          : paperReference(a),
      ),
  );

function md(text, context = "") {
  renderContext = context;
  let result = fixRefs(marked.parse(text));
  result = result.replace(
    /&lt;a id=&quot;(r\d\d)&quot;&gt;&lt;\/a&gt;/g,
    '<span id="$1"></span>',
  );
  result = result.replace(/&lt;a id=&quot;d0\d&quot;&gt;&lt;\/a&gt;/g, "");
  return result
    .replace(
      /<table>/g,
      '<div class="table-wrap" tabindex="0" role="region" aria-label="Scrollable reference table"><table>',
    )
    .replace(/<\/table>/g, "</table></div>");
}
function removeLead(text) {
  return text
    .replace(/^# [^\n]+\n+/, "")
    .replace(/^\[Atlas entrance\][^\n]+\n+/, "");
}
function refId(key, n) {
  const list = headings[key].filter((h) => /^\d+\./.test(h.name));
  return list[n - 1]?.id || `ref-${key}`;
}
function searchWrap(id, title, label, body, weight = 3) {
  return `<section id="${esc(id)}" data-search-unit data-search-title="${esc(title)}" data-search-label="${esc(label)}" data-search-weight="${weight}">${body}</section>`;
}
const profileLabels = {
  "Self-reported life and work": "Life and work",
  "Neurodivergence and intelligence as self-description":
    "Temperament and social adaptation",
  "The values he repeatedly expresses": "Recurring values",
  "Rhetorical method and intellectual habits": "Presentation and reasoning",
  "Relationship narratives and ethical self-contradiction":
    "Relationships and family aspirations",
};
const referenceLabels = {
  model: {
    "1. The central proposition and its moving parts":
      "1. Appearance and the attraction argument",
    "3. Looks, beauty, the halo effect, and personality":
      "3. Appearance, the halo effect, and personality",
    "9. Preselection, rivals, and the limits of the “cheat” title":
      "9. Preselection and perceived rivals",
    "15. What the relationship stories establish—and do not":
      "15. The personal relationship stories",
    "17. Loyalty, control, trust, and the unresolved end state":
      "17. Loyalty, control, and outcome independence",
  },
  life: {
    "1. Congruence is more than resignation":
      "1. Congruence and environmental fit",
    "4. ROI as engine and trap": "4. ROI and ordinary enjoyment",
    "11. Tit-for-tat and the limits of “always”":
      "11. Tit-for-tat and cooperation",
    "13. Depression, medication, and the most consequential overreach":
      "13. Depression and medication in the channel’s account",
    "15. The usable practical core and its conditions":
      "15. Work, learning, and acceptance",
  },
  reality: {
    "9. Consciousness, meaning, and what remains unspecified":
      "9. Consciousness and meaning",
  },
  applications: {
    "14. When accepting constraints becomes self-defeating":
      "14. Acceptance, effort, and life beyond dating",
    "15. A practical decision sequence with the provenance kept visible":
      "15. The recurring recommendation sequence",
  },
};
const referenceLabel = (key, title) =>
  key === "profile"
    ? profileLabels[title] || title
    : referenceLabels[key]?.[title] || title;
function refBody(key, selection = null) {
  const s =
    selection ??
    removeLead(
      key === "profile"
        ? read("editorial/profile.md")
        : ["model", "applications", "life", "reality"].includes(key)
          ? read(`editorial/references/${key}.md`)
          : docs[key],
    );
  const parts = s.split(/(?=^## )/m);
  return parts
    .map((text, i) => {
      const title = text.match(/^## (.+)/)?.[1];
      let html = md(text, key);
      if (!title) return html;
      html = html.replace(
        `>${esc(title)}</h`,
        `>${esc(referenceLabel(key, title))}</h`,
      );
      const target = anchorMap[`${key}#${slug(title)}`];
      // Heading carries the destination; searchable wrapper has its own ID.
      return searchWrap(
        `${target}-entry`,
        plain(referenceLabel(key, title)),
        "Extended reference",
        html,
        1,
      );
    })
    .join("");
}
function fullReference(key, title, description, selection = null) {
  const contents = headings[key].filter(
    (h) => h.depth === 2 && (!selection || selection.includes(h.name)),
  );
  const close = `<button class="reference-close" data-close-reference aria-label="Close this expanded reference"><span aria-hidden="true">×</span> Close reference</button>`;
  return `<details class="details-box full-reference" id="ref-${key}"><summary><span>${esc(title)}</span><small>Complete reference</small></summary><div class="details-content reference-prose reference-layout"><div class="reference-main"><p class="reference-intro">${esc(description)} ${["profile", "model", "applications", "life", "reality"].includes(key) ? "" : "The original wording and qualifications are retained here for traceability."} <a href="original/${files[key]}">Original Markdown</a>.</p>${refBody(key, selection)}${close}</div><aside class="reference-nav">${close}<p class="side-label">In this reference</p><nav aria-label="${esc(title)} sections"><ol>${contents.map((h) => `<li><a href="#${h.id}">${esc(referenceLabel(key, h.name))}</a></li>`).join("")}</ol></nav></aside></div></details>`;
}

function photoAttributes(p, sizes) {
  return `src="${p.thumbnail}" srcset="${p.thumbnail} 1200w, ${p.file} ${p.width}w" sizes="${sizes}"`;
}
function photo(id, caption, cls = "chapter-cover") {
  const p = photos[id];
  return `<figure class="${cls}"><img ${photoAttributes(p, "(max-width: 640px) 100vw, (max-width: 960px) calc(100vw - 60px), calc(100vw - 350px)")} width="${p.width}" height="${p.height}" loading="lazy" decoding="async" alt="${esc(p.alt)}"><figcaption>${esc(caption)} <a href="#photo-${id}">Image credit</a>.</figcaption></figure>`;
}
const editorialMap = {
  biology: {
    n: "01",
    label: "Biology & development",
    title: "Inheritance & environment",
    image: "mist-forest",
    caption:
      "Inherited dispositions, selected environments, and compounding experience connect the biological arguments.",
    references: [
      ["reality", 1],
      ["reality", 2],
      ["reality", 3],
      ["reality", 3],
      ["reality", 4],
      ["reality", 5],
      ["reality", 14],
    ],
    origin: "reality",
  },
  attraction: {
    n: "02",
    label: "Attraction & choice",
    title: "Attraction & partner choice",
    image: "peacock",
    caption:
      "The peacock is the recurring illustration in the sexual-selection and handicap-principle explanation.",
    references: [
      ["model", 1],
      ["model", 1],
      ["model", 3],
      ["model", 2],
      ["model", 4],
      ["model", 5],
      ["model", 6],
      ["model", 9],
      ["model", 12],
      ["model", 14],
    ],
    origin: "model",
  },
  relationships: {
    n: "03",
    label: "Relationships & reciprocity",
    title: "Desire & a shared life",
    image: "couple",
    caption:
      "Desire, practical support, and commitment shape different parts of a shared life. Illustrative photograph.",
    references: [
      ["model", 8],
      ["model", 8],
      ["model", 9],
      ["model", 10],
      ["applications", 10],
      ["applications", 12],
      ["model", 15],
      ["applications", 15],
    ],
    origin: "applications",
  },
  living: {
    n: "04",
    label: "Work, purpose & living",
    title: "Work, purpose & constraints",
    image: "mountains",
    caption:
      "Congruence asks where effort helps, where the setting should change, and which outcomes cannot be guaranteed.",
    references: [
      ["life", 1],
      ["life", 1],
      ["life", 2],
      ["life", 3],
      ["life", 4],
      ["life", 6],
      ["life", 10],
      ["life", 12],
      ["life", 14],
    ],
    origin: "life",
  },
  reality: {
    n: "05",
    label: "Mind, time & the universe",
    title: "Mind, time & the universe",
    image: "cosmic-cliffs",
    caption:
      "The Cosmic Cliffs in the Carina Nebula, observed by Webb in near-infrared light and mapped to visible colors.",
    references: [
      ["reality", 1],
      ["reality", 6],
      ["reality", 8],
      ["reality", 9],
      ["reality", 10],
      ["reality", 11],
      ["reality", 12],
    ],
    origin: "reality",
  },
  society: {
    n: "06",
    label: "Society & technology",
    title: "Incentives, society & technology",
    image: "night-street",
    caption:
      "People, institutions, information, and incentives interact to shape public life. Illustrative photograph.",
    references: [
      ["reality", 15],
      ["reality", 15],
      ["reality", 4],
      ["reality", 15],
    ],
    origin: "reality",
  },
};
function contextFigure(index, caption) {
  const url = "assets/overviews/d0" + (index + 1) + ".svg",
    full = "assets/diagrams/" + svgNames[index];
  return `<figure class="context-diagram"><a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${url}" width="1080" height="795" alt="${esc(caption)}" loading="lazy" decoding="async"></a><figcaption><span class="kicker">D0${index + 1} / Concept overview</span><p>${esc(caption)}</p><button class="text-button" data-diagram="${url}" data-title="${esc(caption)}" data-caption="A reading overview of the connected concepts. The complete map preserves the original link identifiers and source ledger.">Enlarge overview ${externalArrow}</button> · <button class="text-button" data-diagram="${full}" data-title="D0${index + 1} / Complete causal map" data-caption="Every original directed link is preserved. The original ledger records each link’s source and status.">Complete causal map ${externalArrow}</button> · <a href="#ref-diagrams">Source ledger</a></figcaption></figure>`;
}
const sideImages = {
  biology: "laboratory",
  attraction: "reflections",
  relationships: "stairs",
  living: "chess",
  reality: "ocean",
  society: "city",
};
const sideVideos = {
  biology: [20, 147],
  attraction: [3, 104],
  relationships: [83, 127],
  living: [70, 149],
  reality: [7, 12],
  society: [8, 201],
};
function chapterAside(key, toc) {
  const image = photos[sideImages[key]];
  return `<aside class="chapter-side"><p class="side-label">On this page</p><nav aria-label="${esc(editorialMap[key].label)} topics"><ol>${toc}</ol></nav><figure><img src="${image.thumbnail}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async" alt="${esc(image.alt)}"><figcaption><a href="#photo-${image.id}">Image & credit ${externalArrow}</a></figcaption></figure><p class="side-label">Into the transcripts</p>${sideVideos[
    key
  ]
    .map((n) => {
      const v = sourceVideos[n - 1];
      return `<a class="side-video" href="${v.video_url}" target="_blank" rel="noopener noreferrer"><span>V${String(n).padStart(3, "0")} · ${v.published_at_utc.slice(0, 10)}</span>${esc(v.title)} ${externalArrow}</a>`;
    })
    .join(
      "",
    )}<a class="side-all" href="#sources">All ${sourceCount} ${sourceNoun} →</a></aside>`;
}
const subsectionImages = {
  biology: {
    "Biotechnology and prediction": [
      "laboratory",
      "The scale of embryo selection raises a question about who can access future genetic advantages.",
    ],
  },
  attraction: {
    "Sexual selection and costly signals": [
      "peacock",
      "A conspicuous tail can attract mates while making survival harder: reproductive appeal and survival advantage can pull in different directions.",
    ],
  },
  relationships: {
    "Compatibility, agreements, and exit": [
      "couple",
      "Desire, care, reliability, and practical support contribute different things to a shared life.",
    ],
  },
  living: {
    "ROI, wealth, and ordinary experience": [
      "chess",
      "Planning for a return and accepting an uncertain outcome are different parts of purposeful action.",
    ],
    "Congruence and environmental fit": [
      "mountains",
      "Congruence asks which conditions and work make use of a person’s actual dispositions.",
    ],
  },
  reality: {
    "Consciousness and meaning": [
      "ocean",
      "An exact physical repetition raises a personal question: the same consciousness, or an identical copy?",
    ],
    "The early universe and ultimate origin": [
      "nebula",
      "Webb’s near-infrared view of the Pillars of Creation reveals columns of gas and dust amid stars.",
    ],
  },
  society: {
    "Information and public narratives": [
      "newspapers",
      "Attention, funding, and access to capital can reward particular public narratives.",
    ],
    "Social media and feedback": [
      "social-media",
      "The reset-feed example connects repeated viewing choices with the accumulation of familiar recommendations.",
    ],
  },
};
function numberedReadingNotes(body) {
  const sources = [];
  const paperNumbers = new Map();
  const numbered = body.replace(
    /<a ([^>]*href="(https:\/\/[^"]+)"[^>]*)>(.*?)<\/a>/g,
    (_, attributes, url, label) => {
      const video = url.startsWith("https://www.youtube.com/watch?");
      const title = plain(label);
      let number = video ? undefined : paperNumbers.get(url);
      if (number === undefined) {
        number = sources.push({ attributes, title, video });
        if (!video) paperNumbers.set(url, number);
      }
      return `<sup class="example-citation"><a ${attributes} aria-label="${esc(title)}" title="${esc(title)}">${number}</a></sup>`;
    },
  );
  if (!sources.length) return numbered;
  const onlyVideos = sources.every(({ video }) => video);
  const heading = onlyVideos ? "Video examples" : "Sources and studies";
  const count = onlyVideos
    ? `${sources.length} timestamped ${sources.length === 1 ? "link" : "links"}`
    : `${sources.length} numbered references`;
  const entries = sources.map(({ attributes, title }) =>
    `<li><a ${attributes}>${esc(title)}</a></li>`,
  );
  return joinCitationNotes(numbered) +
    `<details class="example-notes"><summary>${heading} <span>${count}</span></summary><ol>${entries.join("")}</ol></details>`;
}
function editorial(key) {
  const c = editorialMap[key],
    text = read(`editorial/${key}.md`),
    pieces = text.split(/(?=^### )/m);
  let content = "";
  pieces.forEach((piece, i) => {
    if (i === 0) piece = piece.replace(/^## [^\n]+\n+/, "");
    const title = piece.match(/^### (.+)/)?.[1] || c.title;
    const id = i ? `${key}-${slug(title)}` : `${key}-introduction`;
    const [rk, rn] = c.references[Math.min(i, c.references.length - 1)];
    const target = refId(rk, rn);
    // Build the editorial copy with simple, distinct heading anchors.
    let body = numberedReadingNotes(
      md(piece, c.origin)
        .replace(/<h4 id="[^"]+">/g, `<h3>`)
        .replace(/<\/h4>/g, "</h3>"),
    );
    body += `<p class="source-trail">Reference: <a href="#${target}">${esc(referenceLabel(rk, headings[rk].find((h) => h.id === target)?.name || "Extended account"))}</a> · <a href="#evidence">Evidence review</a></p>`;
    if (key === "biology" && title === "Polygenic traits and disorders")
      body += '<p class="source-trail"><a href="#ref-science-s15-are-disorders-merely-mismatched-superpowers">Research note on neurodevelopment and environmental fit</a></p>';
    if (key === "attraction" && i === 1)
      body += `<div class="stage-grid"><div><span>01 · APPEARANCE</span><b>Initial desire</b><p>Looks and the halo effect.</p></div><div><span>02 · COMPARISON</span><b>Perceived alternatives</b><p>SMV discrepancy within a relationship.</p></div><div><span>03 · CARE</span><b>Logistical attraction</b><p>Resources, affection, and dependability.</p></div><div><span>04 · CONTINUITY</span><b>A future family</b><p>Partner choice and generational replication.</p></div></div>`;
    // Images are keyed to subsection titles so editing the chapter order keeps them relevant.
    const illustration = subsectionImages[key]?.[title];
    if (illustration) {
      const [image, caption] = illustration;
      const headingEnd = body.indexOf("</h3>") + 5;
      body =
        body.slice(0, headingEnd) +
        photo(image, caption, "reading-photo") +
        body.slice(headingEnd);
    }
    if (key === "biology" && title === "Dispositions help shape experience")
      body += contextFigure(
        6,
        "Heritability snowballing connects dispositions with the environments a person seeks, selects, or creates.",
      );
    if (key === "attraction" && i === 4)
      body += contextFigure(
        0,
        "The proposed attraction model separates perceived desirability, sexual desire, practical relationship value, and observed pursuit.",
      );
    if (key === "relationships" && i === 1)
      body += contextFigure(
        1,
        "Continuing to desire someone and being willing to stay are different outcomes. Care and logistical attraction help connect them.",
      );
    if (key === "living" && i === 1)
      body += contextFigure(
        3,
        "Starting conditions, attention, practice, and environmental fit connect the practical questions. The diagram follows the source arguments across those themes.",
      );
    if (key === "reality" && i === 6)
      body += contextFigure(
        4,
        "The recurrence argument connects determinism and cosmic history with the question of subjective identity.",
      );
    content += searchWrap(id, title, "Reading edition · " + c.label, body, 6);
  });
  let ref = "";
  if (key === "attraction")
    ref = fullReference(
      "model",
      "Read the complete attraction model · 17 sections",
      "Sexual selection, gaze, presentation, approaches, and relationship cases from the supplied account.",
    );
  if (key === "relationships")
    ref = fullReference(
      "applications",
      "Open the recommendation register & applications · 15 sections",
      "The source recommendations, their stated purposes, and the video examples behind them.",
    );
  if (key === "living")
    ref = fullReference(
      "life",
      "Read the complete practical philosophy · 15 sections",
      "The work, social, philosophical, clinical, and investing ideas described in the videos.",
    );
  if (key === "reality")
    ref = fullReference(
      "reality",
      "Read the complete reality & universe reference · 15 sections",
      "Includes the full biology discussion, group claims, determinism, perception, consciousness, time, cosmology, biotechnology, and institutional narratives.",
    );
  const localToc = [...text.matchAll(/^### (.+)$/gm)]
    .map((m) => `<li><a href="#${key}-${slug(m[1])}">${esc(m[1])}</a></li>`)
    .join("");
  return `<article class="article main-chapter" id="${key}"><header class="article-head"><div class="chapter-kicker">${c.n} / ${c.label}</div><h2>${esc(c.title)}</h2><div class="article-meta"><span>Julius Perceiver · ideas and examples</span><span>${Math.ceil(text.split(/\s+/).length / 220)} min read</span><span><a href="#${key === "biology" ? "ref-reality" : key === "society" ? "ref-reality" : key === "relationships" ? "ref-applications" : key === "attraction" ? "ref-model" : key === "living" ? "ref-life" : "ref-reality"}">Extended reference ↓</a></span></div></header>${photo(c.image, c.caption)}<details class="chapter-contents"><summary>In this chapter · ${pieces.length - 1} topics</summary><ol>${localToc}</ol></details><div class="chapter-layout"><div class="prose chapter-prose${key === "reality" ? " has-dropcap" : ""}">${content}</div>${chapterAside(key, localToc)}</div>${ref}</article>`;
}

// Science: all 27 claim reviews and all 55 bibliography entries are retained.
const scienceSections = docs.science.split(/(?=^## )/m);
const scienceClaims = scienceSections.filter((s) => /^## S\d{2}\./.test(s));
const scienceNotes = JSON.parse(read("editorial/evidence-notes.json"));
if (scienceNotes.length !== scienceClaims.length)
  throw new Error("Evidence notes must cover all 27 propositions");
const evidenceRows = scienceClaims
  .map((s, i) => {
    const originalTitle = s.match(/^## (.+)/)[1];
    const id = anchorMap[`science#${slug(originalTitle)}`];
    const note = scienceNotes[i];
    return `<tr><td><a href="#${id}">S${String(i + 1).padStart(2, "0")}</a></td><td><a href="#${id}">${esc(note.title)}</a></td><td>${esc(note.topic)}</td><td><span class="evidence-tag research-method">${esc(note.method)}</span></td></tr>`;
  })
  .join("");
const scienceHTML = scienceClaims
  .map((s, i) => {
    const originalTitle = s.match(/^## (.+)/)[1];
    const id = anchorMap[`science#${slug(originalTitle)}`];
    const note = scienceNotes[i];
    const originalContent = s.replace(/^## [^\n]+\n+/, "");
    const firstParagraph = originalContent.split(/\n\s*\n/)[0];
    const proposition = firstParagraph
      .replace(/\*\*(?:Julius’s claim|Claim)\.\*\*/, "**Proposition.**")
      .replace(/\bsupposedly\s+/g, "")
      .replace(/ \[V183 · 2026-07-24 · 00:00\]\([^)]+\)/, "");
    const reading = `${proposition}\n\n**Findings.** ${note.findings}\n\n**Study scope.** ${note.scope}`;
    return `<details id="${id}" class="details-box evidence-claim" data-category="${note.category}" data-search-unit data-search-title="S${String(i + 1).padStart(2, "0")} · ${esc(note.title)}" data-search-label="Research notes" data-search-weight="5"><summary><span class="claim-id">S${String(i + 1).padStart(2, "0")}</span><span><span class="claim-name">${esc(note.title)}</span><span class="claim-outcome">${esc(note.method)}</span></span></summary><div class="details-content claim-body"><div class="evidence-reading">${md(reading, "science")}</div><details class="original-review" id="original-science-s${String(i + 1).padStart(2, "0")}"><summary>Original review file<small>Source document</small></summary><div class="original-review-body"><p>The complete review is preserved in its original file.</p><p class="source-trail"><a href="original/SCIENCE/Scientific_Evidence_Review.md">Read the unchanged review file ${externalArrow}</a></p></div></details></div></details>`;
  })
  .join("");
const scienceScope = scienceSections.find((s) => s.startsWith("## Scope"));
const scienceOpen = scienceSections.find((s) => s.startsWith("## Priority"));
const scienceBib = scienceSections.find((s) => s.startsWith("## Bibliography"));
const publicationRows = [
  ["FDA reviews", 38, 74],
  ["Journal publications", 48, 51],
]
  .map(([label, positive, total]) => {
    const percent = Math.round((positive / total) * 100);
    return `<div class="publication-row"><span>${label} <small>${positive} of ${total} trials</small></span><strong>${percent}%</strong></div>`;
  })
  .join("");
const publicationFigure = `<figure class="publication-comparison" aria-labelledby="publication-comparison-title"><figcaption id="publication-comparison-title">How often trials looked positive</figcaption><div class="publication-pair">${publicationRows}</div><p>Share of trials classified or presented as positive in Turner’s comparison. <a href="https://doi.org/10.1056/NEJMsa065779" target="_blank" rel="noopener noreferrer">Turner et al., 2008</a></p></figure>`;
const studyReading = removeLead(read("editorial/study-reading.md")).trim().split(/\n\s*\n/);
const studyBody = studyReading.map((section, i) =>
  md(section, "study-reading") + (i === 0 ? publicationFigure : ""),
).join("");
const studyGuide = searchWrap(
  "how-to-read-a-study",
  "How to read a study skeptically",
  "Research methods",
  `<div class="prose study-guide"><h3><em>How to read a study skeptically</em></h3>${photo("library", "The published record is the part readers can see. Illustrative photograph.", "study-reading-art")}${numberedReadingNotes(studyBody)}<p class="source-trail"><a href="#ref-science-s16-antidepressants-publication-bias-does-not-mean-zero-efficacy">Research note on antidepressant trials and publication bias</a></p></div>`,
  6,
);
const evidence = `<article class="article main-chapter" id="evidence"><header class="article-head"><div class="chapter-kicker">07 / Claims & evidence</div><h2>Claims, evidence & unresolved questions</h2><div class="article-meta"><span>27 priority propositions</span><span>55 linked references</span><span>Review supplied with the original atlas · 1 November 2026</span></div></header>${photo("laboratory", "Research notes connect the source propositions with the studies cited in the supplied atlas. Illustrative photograph.")}<div class="prose"><p>These 27 propositions connect the channel’s ideas with the studies and theoretical references cited in the supplied atlas. Each entry separates the reported findings from the population, research design, and outcome those findings concern.</p><p>The notes summarize the supplied review, completed 1 November 2026. They are not a new systematic review or a fresh verification of its 55 references. The original review, including its interpretations and conclusions, remains available inside each entry.</p></div>${studyGuide}<details class="details-box" id="ref-science"><summary>Review scope, methods & standards</summary><div class="details-content reference-prose">${md(scienceScope, "science")}</div></details><details class="details-box"><summary>Research questions at a glance<small>Comparison table</small></summary><div class="details-content"><div class="table-wrap" tabindex="0" role="region" aria-label="Research designs and questions"><table class="evidence-table"><thead><tr><th>ID</th><th>Question</th><th>Topic</th><th>Design and scope</th></tr></thead><tbody>${evidenceRows}</tbody></table></div></div></details><div class="filter-row" aria-label="Filter evidence reviews"><button class="filter-button" data-evidence-filter="all" aria-pressed="true">All claims</button><button class="filter-button" data-evidence-filter="research" aria-pressed="false">Empirical research</button><button class="filter-button" data-evidence-filter="methods" aria-pressed="false">Research methods</button><button class="filter-button" data-evidence-filter="theory" aria-pressed="false">Theory & models</button><button class="filter-button" data-evidence-filter="unreviewed" aria-pressed="false">Direct evidence not reviewed</button></div><div class="control-row"><span id="evidence-count" aria-live="polite">27 of 27 research notes</span><button class="text-button" id="expand-evidence">Open visible notes</button></div>${scienceHTML}<details class="details-box" id="unchecked-claims"><summary>What the review leaves unresolved</summary><div class="details-content reference-prose">${md(scienceOpen, "science")}</div></details><details class="details-box" id="bibliography"><summary>The scientific bibliography<small>55 sources & access records</small></summary><div class="details-content reference-prose">${md(scienceBib, "science")}</div></details></article>`;

// Original diagrams remain standalone, with the complete edge ledger beside them.
const diagramTitles = [
  "Attraction: proposed causal architecture",
  "Attraction and relationship stages",
  "Signals, effort, and naturalness",
  "The overall worldview",
  "Determinism, meaning, and the universe",
  "Evidence and uncertainty",
  "Genetics and environment: competing pathways",
];
const diagramNotes = [
  "Separates sexual attraction, practical relationship value, and observed pursuit.",
  "Shows why staying, leaving, and continued desire are distinct outcomes.",
  "Distinguishes genuine options from behavior intended to signal options.",
  "Maps the conceptual connections across biology, society, and practical life.",
  "Connects philosophical positions without treating them as settled physical laws.",
  "Separates empirical support, speculation, and unsupported inference.",
  "Illustrates alternative causal routes; it is not a fitted causal study.",
];
const gallery = svgNames
  .map((n, i) => {
    const full = "assets/diagrams/" + n,
      url = "assets/overviews/d0" + (i + 1) + ".svg";
    return `<figure class="diagram-card" id="diagram-d0${i + 1}"><a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${url}" width="1080" height="795" alt="${esc(diagramTitles[i] + ". " + diagramNotes[i])}" loading="lazy" decoding="async"></a><figcaption><span class="kicker">D0${i + 1}</span><b>${diagramTitles[i]}</b><small>${diagramNotes[i]}</small><div class="diagram-actions"><button data-diagram="${url}" data-title="${esc(diagramTitles[i])}" data-caption="${esc(diagramNotes[i] + " Arrows denote proposed links, not estimated effects. Read the provenance ledger for each edge.")}">Enlarge overview ${externalArrow}</button><button data-diagram="${full}" data-title="${esc(diagramTitles[i])} / Complete causal map" data-caption="All original nodes, directed links, edge identifiers, and statuses are retained in this full map.">Complete causal map ${externalArrow}</button><a href="original/DIAGRAMS/${n.replace(".svg", ".mmd")}">Original Mermaid</a><a href="original/DIAGRAMS/${n}">Original figure</a><a href="assets/diagrams/${n.replace(".svg", ".json")}">Link data</a><a href="#ref-diagrams">Source & edge ledger</a></div></figcaption></figure>`;
  })
  .join("");
const diagrams = `<article class="article main-chapter" id="diagrams"><header class="article-head"><div class="chapter-kicker">08 / Visual explanations</div><h2>Visual explanations</h2><div class="article-meta"><span>7 supplied diagrams</span><span>77 links with provenance records</span><span>Redesigned figures · original links preserved</span></div></header><div class="prose"><p>Readable overviews introduce each subject. Open a complete causal map for all original nodes, directed links, and edge identifiers. All 77 original links are retained in those full maps. The source ledger records assertions, editorial connections, and evidence assessments; original figures remain available for comparison.</p></div><div class="diagram-legend" aria-label="Diagram legend"><span><i></i>Expressed account</span><span><i class="inferred"></i>Inferred / competing pathway</span><span><i class="evaluated"></i>Evaluated support</span><span><i class="contradicted"></i>Contradicted inference</span></div><div class="diagram-gallery">${gallery}</div>${fullReference("diagrams", "How to read the figures & trace all 77 arrows", "All original figure explanations, source trails, and edge-level statuses are retained. The figure files are also preserved in their original formats.")}</article>`;

// Chronology and all 16 tensions remain readable without forcing a final doctrine.
const tensionSections = docs.tensions.split(/(?=^### T\d\d\.)/m);
const tensionEntries = tensionSections.filter((s) => /^### T\d\d\./.test(s));
const tensionLast = tensionEntries.length - 1;
const tailMatch = tensionEntries[tensionLast].search(/^## 3\./m);
const tensionTail = tensionEntries[tensionLast].slice(tailMatch);
tensionEntries[tensionLast] = tensionEntries[tensionLast].slice(0, tailMatch);
const tensionItems = tensionEntries
  .map((s) => {
    const title = s.match(/^### (.+)/)[1],
      id = anchorMap[`tensions#${slug(title)}`];
    const body = s
      .replace(/^### [^\n]+\n+/, "")
      .split("**Assessment:**")[0]
      .replace("; he enjoys humor and wholesome personality in app reviews", "")
      .replace(/ \[V130 · 2026-05-21 · 10:23\]\([^)]+\)/, "")
      .replace(
        "The Emiliana account says being too alpha can cause insecurity and withdrawal.",
        "Competition anxiety can wear down a relationship even while desire persists.",
      );
    return `<details class="details-box" id="${id}" data-search-unit data-search-title="${esc(title)}" data-search-label="Development & tensions" data-search-weight="3"><summary>${esc(title.replace(/ versus /g, " and "))}</summary><div class="details-content reference-prose">${md(body, "tensions")}</div></details>`;
  })
  .join("");
const periods = [
  [
    "2022",
    "Perception, biology, and popular science",
    "Appearance, replication, cooperation, and free will broaden into genetics, time, cosmology, and biotechnology.",
  ],
  [
    "2023–2025",
    "Inequality, power, and strategy",
    "Mimetic desire, institutions, markets, conflict, cosmetic intervention, and preselection become more prominent.",
  ],
  [
    "April–July 2026",
    "A more conditional relationship model",
    "Relative desirability, attachment, practical care, heritability snowballing, and recurring personal relationship accounts receive extended treatment.",
  ],
  [
    "August–October 2026",
    "Purpose, humility, and diminishing returns",
    "Logistical attraction, genuine busyness, purpose, humility, and acceptance become prominent alongside further discussions of genetics, AI, and markets.",
  ],
];
const tensions = `<article class="article main-chapter" id="tensions"><header class="article-head"><div class="chapter-kicker">09 / Development & open questions</div><h2>Development of the ideas</h2><div class="article-meta"><span>2022–2026 publication history</span><span>16 topic comparisons</span></div></header>${photo("stairs", "The chronology follows the publication dates in the supplied video catalog.")}<div class="prose"><p>Follow the topics across their publication history: early explanations of appearance and replication, later relationship accounts, and the growing emphasis on purpose, humility, and outcome independence.</p></div><div class="timeline">${periods.map(([date, title, body]) => `<div class="timeline-item"><time>${date}</time><b>${title}</b><p>${body}</p></div>`).join("")}</div><details class="details-box" id="ref-tensions"><summary>Detailed chronology & publication-date limits</summary><div class="details-content reference-prose">${md(removeLead(read("editorial/chronology.md")), "tensions")}</div></details>${tensionItems}<details class="details-box"><summary>Repeated narratives, chronology traps & historical anchors</summary><div class="details-content reference-prose">${md(read("editorial/chronology-tail.md"), "tensions")}</div></details></article>`;

// Glossary and question register, retaining every definition and answer.
const glossarySection = docs.reference
  .split("## Glossary")[1]
  .split("## Questions a reader is likely to ask")[0];
const originalGlossaryRows = glossarySection
  .split("\n")
  .filter(
    (l) =>
      l.startsWith("|") && !l.startsWith("|---") && !l.startsWith("| Term"),
  );
const originalAliases = {
  "Female / male gaze": ["female gaze", "male gaze"],
  "Female choice": ["female choice", "female-choice hypothesis"],
  Compensation: ["compensation", "compensation hypothesis"],
  "Boyfriend / girlfriend baiting": ["boyfriend baiting", "girlfriend baiting"],
  IOI: [
    "IOI",
    "indication of interest",
    "indications of interest",
    "indicator of interest",
  ],
  ROI: ["ROI", "return on investment"],
  SMV: ["SMV", "sexual market value"],
  Looksmaxxing: ["looksmaxxing", "looksmaxing"],
  "Gene fraud": ["gene fraud", "gene frauding", "gene frauds"],
  "PSL / harmony": ["PSL", "harmony", "harmony gamble"],
  "Boltzmann brain": ["Boltzmann brain", "Boltzmann brains"],
  "Thermal time": ["thermal time", "thermal-time hypothesis"],
  "Tit-for-tat": ["tit-for-tat", "tit for tat"],
};
const glossaryCopy = JSON.parse(read("editorial/glossary-copy.json"));
const glossaryRows = originalGlossaryRows
  .map((line) => {
    const columns = line
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((part) => part.trim());
    return {
      term: columns[0],
      definition: glossaryCopy[columns[0]] || columns[1],
      sources: columns[2] || "",
      aliases: originalAliases[columns[0]] || columns[0].split(" / "),
      origin: "original",
    };
  })
  .concat(
    addedTerms.map((term) => ({
      ...term,
      origin: "added",
      sources:
        term.videos
          .map((ordinal) => {
            const v = sourceVideos.find((video) => video.ordinal === ordinal);
            if (!v) throw new Error(`Missing glossary video ${ordinal}`);
            const time = term.timestamps?.[ordinal] ?? 0;
            if (!Number.isInteger(time) || time < 0)
              throw new Error(`Invalid glossary timestamp for ${term.term}`);
            const minutes = String(Math.floor(time / 60)).padStart(2, "0");
            const seconds = String(time % 60).padStart(2, "0");
            return `[V${String(ordinal).padStart(3, "0")} · ${v.published_at_utc.slice(0, 10)} · ${minutes}:${seconds}](${v.video_url}&t=${time}s)`;
          })
          .join(" ") + ` · [Read the explanation](#${term.chapter})`,
    })),
  );
const glossaryList = glossaryRows
  .map(
    (term) =>
      `<div class="glossary-item" id="term-${slug(term.term)}" data-glossary-origin="${term.origin}" data-term-aliases="${esc(JSON.stringify(term.aliases))}" data-search-unit data-search-title="${esc(term.term)}" data-search-label="Glossary" data-search-weight="8"><dt>${esc(term.term)}</dt><dd>${md(term.definition, "reference")}<span class="term-sources">${md(term.sources, "reference")}</span></dd></div>`,
  )
  .join("");

const questionBlock = docs.reference
  .split("## Questions a reader is likely to ask")[1]
  .split("## Source coverage index: all 202 videos")[0];
const readerQuestions = JSON.parse(read("editorial/reader-questions.json"));
const faq = questionBlock
  .split(/(?=^### Q\d\d\.)/m)
  .filter((s) => /^### Q\d\d\./.test(s))
  .map((s) => {
    const originalTitle = s.match(/^### (.+)/)[1],
      num = Number(originalTitle.slice(1, 3)),
      title = readerQuestions[num - 1].title,
      id = anchorMap[`reference#${slug(originalTitle)}`];
    return `<details class="details-box faq" id="${id}" data-search-unit data-search-title="${esc(title)}" data-search-label="Reader questions" data-search-weight="4"><summary>${esc(title)}</summary><div class="details-content">${md(readerQuestions[num - 1].answer, "reference")}</div></details>`;
  })
  .join("");
const glossary = `<article class="article main-chapter" id="glossary"><header class="article-head"><div class="chapter-kicker">10 / Terms & reader questions</div><h2>A vocabulary for the ideas.</h2><div class="article-meta"><span>${glossaryRows.length} terms</span><span>34 questions & answers</span><span>55 original terms · ${addedTerms.length} additional explanations</span></div></header><div class="prose"><p>The glossary explains research terms, internet vocabulary, and channel-specific metaphors in the sense used throughout these chapters. Follow a definition to its related discussion or source video.</p></div><div class="glossary-controls"><label for="glossary-query">Find a term<input id="glossary-query" type="search" placeholder="For example: congruence, SMV, thermal time" autocomplete="off"></label></div><p class="source-count" id="glossary-count" aria-live="polite">${glossaryRows.length} of ${glossaryRows.length} terms</p><dl class="glossary-list" id="ref-reference">${glossaryList}</dl><div class="section-heading" style="margin-top:45px"><h3>Questions worth asking</h3><p>Source-linked explanations</p></div>${faq}<details class="details-box"><summary>Original concept-to-chapter navigation</summary><div class="details-content reference-prose">${md(removeLead(docs.reference.split("## Glossary")[0]), "reference")}</div></details></article>`;

// The supplied source sections and reviewed additions share one source explorer.
const smvCorrectionVideos = new Set(["ij3aM-RTNdw", "1KoH_FVACWw", "Ox2tc6MVVrY"]);
const sourceCards = sourceVideos
  .map((v, i) => {
    const label = `V${String(v.ordinal).padStart(3, "0")}`,
      id = `source-${label.toLowerCase()}`;
    // Apply creator corrections to the display copy. The imported source stays intact.
    const originalSection = sourceSections[i];
    const correctedSmv = smvCorrectionVideos.has(v.video_id)
      ? originalSection.replace(/\bSMB(s?)\b/g, "SMV$1")
      : originalSection;
    const section = correctedSmv
      .replace(/\bpolygamist\b/gi, "polygynous")
      .replace(
        /Julius agrees about “polygynous,” questions why the screen said “polygamous,” and says viewers do not want to be polygamous\. He then says “polygamous with an N,” apparently calling the wording a small mistake\./,
        "Julius clarifies that the intended term is polygynous and points out the wording error on screen.",
      );
    const context = [];
    if (/\bhinge\b/i.test(v.title))
      context.push(
        "Julius describes the Hinge series as satire about the gap between stated preferences and choices driven by looks. The remarks about eugenics are part of that comic framing.",
      );
    if (v.ordinal === 127)
      context.push(
        "Julius later clarified that he stopped responding and Emiliana kept seeking contact.",
      );
    if (correctedSmv !== originalSection)
      context.push(
        "The display corrects the transcription of SMV, which means sexual market value.",
      );
    const contextHtml = context
      .map((note) => `<p class="reference-intro">${esc(note)}</p>`)
      .join("");
    const opening =
      section.match(/(?:^|\n)(?:- )?\[\d\d:\d\d:\d\d\] ([^\n]+)/)?.[1] || "";
    const preview =
      opening.length > 650
        ? opening.slice(0, opening.lastIndexOf(" ", 650)) + "…"
        : opening;
    const rawId = `${id}-text`;
    let raw = section.replace(/^# [^\n]+\n+/, "").replace(/^---\s*$/gm, "");
    raw = raw.replace(/^### (.+)$/gm, "#### $1");
    raw = raw.replace(
      /\[(\d\d):(\d\d):(\d\d)\](?!\()/g,
      (_, h, m, s) =>
        `[${h}:${m}:${s}](${v.video_url}&t=${Number(h) * 3600 + Number(m) * 60 + Number(s)}s)`,
    );
    const rawHtml = md(raw, id);
    const words = Number(v.consolidated_words).toLocaleString("en-US");
    const detail = v.update
      ? `${words} reviewed words · ${v.update.channel === "main" ? "Main channel" : "Raw channel"} · ${v.update.provenance}`
      : `${words} catalogued consolidated words · ${v.groups} groups`;
    return `<details class="details-box source-entry" id="${id}" data-year="${v.published_at_utc.slice(0, 4)}"><summary><span class="claim-id">${label}</span><span class="source-title">${esc(v.title)}</span><time datetime="${v.published_at_utc.slice(0, 10)}">${v.published_at_utc.slice(0, 10)}</time></summary><div class="details-content">${contextHtml}<div class="source-summary"><p class="source-preview-label">${v.update ? "Opening of the reviewed transcript notes" : "Opening of the consolidated transcript"}</p><p>${esc(preview)}</p></div><p class="source-trail"><a href="${esc(v.video_url)}" target="_blank" rel="noopener noreferrer">Open original video ${externalArrow}</a><span>${detail}</span></p><details class="raw-source" id="${rawId}" data-search-unit data-search-title="${esc(label + " · " + v.title)}" data-search-label="${v.update ? "Reviewed transcript notes" : "Consolidated YouTube transcript"}" data-search-weight="0"><summary>${v.update ? "Read the reviewed transcript notes" : "Read the consolidated video transcript"}</summary><div class="raw-content">${rawHtml}</div></details></div></details>`;
  })
  .join("");
// Redirect the original source-index section headings into the searchable source explorer.
for (const [k, v] of Object.entries(anchorMap))
  if (k.startsWith("reference#v")) {
    const num = k.match(/^reference#v(\d{3})/)[1];
    anchorMap[k] = `source-v${num}`;
  }
const sources = `<article class="article main-chapter" id="sources"><header class="article-head"><div class="chapter-kicker">11 / YouTube transcript archive</div><h2>Follow an idea to its source.</h2><div class="article-meta"><span>${sourceCount} ${sourceNoun}</span><span>${sourceDateRange}</span><span>${updateCount ? "Supplied consolidation and reviewed additions" : "Complete supplied consolidation"}</span></div></header><div class="prose"><p>The original ${baselineSourceCount} videos have their supplied transcript consolidations, coverage notes, and timestamp links. Search includes the indexed text of each source entry.</p>${updateCount ? `<p>Later additions provide reviewed, timestamped notes and name the source of the timed transcript.</p>` : ""}<p>The audit records 516,553 original transcript words and 202 of 202 required videos. The included knowledgebase is the transcript-derived consolidation, with approximately 296,000 words; the original raw transcript files are not bundled in this export. Repeated clips, recurring stories, and incomplete fragments retain their original coverage notes.</p></div><div class="source-controls"><label for="source-query">Search the video transcripts<input type="search" id="source-query" placeholder="Search a topic, phrase, or V-number" autocomplete="off"></label><label for="source-year">Publication year<select id="source-year"><option value="all">All years</option>${sourceYears.map((y) => `<option>${y}</option>`).join("")}</select></label></div><div class="control-row"><span id="source-count" aria-live="polite" data-source-noun="${sourceNoun}" data-source-detail="${sourceCountDetail}">${sourceCount} of ${sourceCount} ${sourceNoun} · ${sourceCountDetail}</span><button class="text-button" id="clear-source-filter">Clear filters</button></div><div id="source-list">${sourceCards}</div></article>`;

const methodSteps = [
  [
    "Preserve the source",
    "Keep the supplied corpus, catalog, audit, and original atlas unchanged. Trace a statement to a video and timestamp; distinguish speech, inserted clips, and editorial reconstruction.",
  ],
  [
    "State the proposition",
    "Separate an observation from an explanation, a prediction from a recommendation, and an empirical claim from a personal value. Specify the population and outcome.",
  ],
  [
    "Ask what would test it",
    "Use a prospective definition, identify a comparison, and ask what observation could count against the explanation. A retrospective story alone does not identify causation.",
  ],
  [
    "Compare explanations",
    "Consider selection, confounding, reverse causation, measurement, context, and chance. Repetition is not replication, and a plausible motive is not an observed motive.",
  ],
  [
    "Calibrate the conclusion",
    "Report what the evidence supports, what it contradicts as stated, and what remains unexamined. Keep philosophical and moral questions distinct from effect estimates.",
  ],
];
const method = `<article class="article main-chapter" id="methods"><header class="article-head"><div class="chapter-kicker">12 / Provenance & scientific process</div><h2>How this atlas was assembled</h2><div class="article-meta"><span>Source fidelity</span><span>Explicit uncertainty</span><span>Revisable conclusions</span></div></header><div class="prose"><p>This site is an editorial reading edition of the supplied <em>Julius Perceiver — Worldview and Scientific Atlas</em>. It brings transcript-derived explanations, personal examples, philosophical arguments, and research notes into one connected reference.</p><p>The reading chapters explain the ideas through mechanisms, vocabulary, and concrete examples. The extended references develop the topics further. The original atlas documents, including their review commentary, remain available separately. All original files are also preserved byte-for-byte in the downloadable project.</p></div><section id="extraction-workflow" data-search-unit data-search-title="Transcript extraction and consolidation workflow" data-search-label="Project provenance" data-search-weight="5"><div class="prose"><h3>The transcript-to-atlas workflow</h3><p>The project began with YouTube video transcripts. The supplied audit records all 202 required videos, 516,553 original transcript words, and an extraction index under GPT‑6.1 Terra. The project owner describes the extracted knowledge being passed to GPT‑6.1 Sol for further consolidation and organization.</p></div><div class="method-grid"><div><b>1. Video transcripts</b><p>202 of 202 videos in the supplied index. Original-source word total: 516,553.</p></div><div><b>2. GPT‑6.1 Terra</b><p>Transcript-derived knowledge extraction. The supplied audit identifies a gpt-6.1-terra origin index.</p></div><div><b>3. GPT‑6.1 Sol</b><p>Further consolidation and organization, as described by the project owner. The supplied export does not independently log this later model stage.</p></div><div><b>4. This reading edition</b><p>Topic-centered navigation, visual presentation, and easier access to the full consolidated text. Original archive files remain unchanged.</p></div></div><p class="reference-intro">The compact knowledgebase has 296,272 whitespace-delimited words; the per-video catalog sums to 290,805 consolidated words under a different counting convention. These totals describe representations of the same collection. The audit verifies the earlier export’s mechanical preservation, not a scientific verdict on every claim or a record of every downstream model call.</p></section><div class="method-grid"><div><b>Source account</b><p>What the collection explicitly proposes or reports. This includes beliefs, personal narratives, numerical heuristics, and claims that are not independently established.</p></div><div><b>Editorial interpretation</b><p>Connections between ideas, distinctions between outcomes, and inferred pathways. A synthesis is identified as a synthesis rather than presented as a direct quotation.</p></div><div><b>Evidence assessment</b><p>The research notes connect 27 propositions with 55 scientific, theoretical, and official references, reporting findings and study scope.</p></div><div><b>Values & philosophy</b><p>Questions about meaning, dignity, virtue, purpose, and preferred relationships require arguments beyond a measured association or evolutionary hypothesis.</p></div></div><div class="prose"><h3>The inquiry in five steps</h3></div>${methodSteps.map(([t, b], i) => `<div class="method-step"><span>0${i + 1}</span><div><b>${t}</b><p>${b}</p></div></div>`).join("")}<div class="callout"><div class="kicker">What this edition does not independently establish</div><p>The original full videos were not independently watched for this redesign. The supplied science review is targeted, not systematic, and has not been rerun here.</p><small>Coverage notes retain weak fragments, duplicate material, failed original-page retrieval, unchecked scientific claims, and unverified personal accounts. No missing argument is inferred from a title.</small></div><div class="control-row"><span>Longer reference chapters are expandable throughout the page.</span><button class="text-button" id="expand-reference">Open extended references</button></div>${fullReference("coverage", "Complete coverage & limitations", "The original scope notes distinguish what was supplied, examined, retrieved, and left unresolved.")}${fullReference("start", "Original atlas introduction & reading routes", "The original introduction records its scope and the three-layer provenance scheme.")}${fullReference("quality", "Original quality & integrity record", "These are the checks reported by the original supplied atlas. The new website’s validation is recorded separately in EDITORIAL_NOTES.md.")}<div class="source-trail"><a href="original/SOURCE_CORPUS/JULIUS_KNOWLEDGEBASE.md">Unchanged consolidated corpus</a><a href="original/SOURCE_CORPUS/CATALOG.json">Source catalog</a><a href="original/SOURCE_CORPUS/AUDIT.json">Original corpus audit</a><a href="EDITORIAL_NOTES.md">Reading-edition notes</a><a href="preservation-report.json">Preservation checks</a><a href="source-grounding-report.json">Reading-source audit</a><a href="editorial/source-grounding.json">Paragraph source pointers</a><a href="diagram-redesign-report.json">Diagram redraw record</a></div></article>`;

const creditHTML = `<article class="article main-chapter" id="image-credits"><header class="article-head"><div class="chapter-kicker">13 / Images & attribution</div><h2>Images & credits</h2><div class="article-meta"><span>16 photographs · 3 generated artworks</span><span>7 original explanatory diagrams</span></div></header><div class="prose"><p>Photographs and editorial artwork provide visual context. They are not evidence for the claims nearby. The marble images and subtle forest background are generated illustrations, and pictured people are not participants in the source narratives. Credits, source pages, and image changes are recorded below.</p></div><div class="photo-grid">${photoList.map((p) => `<figure class="photo-credit" id="photo-${p.id}"><img src="${p.thumbnail}" width="600" height="400" loading="lazy" decoding="async" alt="${esc(p.alt)}"><figcaption><b>${esc(p.creator)}</b>${esc(p.alt)}<small>${esc(p.license)}</small><a href="${p.source}" target="_blank" rel="noopener noreferrer">${["marble-bust", "reflections", "night-road"].includes(p.id) ? "Artwork notes" : "Source photograph"} ${externalArrow}</a> · <a href="${p.license_url}" target="_blank" rel="noopener noreferrer">Use guidance</a><small>${esc(p.changes)}</small></figcaption></figure>`).join("")}</div><p class="font-credits">Typography uses self-hosted Cormorant Garamond for headings, Literata for long reading, and Source Sans 3 for navigation. <a href="assets/fonts/cormorantgaramond-OFL.txt">Cormorant license</a> · <a href="assets/fonts/literata-OFL.txt">Literata license</a> · <a href="assets/fonts/sourcesans3-OFL.txt">Source Sans license</a>. The code is available at <a href="${esc(site.repository)}" target="_blank" rel="noopener noreferrer">ainonai/perceived</a>.</p></article>`;

const nav = [
  ["top", "00", "Perceived"],
  ["about-julius", "↳", "Who is Julius?"],
  ["idea-space", "◈", "Idea space"],
  ...Object.entries(editorialMap).map(([k, c]) => [k, c.n, c.label]),
  ["evidence", "07", "Claims & evidence"],
  ["diagrams", "08", "Visual explanations"],
  ["tensions", "09", "Development of the ideas"],
  ["glossary", "10", "Terms & questions"],
  ["sources", "11", "Video transcripts"],
  ["methods", "12", "Methods & provenance"],
  ["image-credits", "13", "Image credits"],
];
const cardDescriptions = {
  biology:
    "Inheritance, heritability, development, and the settings people help create.",
  attraction:
    "Appearance, relative desirability, sexual selection, and social signals.",
  relationships:
    "Care, attachment, independence, commitment, and competing outcomes.",
  living:
    "Congruence, effort, reciprocity, ambition, and the limits of control.",
  reality:
    "Free will, perception, consciousness, time, entropy, and cosmic futures.",
  society:
    "Institutions, information, incentives, AI, and technological forecasts.",
};
const cards = Object.entries(editorialMap)
  .map(
    ([k, c]) =>
      `<a class="topic-card" href="#${k}"><span class="topic-visual"><img ${photoAttributes(photos[c.image], "(max-width: 640px) calc((100vw - 60px)/2), (max-width: 960px) calc((100vw - 90px)/3), calc((100vw - 440px)/3)")} width="600" height="400" alt="" loading="lazy" decoding="async"></span><span class="kicker">${c.n} / ${c.label}</span><h3>${c.title}</h3><p>${cardDescriptions[k]}</p><span class="arrow">Explore the chapter ${externalArrow}</span></a>`,
  )
  .join("");
const intro = `<section class="hero main-chapter" id="top"><div class="hero-topline"><span class="eyebrow">A reading archive of Julius Perceiver</span><span class="edition-tag">Reading edition · ${site.edition}</span></div><div class="hero-grid"><div class="hero-copy"><p class="hero-author">The ideas of <a href="#about-julius">Julius Perceiver</a></p><h1>${esc(site.name)}</h1><p class="hero-deck">A connected exploration of attraction, inheritance, ambition, society, and physical reality, drawn from his YouTube video transcripts.</p><a class="primary-link" href="#explore">Explore the topics ${icon("arrow")}</a><p class="hero-context"><a href="#idea-space">Enter the idea space ${externalArrow}</a> · <a href="#about-julius">Who is Julius Perceiver?</a></p></div><figure class="hero-art"><img src="${photos["marble-bust"].file}" alt="${esc(photos["marble-bust"].alt)}" width="${photos["marble-bust"].width}" height="${photos["marble-bust"].height}" fetchpriority="high"><a class="image-credit" href="#photo-marble-bust">Editorial artwork / credit ${externalArrow}</a></figure></div><div class="hero-stats"><div><b>${sourceCount}</b><span>${sourceNoun}<br>${updateCount ? "transcripts & reviewed notes" : "consolidated & indexed"}</span></div><div><b>27</b><span>priority claims<br>examined separately</span></div><div><b>55</b><span>scientific & official<br>reference entries</span></div><div><b>7</b><span>explanatory diagrams<br>with provenance</span></div></div><p class="intro-note">A topic-centered reading edition of the supplied Julius Perceiver atlas. The collection’s ideas, editorial interpretation, and scientific assessment remain distinguishable. <a href="#methods">About the method ${externalArrow}</a></p><aside class="preservation-note"><span class="archive-icon" aria-hidden="true">▤</span><div><span class="tiny-label">Full consolidation preserved</span><b>The complete original consolidation from ${baselineSourceCount} YouTube video transcripts.</b><p>516,553 original transcript words recorded in the audit. Approximately 296,000 words in the supplied consolidated text. All 40 original files remain unchanged alongside this reading edition.</p><div class="preservation-actions"><button data-full-reading aria-pressed="false">Open the complete reference</button><a href="#sources">Browse the video transcripts ${externalArrow}</a><a href="#extraction-workflow">Extraction & consolidation process ${externalArrow}</a></div></div></aside></section><section class="explore" id="explore"><div class="section-heading"><h2>Explore the ideas</h2><p>Six subjects, plus a way to read the evidence.</p></div><div class="topic-grid">${cards}</div><a class="explore-method" href="#how-to-read-a-study"><div><span class="eyebrow">07 / Claims & evidence</span><h3><em>How to read a study skeptically</em></h3><p>Follow Julius from the studies that reached print to the results left in the file drawer.</p><span class="explore-method-link">Read the feature ${externalArrow}</span></div><img src="${photos.laboratory.thumbnail || photos.laboratory.file}" alt="" width="1200" height="800" loading="lazy" decoding="async"></a><div class="method-strip"><div><span>01 / UNDERSTAND</span><b>The connected ideas</b><p>Follow how appearance, incentives, inherited dispositions, and everyday choices connect.</p></div><div><span>02 / INVESTIGATE</span><b>The scientific question</b><p>Separate what is observed, what is inferred, and what would distinguish competing explanations.</p></div><div><span>03 / TRACE</span><b>The original source</b><p>Inspect the full supplied text, timestamped citations, and limits of the available material.</p></div></div><div class="reading-paths"><span>Choose a reading route:</span><a href="#biology">The foundations →</a><a href="#evidence">The evidence →</a><a href="#glossary">A specific term →</a><a href="#sources">The video transcripts →</a></div><noscript><p class="no-js">All articles, references, and sources can be read without JavaScript. Native section links and expandable references still work. Search, filters, and appearance controls require JavaScript.</p></noscript></section>`;

const about = `<article class="article main-chapter about-card" id="about-julius"><header class="article-head"><div class="chapter-kicker">Context / The person behind the transcripts</div><h2>Who is Julius Perceiver?</h2><p class="section-deck">Background, influences, and the channels behind this collection.</p></header><div class="about-lead" data-search-unit data-search-title="Who is Julius Perceiver?" data-search-label="Background" data-search-weight="8"><img class="channel-avatar" src="assets/artwork/channel-avatar.png" width="160" height="160" loading="lazy" alt="Marble Caesar portrait used in the supplied Julius Perceiver channel avatar"><div><p>Julius Perceiver is an online commentator whose videos range from attraction and appearance to behavioral genetics, ambition, determinism, and cosmology. The recurring concern is how inherited traits, perceived alternatives, social incentives, and personal temperament shape experience.</p><p>The blackpill discussion supplies one point of entry: unequal starting conditions and the limits of effort in attraction. The broader material reaches into self-knowledge, purpose, technology, and the physical universe. Personal stories, scientific concepts, and philosophical arguments connect through these recurring questions.</p></div></div><div class="channel-grid"><a class="channel-link" href="${esc(site.mainChannel)}" target="_blank" rel="noopener noreferrer"><span>YOUTUBE / MAIN CHANNEL</span><b>Julius Perceiver ${externalArrow}</b><p>@JuliusPerceiver · Essays, commentary, and public videos.</p></a><a class="channel-link" href="${esc(site.rawChannel)}" target="_blank" rel="noopener noreferrer"><span>YOUTUBE / RAW CHANNEL</span><b>Julius Perceiver Raw ${externalArrow}</b><p>@juliusperceiverraw · Longer conversations and further commentary.</p></a></div><div class="about-facts"><div><span>${updateCount ? "ARCHIVE COVERAGE" : "SUPPLIED VIDEO CORPUS"}</span><b>${sourceCount} ${sourceNoun}</b></div><div><span>PUBLICATION WINDOW</span><b>${sourceMonthRange}</b></div><div><span>READING APPROACH</span><b>Concepts, mechanisms, evidence</b></div></div><div class="influence-grid"><div><b>Evolution & inheritance</b><p>Richard Dawkins and Robert Plomin: replication, heritability, and inherited dispositions.</p></div><div><b>Time & physical reality</b><p>Carlo Rovelli: perception, relativity, and the limits of everyday intuitions about time.</p></div><div><b>Desire & social influence</b><p>René Girard: imitation, mediated desire, and the influence of other people’s preferences.</p></div><div><b>Acceptance & inquiry</b><p>Stoicism and amor fati; Stuart Ritchie’s examination of scientific bias and weak inference.</p></div></div><p class="about-caption">These influences follow the books, authors, films, and philosophical ideas discussed across the supplied transcript collection. The publication dates describe this archive’s coverage.</p><figure class="reflection-scene"><img class="scene-back" src="${photos.reflections.file}" width="1774" height="887" loading="lazy" decoding="async" alt="${esc(photos.reflections.alt)}"><img class="scene-front" src="${photos.reflections.file}" width="1774" height="887" loading="lazy" decoding="async" alt="" aria-hidden="true"><figcaption><b>Appearance and social perception</b>Marble and a mirrored image, presented as editorial artwork. <a href="#photo-reflections">Artwork credit ${externalArrow}</a></figcaption></figure>${fullReference("profile", "Read the complete profile, influences & public self-presentation", "Life, work, intellectual influences, and personal examples, with links to the videos.")}</article>`;

let html = `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark">${pageMetadata(site)}<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">${JSON.parse(
  read("assets/fonts/preload.json"),
)
  .map(
    (file) =>
      `<link rel="preload" href="${file}" as="font" type="font/woff2" crossorigin>`,
  )
  .join(
    "",
  )}<link rel="stylesheet" href="assets/perceived.css"><script src="assets/reader.js" defer></script><script src="assets/map-labels.js" defer></script><script src="assets/idea-space.js" defer></script><script src="assets/vocabulary.js" defer></script></head><body><div class="atmosphere" aria-hidden="true"><div class="night-glow"></div></div><a class="skip" href="#main">Skip to content</a><header class="masthead"><a class="brand" href="#top"><span class="brand-mark"><img src="assets/mark.svg" width="36" height="43" alt=""></span><span><strong>${esc(site.name.toLowerCase())}</strong><small>${esc(site.subtitle)}</small></span></a><div class="header-actions"><a class="repository-link" href="${esc(site.repository)}" target="_blank" rel="noopener noreferrer" aria-label="View the Perceived repository on GitHub">${icon("github")}<span>Source code</span></a><button class="search-launch" data-open-search aria-label="Search Perceived">${icon("search")}<span>Search Perceived</span><kbd>⌘ K</kbd></button><button class="icon-button print-button" id="print-button" aria-label="Print the reading view">${icon("print")}</button><button class="icon-button menu-toggle" id="menu-button" aria-label="Show chapter navigation" aria-expanded="false" aria-controls="sidebar">${icon("menu")}</button></div><div class="progress-track" aria-hidden="true"><div class="progress-bar" id="reading-progress"></div></div></header><aside class="sidebar" id="sidebar"><p class="sidebar-label">In this archive</p><nav aria-label="Chapters">${nav.map(([id, n, t]) => `<a href="#${id}" aria-current="${id === "top"}"><span>${n}</span>${t}</a>`).join("")}</nav><div class="sidebar-rule"></div><div class="sidebar-note">Explore Julius Perceiver’s ideas, stories, and source videos.<a id="continue-reading" hidden>Continue reading →</a><a href="#methods">About this archive ${externalArrow}</a><a href="${esc(site.repository)}" target="_blank" rel="noopener noreferrer">Source code ${externalArrow}</a></div><p class="edition">Source publications · ${sourceYears[0]}–${sourceYears.at(-1)}<br>Original review · 1 November 2026</p></aside><main id="main">${intro}${about}${ideaSpace(sourceVideos)}<figure class="night-interlude"><img src="${photos["night-street"].file}" width="${photos["night-street"].width}" height="${photos["night-street"].height}" loading="lazy" decoding="async" alt="${esc(photos["night-street"].alt)}"><figcaption><b>Continue exploring.</b>Six connected subjects, with citations leading back to the original videos. <a href="#photo-night-street">Photograph / credit ${externalArrow}</a></figcaption></figure>${Object.keys(editorialMap).map(editorial).join("")}${evidence}${diagrams}${tensions}${glossary}${sources}${method}${creditHTML}<footer class="footer"><div><p class="footer-brand">${esc(site.name.toLowerCase())}</p><p>Source links identify where an idea appears, and the evidence review examines what follows from it. The original material is preserved alongside this reading edition.</p></div><div class="footer-source"><a class="footer-repository" href="${esc(site.repository)}" target="_blank" rel="noopener noreferrer">${icon("github")}ainonai/perceived ${externalArrow}</a><a href="#about-julius">About Julius Perceiver</a><a href="#top">Return to the beginning ↑</a></div></footer></main><div class="space-backdrop" id="space-backdrop" aria-hidden="true" hidden></div><section class="vocab-popover" id="vocab-popover" popover="auto" role="dialog" aria-labelledby="vocab-title"><button class="vocab-close" aria-label="Close definition">×</button><p class="kicker">Vocabulary</p><h3 id="vocab-title"></h3><p id="vocab-definition"></p><div class="vocab-links" id="vocab-links"></div></section><button class="back-top" id="back-top" aria-label="Back to the beginning">${icon("up")}</button><dialog class="dialog" id="search-dialog" aria-label="Search the complete archive"><div class="dialog-head">${icon("search")}<input class="search-input" id="global-query" type="search" autocomplete="off" placeholder="Search ideas, evidence, and sources…" aria-label="Search query"><button class="icon-button" id="close-search" aria-label="Close search">${icon("close")}</button></div><div class="search-results" id="search-results"></div><p class="search-footer" id="search-count" aria-live="polite">Everything stays on this device.</p></dialog><dialog class="dialog lightbox" id="diagram-dialog" aria-labelledby="diagram-title"><div class="dialog-head"><h2 id="diagram-title">Diagram</h2><button class="icon-button" id="close-diagram" aria-label="Close enlarged diagram">${icon("close")}</button></div><div class="diagram-toolbar" aria-label="Diagram zoom controls"><button id="diagram-fit">Fit</button><button id="diagram-native">100%</button><button id="diagram-out" aria-label="Zoom out">−</button><button id="diagram-in" aria-label="Zoom in">+</button><span id="diagram-zoom-label" aria-live="polite">Fit</span><small>Scroll to inspect at full size</small></div><div class="diagram-stage" id="diagram-stage"><img class="dialog-image" id="diagram-image" alt=""></div><div class="lightbox-caption"><p id="diagram-caption"></p><a id="diagram-original" target="_blank" rel="noopener noreferrer">Open full-size SVG ${externalArrow}</a></div></dialog><div id="status-message" role="status" aria-live="polite" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)"></div></body></html>`;

// Internal source-index links were generated before final routing; patch their exact heading IDs.
const sourceAnnotations = docs.reference
  .split("## Source coverage index: all 202 videos")[1]
  .split(/(?=^### V\d{3}\.)/m)
  .filter((s) => /^### V\d{3}\./.test(s));
for (const s of sourceAnnotations) {
  const title = s.match(/^### (.+)/)[1],
    old = `ref-reference-${slug(title)}`,
    n = title.match(/^V(\d{3})/)[1];
  html = html.replaceAll(`href="#${old}"`, `href="#source-v${n}"`);
}
write("index.html", html);
const mark =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 56"><path d="M12 50V8h13c16 0 16 24 0 24H12" fill="none" stroke="#ff252d" stroke-width="2.5"/><path d="M11 20q13-16 27 0-14 16-27 0Z" fill="none" stroke="#e9ded4" stroke-width="1.4"/><circle cx="25" cy="20" r="4" fill="#ff252d"/></svg>';
write("assets/mark.svg", mark);
write("assets/favicon.svg", mark);

write(
  "build-report.json",
  JSON.stringify(
    {
      editorialWords: Object.keys(editorialMap).reduce(
        (n, k) => n + read(`editorial/${k}.md`).split(/\s+/).length,
        0,
      ),
      videoTranscripts: sourceCount,
      evidenceReviews: scienceClaims.length,
      bibliographyEntries: 55,
      glossaryTerms: glossaryRows.length,
      preservedGlossaryTerms: originalGlossaryRows.length,
      addedGlossaryTerms: addedTerms.length,
      questions: 34,
      diagrams: svgNames.length,
      photographs: photoList.filter(
        (p) => !["marble-bust", "reflections", "night-road"].includes(p.id),
      ).length,
      generatedArtwork: 3,
      ideaSpaceNodes: JSON.parse(read("idea-space-data.json")).nodes.length,
      ideaSpaceLinks: JSON.parse(read("idea-space-data.json")).edges.length,
      htmlBytes: Buffer.byteLength(html),
    },
    null,
    2,
  ),
);
console.log(read("build-report.json"));
