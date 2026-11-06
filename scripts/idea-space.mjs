import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mapDetails, detailConnections } from "./map-details.mjs";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function ideaSpace(videos) {
  const groups = [
    [
      "biology",
      "Biology",
      580,
      210,
      "Inheritance, development, and the environments people partly select.",
      [20, 147, 199],
    ],
    [
      "attraction",
      "Attraction",
      1260,
      230,
      "Appearance, selection, social signals, and perceived alternatives.",
      [3, 104, 136],
    ],
    [
      "relationships",
      "Relationships",
      1470,
      690,
      "Desire, practical care, attachment, and continued commitment.",
      [83, 127, 190],
    ],
    [
      "living",
      "Success & purpose",
      1000,
      1040,
      "Congruence, deliberate effort, meaningful work, and acceptance.",
      [70, 149, 194],
    ],
    [
      "society",
      "Society & technology",
      340,
      940,
      "Institutions, attention, incentives, markets, and forecasts.",
      [8, 187, 201],
    ],
    [
      "reality",
      "Universe & mind",
      170,
      440,
      "Causation, agency, consciousness, time, and cosmic futures.",
      [7, 12, 18],
    ],
  ];
  const concepts = {
    biology: [
      [
        "inheritance",
        "Inherited traits",
        "Scientific concept",
        "Inherited differences contribute to variation in traits. Genetic influence, prediction, and inevitability are different propositions.",
        "biology",
        [20, 199],
      ],
      [
        "heritability",
        "Heritability",
        "Scientific concept",
        "A measure of variation in a specified population and environment. It is not an individual percentage or a guarantee of immutability.",
        "biology-heritability-is-a-population-measure",
        [20, 147],
      ],
      [
        "environment",
        "Environment",
        "Scientific concept",
        "Resources, exposure, institutions, practice, and other conditions can affect development. Explaining variation differs from testing an intervention.",
        "biology-dispositions-help-shape-experience",
        [23, 147],
      ],
      [
        "gene-environment",
        "Selection & feedback",
        "Causal question",
        "Dispositions can influence the experiences a person seeks or evokes. Those experiences can also change skills and opportunities.",
        "biology-dispositions-help-shape-experience",
        [128, 147, 201],
      ],
    ],
    attraction: [
      [
        "appearance",
        "Appearance & halo",
        "Research topic",
        "Physical cues influence initial appraisal. An overall impression can change how confidence, shyness, or personality is interpreted.",
        "attraction-appearance-and-the-halo-effect",
        [3, 63],
      ],
      [
        "female-choice",
        "Female choice",
        "Hypothesis & selection theory",
        "The female-choice hypothesis connects greater reproductive investment with selectivity. Cultural and economic conditions constrain how preferences are expressed.",
        "attraction-hypergamy-and-female-choice",
        [3, 136, 153],
      ],
      [
        "relative-value",
        "Relative desirability",
        "Proposed mechanism",
        "Perceived desirability is compared with oneself and available alternatives. Relative differences replace an absolute threshold in the qualified account.",
        "attraction-relative-desirability-and-alternatives",
        [104, 190],
      ],
      [
        "preselection",
        "Preselection",
        "Conditional research topic",
        "Apparent interest from others supplies social information. A desirability rating and a healthy established relationship remain different outcomes.",
        "attraction-preselection-and-social-proof",
        [74, 83, 160],
      ],
    ],
    relationships: [
      [
        "desire",
        "Sexual desire",
        "Relationship outcome",
        "Wanting a person erotically is distinct from remaining in a relationship. Desire can coexist with distrust or an unworkable arrangement.",
        "relationships-security-and-desire",
        [83, 127, 190],
      ],
      [
        "care",
        "Care & reliability",
        "Relationship factor",
        "Practical support and responsiveness can make a bond workable. The proposed compensation effect and the benefits of care require separate assessment.",
        "relationships-security-and-desire",
        [127, 190],
      ],
      [
        "attachment",
        "Attachment",
        "Relationship factor",
        "Emotional investment, prior connection, insecurity, and clinical attachment constructs are not interchangeable.",
        "relationships-personal-accounts-and-general-explanations",
        [106, 127],
      ],
      [
        "commitment",
        "Commitment & exit",
        "Relationship outcome",
        "A relationship can continue for several reasons or end despite attraction. Agreements, alternatives, and practical conditions matter to interpretation.",
        "relationships-compatibility-agreements-and-exit",
        [184, 185, 190],
      ],
    ],
    living: [
      [
        "congruence",
        "Congruence",
        "Practical philosophy",
        "A life organized around actual capacities, constraints, and values rather than an incompatible ideal. Fit can involve changing the setting as well as changing behavior.",
        "living-congruence-and-environmental-fit",
        [119, 149, 164],
      ],
      [
        "purpose",
        "Purpose",
        "Philosophy & personal value",
        "A sustained direction for action, including work, contribution, family, curiosity, and generational continuity. Biological function and personal calling are different questions.",
        "living-pleasure-purpose-and-continuity",
        [4, 175, 191],
      ],
      [
        "effort",
        "Practice & skill",
        "Learning process",
        "Persistence differs from repeating a routine. Feedback, revision, and experience can change performance even when stable dispositions also matter.",
        "living-persistence-and-learning",
        [70, 85, 126],
      ],
      [
        "acceptance",
        "Acceptance",
        "Practical philosophy",
        "Amor fati concerns accepting the conditions of a life. It can coexist with action when control is distinguished from a guaranteed result.",
        "living-action-and-acceptance",
        [129, 163, 194],
      ],
    ],
    society: [
      [
        "incentives",
        "Incentives",
        "Analytical concept",
        "Rewards and constraints can help explain behavior. A possible benefit is not unique evidence of an action or a private motive.",
        "society-information-and-public-narratives",
        [8, 52, 166],
      ],
      [
        "media",
        "Media & attention",
        "Feedback process",
        "Users select content and ranking systems shape available exposure. Selection and influence can operate together.",
        "society-social-media-and-feedback",
        [19, 201],
      ],
      [
        "markets",
        "Valuation & timing",
        "Decision framework",
        "Technical usefulness differs from investment valuation. An early correct thesis can still lose money while recognition is delayed.",
        "living-technology-valuation-and-timing",
        [67, 165, 188],
      ],
      [
        "ai",
        "AI & forecasts",
        "Dated technical claims",
        "Capability, adoption, imminent AGI, and market pricing are different predictions. A forecast needs an outcome and a timeline.",
        "society-ai-capability-and-valuation",
        [61, 187, 189],
      ],
    ],
    reality: [
      [
        "causation",
        "Causation",
        "Physical & philosophical question",
        "Decisions have prior conditions. The implications for ultimate authorship, responsibility, and social protection are philosophical questions as well as physical ones.",
        "reality-determinism-and-agency",
        [7, 194],
      ],
      [
        "agency",
        "Agency",
        "Philosophical question",
        "Uncaused choice, reasons-responsive behavior, deliberation, and predictability are different concepts. Randomness is not automatically authorship.",
        "reality-determinism-and-agency",
        [7, 194],
      ],
      [
        "time",
        "Time & entropy",
        "Physics & theory",
        "Signal travel time, simultaneity, thermodynamic irreversibility, and thermal time are separate ideas with different evidence.",
        "reality-relativity-and-the-distant-present",
        [12, 13],
      ],
      [
        "recurrence",
        "Cosmic recurrence",
        "Speculative extension",
        "Infinite duration alone does not establish repetition. Recurrence needs particular dynamics, while continuity of personal identity is an additional question.",
        "reality-entropy-heat-death-and-recurrence",
        [17, 18, 32, 68],
      ],
    ],
  };
  const nodes = [
    {
      id: "human",
      label: "Human experience",
      group: "center",
      kind: "Conceptual meeting point",
      summary:
        "Biology, social environments, perception, action, and physical reality meet in questions about human life. This map connects topics without treating them as one scientifically proven deduction.",
      href: "methods",
      x: 900,
      y: 620,
      videos: [7, 20, 194],
    },
  ];
  const edges = [];
  for (const [id, label, x, y, summary, refs] of groups) {
    nodes.push({
      id,
      label,
      x,
      y,
      group: id,
      kind: "Subject",
      summary,
      href: id,
      videos: refs,
      major: true,
    });
    edges.push({
      from: "human",
      to: id,
      kind: "concept",
      label: "Conceptual connection",
      summary:
        "A subject contributing to questions about human experience. This is an organizing connection, not a measured causal effect.",
    });
    concepts[id].forEach(([nid, nlabel, kind, nsum, href, nrefs], i) => {
      const angle = ((i * 90 - 105) * Math.PI) / 180,
        radius = 210;
      nodes.push({
        id: nid,
        label: nlabel,
        group: id,
        kind,
        summary: nsum,
        href,
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        videos: nrefs,
      });
      edges.push({
        from: id,
        to: nid,
        kind: "topic",
        label: "Part of this subject",
        summary: nsum,
      });
    });
  }
  // A stable hierarchy with room for detail; no perpetual force simulation.
  const byId = new Map(nodes.map((n) => [n.id, n]));
  Object.assign(byId.get("human"), { x: 0, y: 0, radius: 235, tier: 0 });
  groups.forEach(([id], index) => {
    const angle = ((-135 + index * 60) * Math.PI) / 180;
    const subject = byId.get(id);
    Object.assign(subject, {
      x: Math.cos(angle) * 1020,
      y: Math.sin(angle) * 1020,
      radius: 140,
      tier: 1,
    });
    concepts[id].forEach(([nid], i) => {
      const direction = angle + [-1.5, -0.5, 0.5, 1.5][i];
      const node = byId.get(nid);
      Object.assign(node, {
        x: subject.x + Math.cos(direction) * 430,
        y: subject.y + Math.sin(direction) * 430,
        radius: i % 2 ? 96 : 108,
        tier: 2,
        parent: id,
        direction,
      });
    });
  });
  const detailCount = new Map();
  for (const [parent] of mapDetails)
    detailCount.set(parent, (detailCount.get(parent) || 0) + 1);
  const placed = new Map();
  for (const [parent, id, label, summary, href, refs] of mapDetails) {
    const p = byId.get(parent),
      i = placed.get(parent) || 0,
      count = detailCount.get(parent);
    placed.set(parent, i + 1);
    const spread = count > 2 ? 2.8 : 1.8;
    const angle =
      p.direction + (count === 1 ? 0 : (i / (count - 1) - 0.5) * spread);
    const longest = Math.max(...label.split(" ").map((w) => w.length));
    const radius = longest > 12 ? 82 : 58 + (i % 3) * 8;
    const node = {
      id,
      label,
      summary,
      href,
      videos: refs,
      group: p.group,
      parent,
      tier: 3,
      radius,
      kind: "Subtopic",
      x: p.x + Math.cos(angle) * (255 + (i % 2) * 25),
      y: p.y + Math.sin(angle) * (255 + (i % 2) * 25),
    };
    nodes.push(node);
    byId.set(id, node);
    edges.push({
      from: parent,
      to: id,
      kind: "topic",
      label: "Explore a finer distinction",
      summary,
    });
  }
  // Resolve circle collisions while preserving subject centers and a stable overall layout.
  for (let pass = 0; pass < 160; pass++) {
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i],
          b = nodes[j],
          af = a.tier < 2,
          bf = b.tier < 2;
        if (af && bf) continue;
        const dx = b.x - a.x,
          dy = b.y - a.y,
          dist = Math.hypot(dx, dy) || 1,
          min = a.radius + b.radius + 32;
        if (dist >= min) continue;
        const push = (min - dist) * 0.51,
          ux = dx / dist,
          uy = dy / dist;
        if (!af) {
          a.x -= ux * push * (bf ? 2 : 1);
          a.y -= uy * push * (bf ? 2 : 1);
        }
        if (!bf) {
          b.x += ux * push * (af ? 2 : 1);
          b.y += uy * push * (af ? 2 : 1);
        }
      }
  }
  const cross = [
    [
      "inheritance",
      "appearance",
      "claim",
      "Traits and phenotype",
      "Inherited dispositions contribute to physical phenotype; appearance then enters the proposed attraction pathway.",
      ["D01-E01", "D01-E03"],
    ],
    [
      "gene-environment",
      "effort",
      "concept",
      "Selected experience and practice",
      "Selected settings can supply practice and opportunity. This is a conceptual connection between the environment and learning discussions.",
      ["D04-E05", "D04-E06"],
    ],
    [
      "environment",
      "congruence",
      "concept",
      "Environment fit",
      "Self-knowledge and selection of a compatible setting form the practical congruence account.",
      ["D04-E11", "D04-E12"],
    ],
    [
      "preselection",
      "relative-value",
      "concept",
      "Social information and value",
      "Other people’s apparent interest can affect inferred alternatives and desirability.",
      ["D01-E10", "D03-E10"],
    ],
    [
      "relative-value",
      "desire",
      "claim",
      "Perceived quality and desire",
      "Relative desirability enters the proposed sexual-desire pathway. The variables are not genetic measurements.",
      ["D01-E06"],
    ],
    [
      "care",
      "desire",
      "claim",
      "Possible synergy",
      "Practical value and care can contribute to desire in the qualified account. The link is conditional.",
      ["D01-E12"],
    ],
    [
      "desire",
      "commitment",
      "claim",
      "Desire and retention",
      "Desire can contribute to staying without uniquely determining the outcome.",
      ["D01-E11"],
    ],
    [
      "purpose",
      "acceptance",
      "concept",
      "Action and outcome control",
      "Purpose and acceptance meet in the distinction between sustained action and guaranteed results.",
      ["D04-E14"],
    ],
    [
      "causation",
      "agency",
      "claim",
      "Prior causes and choice",
      "Physical determinism motivates the philosophical argument about prior causes of decisions.",
      ["D05-E01"],
    ],
    [
      "agency",
      "acceptance",
      "concept",
      "From causation to acceptance",
      "Acceptance is a normative response to causation, not an experimentally required consequence of physics.",
      ["D05-E02", "D05-E03"],
    ],
    [
      "time",
      "recurrence",
      "claim",
      "Model-dependent cosmic future",
      "Entropy and cosmic expansion enter a speculative account of future states and recurrence. The intermediate assumptions remain essential.",
      ["D05-E07", "D05-E08", "D05-E09"],
    ],
    [
      "media",
      "relative-value",
      "concept",
      "Visible alternatives",
      "Platforms can change the visible choice environment. This joins two topics; it is not an estimated effect in the supplied diagrams.",
      [],
    ],
    [
      "ai",
      "markets",
      "concept",
      "Capability and valuation",
      "A useful technology and a profitable investment are different propositions.",
      [],
    ],
  ];
  for (const [from, to, kind, label, summary, sourceEdges] of cross)
    edges.push({ from, to, kind, label, summary, sourceEdges });
  for (const [from, to, label, summary] of detailConnections) {
    edges.push({ from, to, label, summary, kind: "concept", sourceEdges: [] });
  }
  const sourceLinks = Object.fromEntries(
    fs
      .readdirSync(path.join(root, "assets/diagrams"))
      .filter((x) => x.endsWith(".json"))
      .flatMap((f) =>
        JSON.parse(
          fs.readFileSync(path.join(root, "assets/diagrams", f), "utf8"),
        ).edges.map((e) => [e.id, { label: e.label, status: e.status }]),
      ),
  );
  const readingNotes = JSON.parse(
    fs.readFileSync(path.join(root, "editorial/map-notes.json"), "utf8"),
  );
  for (const node of nodes)
    if (readingNotes[node.id]) node.summary = readingNotes[node.id];
  Object.assign(byId.get("compatibilism"), {
    label: "Unchosen wants",
    kind: "Free-will argument",
    videos: [7],
  });
  Object.assign(byId.get("nutrition"), {
    label: "Shared baseline",
    videos: [199],
  });
  Object.assign(byId.get("intervention"), {
    label: "Curating conditions",
    videos: [149],
  });
  Object.assign(byId.get("reciprocity"), { videos: [5, 123] });
  const left = Math.min(...nodes.map((n) => n.x - n.radius)) - 110;
  const top = Math.min(...nodes.map((n) => n.y - n.radius)) - 110;
  const right = Math.max(...nodes.map((n) => n.x + n.radius)) + 110;
  const bottom = Math.max(...nodes.map((n) => n.y + n.radius)) + 110;
  const bounds = { x: left, y: top, width: right - left, height: bottom - top };
  const data = {
    bounds,
    nodes,
    edges,
    sourceLinks,
    groups: groups.map(([id, label]) => ({ id, label })),
    videos: Object.fromEntries(
      videos.map((v) => [
        v.ordinal,
        {
          title: v.title,
          url: v.video_url,
          date: v.published_at_utc.slice(0, 10),
        },
      ]),
    ),
  };
  fs.writeFileSync(
    path.join(root, "idea-space-data.json"),
    JSON.stringify(data, null, 2),
  );
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<article class="article main-chapter idea-space" id="idea-space"><header class="article-head"><div class="chapter-kicker">Explore / Interactive concept map</div><h2>Explore the connections</h2><p class="section-deck">A movable map of the subjects. Select a concept for its explanation, related ideas, and original video links.</p></header><div class="space-toolbar"><label class="space-search-label">Find a concept<input id="space-search" type="search" placeholder="Try desire, time, genetics…" autocomplete="off"><span id="space-search-feedback" aria-live="polite"></span></label><div class="space-filters" role="group" aria-label="Graph subject"><button data-space-group="all" aria-pressed="true">All ideas</button>${groups.map(([id, label]) => `<button data-space-group="${id}" aria-pressed="false">${esc(label)}</button>`).join("")}</div></div><div class="space-layout"><label class="space-expanded-search" hidden><span>Find a concept</span><input id="space-expanded-query" type="search" placeholder="Find a concept: entropy, Stacy, purpose…" autocomplete="off"></label><button class="space-close" id="space-close" aria-label="Close expanded idea space" hidden><span aria-hidden="true">×</span></button><div class="space-stage" id="space-stage"><svg id="space-svg" tabindex="0" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}" role="group" aria-label="Interactive graph of concepts; drag to pan, use controls to zoom, and select a concept for its explanation"><defs><marker id="space-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1L9 5L0 9" fill="none" stroke="#ff4242" stroke-width="1.4"/></marker><pattern id="space-grid" width="44" height="44" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#502020"/></pattern><filter id="space-glow"><feGaussianBlur stdDeviation="8"/></filter></defs><rect x="-3000" y="-3000" width="8000" height="8000" fill="url(#space-grid)"/><g id="space-world"><g id="space-edges"></g><g id="space-nodes"></g></g></svg><div class="space-controls"><button id="space-zoom-in" aria-label="Zoom idea space in">+</button><button id="space-zoom-out" aria-label="Zoom idea space out">−</button><button id="space-reset">Fit map</button><button id="space-expand" aria-pressed="false">Expand</button></div><p class="space-hint">Drag to pan · select any label · select a circle or connection</p><div class="space-legend"><span><i></i>Proposed link</span><span><i class="dashed"></i>Conceptual connection</span></div></div><aside class="space-inspector" id="space-inspector" aria-live="polite"><p class="kicker">Select a concept</p><h3>Explore the connections.</h3><p>Each point opens an explanation, related ideas, and links to the original videos.</p></aside></div><p class="space-method">The map is a navigational synthesis. Solid lines mark proposed links; dashed lines mark conceptual or editorial connections. Diagram link IDs appear in the inspector where a connection maps to the original causal record. <a href="#diagrams">Inspect the diagrams</a> · <a href="idea-space-data.json">Map data</a></p><script id="idea-space-data" type="application/json">${json}</script></article>`;
}
