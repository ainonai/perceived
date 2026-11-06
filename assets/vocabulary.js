/* Definitions come from the preserved glossary; the reading copy remains intact. */
(() => {
  "use strict";
  const popup = document.getElementById("vocab-popover");
  if (!popup || !popup.showPopover) return;
  const terms = new Map();
  for (const row of document.querySelectorAll(".glossary-item")) {
    const label = row.querySelector("dt").textContent.trim();
    const definition = row.querySelector("dd").cloneNode(true);
    definition.querySelector(".term-sources")?.remove();
    const entry = {
      label,
      definition: definition.textContent.trim(),
      href: `#${row.id}`,
      source: row.querySelector(".term-sources a")?.getAttribute("href"),
    };
    for (const alias of JSON.parse(
      row.dataset.termAliases || JSON.stringify(label.split(" / ")),
    ))
      terms.set(alias.toLowerCase(), entry);
  }
  const chad = terms.get("chad");
  if (chad) {
    const definition =
      "Chad is an idealized highly attractive man; Stacy is the corresponding label for a woman. Relative desirability and available alternatives matter within the discrepancy argument.";
    terms.set("chad", { ...chad, label: "Chad / Stacy", definition });
    terms.set("stacy", terms.get("chad"));
  }
  if (terms.has("becky"))
    terms.set("becky", {
      ...terms.get("becky"),
      definition:
        "A woman below the idealized Stacy category in this vocabulary. The term belongs to the channel’s informal attractiveness vocabulary.",
    });
  if (terms.has("normie")) terms.set("normies", terms.get("normie"));
  if (terms.has("black pill")) terms.set("blackpill", terms.get("black pill"));
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(
    `\\b(${[...terms.keys()]
      .sort((a, b) => b.length - a.length)
      .map(escape)
      .join("|")})\\b`,
    "gi",
  );
  let active = null,
    pinned = false,
    timer = 0;
  function hide() {
    clearTimeout(timer);
    if (popup.matches(":popover-open")) popup.hidePopover();
  }
  function position(button) {
    const r = button.getBoundingClientRect();
    const p = popup.getBoundingClientRect();
    const left = Math.max(12, Math.min(innerWidth - p.width - 12, r.left));
    const below = r.bottom + 10;
    const top =
      below + p.height < innerHeight - 12
        ? below
        : Math.max(12, r.top - p.height - 10);
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
  }
  function show(button, pin = false) {
    clearTimeout(timer);
    if (active && active !== button)
      active.setAttribute("aria-expanded", "false");
    active = button;
    pinned = pin;
    const entry = terms.get(button.dataset.term);
    document.getElementById("vocab-title").textContent = entry.label;
    document.getElementById("vocab-definition").textContent = entry.definition;
    const links = document.getElementById("vocab-links");
    links.replaceChildren();
    const glossary = document.createElement("a");
    glossary.href = entry.href;
    glossary.textContent = entry.href.startsWith("#term-")
      ? "Full glossary entry →"
      : "Context & vocabulary →";
    links.append(glossary);
    if (entry.source) {
      const source = document.createElement("a");
      source.href = entry.source;
      source.target = "_blank";
      source.rel = "noopener noreferrer";
      source.textContent = "Source video";
      links.append(source);
    }
    if (!popup.matches(":popover-open")) popup.showPopover();
    button.setAttribute("aria-expanded", "true");
    position(button);
  }
  function leave() {
    if (!pinned) timer = setTimeout(hide, 180);
  }
  for (const chapter of document.querySelectorAll(".chapter-prose")) {
    const seen = new Set();
    const walker = document.createTreeWalker(chapter, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement.closest("p,li") &&
          !node.parentElement.closest(
            "a,button,code,.source-trail,figcaption,.callout",
          )
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      expression.lastIndex = 0;
      const matches = [...node.textContent.matchAll(expression)];
      if (!matches.length) continue;
      const fragment = document.createDocumentFragment();
      let cursor = 0;
      for (const match of matches) {
        const term = match[0].toLowerCase();
        const entry = terms.get(term);
        if (seen.has(term)) continue;
        seen.add(term);
        fragment.append(node.textContent.slice(cursor, match.index));
        const button = document.createElement("button");
        button.type = "button";
        button.className = "vocab-term";
        button.dataset.term = term;
        button.textContent = match[0];
        button.setAttribute("aria-haspopup", "dialog");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-controls", "vocab-popover");
        button.addEventListener("pointerenter", (e) => {
          if (e.pointerType === "mouse" && !pinned) show(button);
        });
        button.addEventListener("pointerleave", leave);
        button.addEventListener("focus", () => {
          if (!pinned) show(button);
        });
        button.addEventListener("blur", leave);
        button.addEventListener("click", () => {
          if (active === button && pinned && popup.matches(":popover-open"))
            hide();
          else show(button, true);
        });
        fragment.append(button);
        cursor = match.index + match[0].length;
      }
      if (cursor) {
        fragment.append(node.textContent.slice(cursor));
        node.replaceWith(fragment);
      }
    }
  }
  popup.addEventListener("pointerenter", () => clearTimeout(timer));
  popup.addEventListener("pointerleave", leave);
  popup.querySelector(".vocab-close").addEventListener("click", hide);
  popup.addEventListener("click", (e) => {
    if (e.target.closest("a")) hide();
  });
  popup.addEventListener("toggle", (e) => {
    if (e.newState === "closed") {
      active?.setAttribute("aria-expanded", "false");
      pinned = false;
      active = null;
    }
  });
  addEventListener(
    "scroll",
    (e) => {
      if (!popup.contains(e.target)) hide();
    },
    { passive: true, capture: true },
  );
  addEventListener("resize", hide, { passive: true });
})();
