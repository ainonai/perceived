/* Labels belong to their node: one position and one shared SVG zoom transform. */
window.PerceivedMapLabels = class {
  constructor(svg, nodes, circles) {
    const context = document.createElement("canvas").getContext("2d");
    const items = [];
    for (const node of nodes.values()) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      text.setAttribute("class", "node-label");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "central");
      text.setAttribute("aria-hidden", "true");
      const lines = [];
      let line = "";
      const limit = node.tier < 2 ? 15 : 13;
      for (const word of node.label.split(" ")) {
        if (line && `${line} ${word}`.length > limit) {
          lines.push(line);
          line = word;
        } else line += `${line ? " " : ""}${word}`;
      }
      if (line) lines.push(line);
      for (const label of lines) {
        const span = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "tspan",
        );
        span.setAttribute("x", "0");
        span.textContent = label;
        text.append(span);
      }
      circles.get(node.id).append(text);
      items.push({ node, text, lines });
    }
    const fit = () => {
      for (const { node, text, lines } of items) {
        const weight = node.tier < 2 ? 600 : 500;
        context.font = `${weight} 100px "Source Sans 3", sans-serif`;
        const width =
          Math.max(...lines.map((line) => context.measureText(line).width)) /
          100;
        const font = Math.min(
          node.fontSize,
          (node.radius * 1.65) / width,
          (node.radius * 1.5) / (lines.length * 1.18),
        );
        text.style.fontSize = `${font}px`;
        text.style.fontWeight = String(weight);
        [...text.children].forEach((span, index) =>
          span.setAttribute(
            "y",
            (index - (lines.length - 1) / 2) * font * 1.18,
          ),
        );
      }
    };
    fit();
    document.fonts.ready.then(fit);
  }
};
