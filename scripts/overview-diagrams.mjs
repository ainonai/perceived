import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
const specs = [
  {
    title: "Attraction has more than one outcome",
    sub: "A readable overview of the proposed pathways",
    nodes: [
      ["a", "Appearance", 60, 170],
      ["b", "Behavior & signals", 60, 365],
      ["q", "Perceived desirability", 415, 265],
      ["d", "Sexual desire", 770, 170],
      ["r", "Resources & care", 415, 540],
      ["u", "Practical value", 770, 540],
      ["t", "Pursuit & retention", 770, 365],
    ],
    edges: [
      ["a", "q"],
      ["b", "q"],
      ["q", "d"],
      ["d", "t"],
      ["r", "u"],
      ["u", "t"],
    ],
    note: "Desire, practical value, pursuit, and remaining together are distinct variables.",
  },
  {
    title: "From an encounter to an ongoing bond",
    sub: "Attraction and relationship maintenance are different stages",
    nodes: [
      ["e", "Encounter", 60, 190],
      ["i", "Mutual interest", 415, 190],
      ["b", "Ongoing bond", 770, 190],
      ["f", "Care & practical fit", 415, 470],
      ["x", "Separation or return", 770, 470],
    ],
    edges: [
      ["e", "i"],
      ["i", "b"],
      ["f", "b"],
      ["b", "x"],
    ],
    note: "A person can leave despite remaining desire. Returning does not identify the cause.",
  },
  {
    title: "What an action changes—and what it signals",
    sub: "Separate the condition from the interpretation of the condition",
    nodes: [
      ["g", "Major improvement", 60, 150],
      ["p", "Observable appearance", 415, 150],
      ["o", "Real priorities", 60, 530],
      ["b", "Genuine availability", 415, 530],
      ["e", "Visible effort", 60, 340],
      ["c", "Compensation inferred", 415, 340],
      ["v", "Perceived value", 770, 340],
    ],
    edges: [
      ["g", "p"],
      ["p", "v"],
      ["o", "b"],
      ["b", "v"],
      ["e", "c"],
      ["c", "v"],
    ],
    note: "Manufactured rival cues imitate alternatives; they are not the same as having them.",
  },
  {
    title: "Starting conditions, action, and a life",
    sub: "A conceptual overview across the practical chapters",
    nodes: [
      ["g", "Inherited dispositions", 60, 170],
      ["e", "Environment", 60, 470],
      ["a", "Attention & behavior", 415, 170],
      ["p", "Practice & reflection", 415, 470],
      ["s", "Skills & opportunities", 770, 170],
      ["f", "Fit & fulfillment", 770, 470],
    ],
    edges: [
      ["g", "a"],
      ["e", "a"],
      ["a", "p"],
      ["p", "s"],
      ["p", "f"],
    ],
    note: "These are conceptual pathways. Stable dispositions and acquired capacities coexist.",
  },
  {
    title: "Two different kinds of question",
    sub: "Philosophical implications are separate from cosmological extrapolations",
    nodes: [
      ["d", "Physical causation", 60, 180],
      ["a", "Agency & responsibility", 415, 180],
      ["m", "Acceptance & meaning", 770, 180],
      ["e", "Entropy & expansion", 60, 470],
      ["h", "Cosmic future", 415, 470],
      ["r", "Recurrence?", 770, 470],
    ],
    edges: [
      ["d", "a"],
      ["a", "m"],
      ["e", "h"],
      ["h", "r"],
    ],
    note: "Recurrence is conditional and speculative. Personal identity remains an additional question.",
  },
  {
    title: "A finding and the claim beyond it",
    sub: "Supported effects and unsupported extensions are different propositions",
    nodes: [
      ["a", "Appearance", 60, 155],
      ["b", "Romantic evaluations", 415, 155, "support"],
      ["x", "Universal 90% rule?", 770, 155, "question"],
      ["g", "Genetic variation", 60, 355],
      ["v", "Population differences", 415, 355, "support"],
      ["y", "Individual destiny?", 770, 355, "question"],
      ["p", "Publication bias", 60, 555],
      ["i", "Inflated published benefit", 415, 555, "support"],
      ["z", "Zero actual benefit?", 770, 555, "question"],
    ],
    edges: [
      ["a", "b"],
      ["b", "x", "boundary"],
      ["g", "v"],
      ["v", "y", "boundary"],
      ["p", "i"],
      ["i", "z", "boundary"],
    ],
    note: "The middle column refers to the narrower reviewed finding; the last column is not established by it.",
  },
  {
    title: "Inheritance and exposure can reach the same outcome",
    sub: "Competing causal routes require different tests",
    nodes: [
      ["p", "Parental traits", 415, 140],
      ["f", "Family conditions", 60, 345],
      ["g", "Child inherited traits", 770, 345],
      ["e", "Exposure & learning", 60, 555],
      ["o", "Child outcomes", 770, 555],
    ],
    edges: [
      ["p", "f"],
      ["p", "g"],
      ["f", "e"],
      ["e", "o"],
      ["g", "o"],
    ],
    note: "A correlation with a family condition does not, by itself, isolate either pathway.",
  },
];
function lines(s, max = 19) {
  const out = [];
  let line = "";
  for (const w of s.split(" ")) {
    if (line && line.length + w.length > max) {
      out.push(line);
      line = w;
    } else line += (line ? " " : "") + w;
  }
  if (line) out.push(line);
  return out;
}
export function overviewDiagrams() {
  const dir = path.join(root, "assets/overviews");
  fs.mkdirSync(dir, { recursive: true });
  const record = [];
  specs.forEach((s, i) => {
    const code = "D0" + (i + 1),
      w = 1080,
      h = 795;
    let body = "";
    const map = new Map(s.nodes.map((n) => [n[0], n]));
    for (const [from, to, kind] of s.edges) {
      const a = map.get(from),
        b = map.get(to);
      let ax = a[2] + 125,
        ay = a[3] + 55,
        bx = b[2] + 125,
        by = b[3] + 55;
      const dx = bx - ax,
        dy = by - ay;
      if (Math.abs(dx) > Math.abs(dy)) {
        ax += Math.sign(dx) * 125;
        bx -= Math.sign(dx) * 125;
      } else {
        ay += Math.sign(dy) * 55;
        by -= Math.sign(dy) * 55;
      }
      const color = kind === "boundary" ? "#ff4848" : "#aa8484";
      const mx = (ax + bx) / 2;
      body += `<path d="M${ax} ${ay} C${mx} ${ay} ${mx} ${by} ${bx} ${by}" stroke="${color}" stroke-width="2.3" fill="none" marker-end="url(#arrow)"${kind === "boundary" ? ' stroke-dasharray="7 6"' : ""}/>`;
    }
    for (const [id, label, x, y, kind] of s.nodes) {
      const ls = lines(label);
      const stroke =
        kind === "support"
          ? "#83b9a6"
          : kind === "question"
            ? "#ff3b3b"
            : "#6e4141";
      const fill = kind === "question" ? "#2c1414" : "#201d1d";
      body += `<g><rect x="${x}" y="${y}" width="250" height="110" rx="9" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/><text x="${x + 125}" y="${y + 57 - (ls.length - 1) * 16}" fill="#f1ebe2" font-family="Arial,sans-serif" font-size="26" text-anchor="middle">${ls.map((l, j) => `<tspan x="${x + 125}" dy="${j ? 32 : 0}">${esc(l)}</tspan>`).join("")}</text></g>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc"><title id="title">${esc(s.title)}</title><desc id="desc">${esc(s.note)} Simplified overview; consult the full map and original edge ledger.</desc><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="#bd6f6f"/></marker></defs><rect width="1080" height="795" fill="#100e0e"/><path d="M32 105H1048" stroke="#662323"/><text x="32" y="31" fill="#ff3d3d" font-family="Arial,sans-serif" font-size="15" letter-spacing="2">${code} / CONCEPT OVERVIEW</text><text x="32" y="68" fill="#f3eee7" font-family="Georgia,serif" font-size="31">${esc(s.title)}</text><text x="32" y="94" fill="#b7adad" font-family="Arial,sans-serif" font-size="17">${esc(s.sub)}</text>${body}<path d="M32 706H1048" stroke="#3c2525"/><text x="32" y="738" fill="#c3b7b7" font-family="Arial,sans-serif" font-size="17">${esc(s.note)}</text><text x="32" y="770" fill="#9e8686" font-family="Arial,sans-serif" font-size="15">Simplified reading view · Full causal map, qualifications, and source ledger remain available</text></svg>`;
    fs.writeFileSync(path.join(dir, code.toLowerCase() + ".svg"), svg);
    record.push({
      id: code,
      title: s.title,
      nodes: s.nodes,
      links: s.edges,
      note: s.note,
      originalMap:
        "../diagrams/" +
        fs
          .readdirSync(path.join(root, "assets/diagrams"))
          .filter((f) => f.endsWith(".svg"))
          .sort()[i],
    });
  });
  fs.writeFileSync(
    path.join(root, "overview-map-record.json"),
    JSON.stringify(record, null, 2),
  );
  return record;
}
