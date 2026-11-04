import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
let vizModule;
try {
  vizModule = require("@viz-js/viz");
} catch {
  vizModule = require(
    path.join(
      process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ||
        "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules",
      "@viz-js/viz",
    ),
  );
}
const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const original = path.join(root, "original/DIAGRAMS");
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const titles = [
  "Attraction & perceived value",
  "The life of a relationship",
  "Effort, signals & naturalness",
  "A map of the worldview",
  "Causation, meaning & the cosmos",
  "Evidence & inference",
  "Inheritance & competing pathways",
];
const subtitles = [
  "Proposed causal architecture",
  "Different outcomes at different stages",
  "Real circumstances and inferred alternatives",
  "Conceptual connections across the collection",
  "Philosophical commitments and physical hypotheses",
  "What one finding does—and does not—establish",
  "Selection, transmission, exposure, and learning",
];
const ranks = [
  [
    ["g", "m", "r"],
    ["p", "a"],
    ["b", "q", "u"],
    ["d", "v", "t"],
  ],
  [
    ["e", "i"],
    ["f", "c", "b"],
    ["s", "v", "l"],
    ["x", "r", "z"],
  ],
  [["g", "e", "o", "f"], ["p", "c", "b"], ["q", "s"], ["r"]],
  [
    ["g", "e", "i"],
    ["a", "c"],
    ["k", "r", "p"],
    ["s", "f", "w"],
  ],
  [
    ["d", "e", "t"],
    ["c", "p", "h"],
    ["b", "a", "f"],
    ["m", "r", "s"],
  ],
  [
    ["a", "c", "f", "i"],
    ["b", "d", "g", "j"],
    ["e", "h", "k"],
  ],
  [["pg"], ["pt", "cg"], ["fa", "hb"], ["re", "ex"], ["co"]],
];
const ledgerText = fs.readFileSync(path.join(original, "README.md"), "utf8");
const ledger = Object.fromEntries(
  [...ledgerText.matchAll(/^\| (D\d\d-E\d\d) \| (.*?) \| (.*?) \|/gm)].map(
    (m) => [m[1], { relationship: m[2], status: m[3] }],
  ),
);
function wrap(text, max = 23) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    if (line && line.length + w.length + 1 > max) {
      lines.push(line);
      line = w;
    } else line += (line ? " " : "") + w;
  }
  if (line) lines.push(line);
  return lines.join("\n");
}
function style(status) {
  if (status.includes("contradicted"))
    return { color: "#e07878", pattern: "solid", label: "× " };
  if (status.startsWith("C:") || status.startsWith("A/C:"))
    return { color: "#8fb8aa", pattern: "solid", label: "" };
  if (status.startsWith("B:") || status.startsWith("B/C:"))
    return { color: "#d67272", pattern: "dashed", label: "" };
  return { color: "#b8b0a4", pattern: "solid", label: "" };
}

export async function renderDiagrams() {
  const viz = await vizModule.instance();
  const files = fs
    .readdirSync(original)
    .filter((x) => x.endsWith(".mmd"))
    .sort();
  const report = [];
  for (let index = 0; index < files.length; index++) {
    const file = files[index],
      source = fs.readFileSync(path.join(original, file), "utf8"),
      code = `D0${index + 1}`;
    const nodes = [...source.matchAll(/^\s+(\w+)\["([^"]+)"\]/gm)].map((m) => ({
      name: m[1],
      label: m[2],
    }));
    const edges = [
      ...source.matchAll(
        /^\s+(\w+)\s+(-->|-\.->)\|"(D\d\d-E\d\d): ([^"]+)"\|\s*(\w+)/gm,
      ),
    ].map((m) => ({
      tail: m[1],
      head: m[5],
      id: m[3],
      label: m[4],
      originalDashed: m[2] === "-.->",
    }));
    if (edges.some((e) => !ledger[e.id]))
      throw Error("Missing edge status in " + file);
    const layout = {
      name: code,
      directed: true,
      graphAttributes: {
        rankdir: "TB",
        bgcolor: "#151313",
        pad: 0.3,
        nodesep: 0.58,
        ranksep: 0.74,
        splines: "spline",
        outputorder: "edgesfirst",
        fontname: "Arial",
        fontcolor: "#e7e2d8",
        newrank: true,
      },
      nodeAttributes: {
        shape: "box",
        style: "rounded,filled",
        fillcolor: "#272424",
        color: "#56534f",
        fontcolor: "#f1eade",
        fontname: "Arial",
        fontsize: 15,
        margin: "0.22,0.15",
        penwidth: 1.0,
      },
      edgeAttributes: {
        fontname: "Arial",
        fontsize: 10.5,
        arrowsize: 0.7,
        penwidth: 1.1,
      },
      nodes: nodes.map((n, i) => ({
        name: n.name,
        attributes: {
          label: wrap(n.label),
          id: `${code}-node-${n.name}`,
          tooltip: n.label,
          ...(i === 0 ? { fillcolor: "#302020", color: "#b64747" } : {}),
        },
      })),
      edges: edges.map((e) => {
        const s = style(ledger[e.id].status);
        return {
          tail: e.tail,
          head: e.head,
          attributes: {
            id: e.id,
            label: s.label + wrap(e.label, 25),
            tooltip: `${e.id} | ${ledger[e.id].status} | ${e.label}`,
            color: s.color,
            fontcolor: s.color,
            style: s.pattern,
          },
        };
      }),
      subgraphs:
        index === 5
          ? ranks[index].map((names, i) => ({
              name: "row" + i,
              graphAttributes: { rank: "same" },
              nodes: names.map((name) => ({ name })),
            }))
          : [],
    };
    const generated = viz.renderString(layout, {
      format: "svg",
      engine: "dot",
    });
    const box = generated
        .match(/viewBox="([\d.\s-]+)"/)[1]
        .split(/\s+/)
        .map(Number),
      gw = box[2],
      gh = box[3];
    const width = Math.max(740, gw + 54),
      height = gh + 185,
      offset = (width - gw) / 2;
    const svgStart = generated.indexOf("<svg"),
      contentStart = generated.indexOf(">", svgStart) + 1;
    const graph = generated.slice(
      contentStart,
      generated.lastIndexOf("</svg>"),
    );
    const header = `<rect width="${width}" height="${height}" fill="#151313"/><text x="28" y="30" fill="#d67272" font-family="Arial,sans-serif" font-size="10" letter-spacing="2">${code} / WORLDVIEW ATLAS</text><text x="28" y="62" fill="#f1eade" font-family="Georgia,serif" font-size="28">${esc(titles[index])}</text><text x="28" y="88" fill="#a9a7a2" font-family="Arial,sans-serif" font-size="12">${esc(subtitles[index])}</text><line x1="28" x2="${width - 28}" y1="108" y2="108" stroke="#383737"/>`;
    const footer = `<line x1="28" x2="${width - 28}" y1="${height - 51}" y2="${height - 51}" stroke="#383737"/><text x="28" y="${height - 28}" fill="#a9a7a2" font-family="Arial,sans-serif" font-size="10">${edges.length} links · Same nodes and directions as the original · Read the edge ledger for qualifications</text>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc"><title id="title">${esc(titles[index])}</title><desc id="desc">${esc(subtitles[index])}. Ivory lines denote expressed claims; dashed rose lines denote editorial or competing pathways; sage denotes evaluated support; red denotes contradicted inference. Full status remains in each edge title and the source ledger. This diagram preserves ${nodes.length} original nodes and ${edges.length} original directed links.</desc>${header}<g transform="translate(${offset},119)">${graph}</g>${footer}</svg>`;
    fs.writeFileSync(
      path.join(root, "assets/diagrams", file.replace(".mmd", ".svg")),
      svg,
    );
    fs.writeFileSync(
      path.join(root, "assets/diagrams", file.replace(".mmd", ".json")),
      JSON.stringify(
        {
          id: code,
          title: titles[index],
          nodes,
          edges: edges.map((e) => ({ ...e, status: ledger[e.id].status })),
        },
        null,
        2,
      ),
    );
    report.push({
      id: code,
      nodes: nodes.length,
      edges: edges.length,
      nodeLabelsPreserved: true,
      directionsPreserved: true,
      edgeIDs: edges.map((e) => e.id),
      width,
      height,
    });
  }
  fs.writeFileSync(
    path.join(root, "diagram-redesign-report.json"),
    JSON.stringify(
      { totalEdges: report.reduce((n, x) => n + x.edges, 0), diagrams: report },
      null,
      2,
    ),
  );
  console.log(
    "Redesigned 7 diagrams; preserved " +
      report.reduce((n, x) => n + x.edges, 0) +
      " original links.",
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === new URL(import.meta.url).pathname
)
  await renderDiagrams();
