(() => {
  "use strict";
  const dataNode = document.getElementById("idea-space-data");
  if (!dataNode) return;
  const data = JSON.parse(dataNode.textContent),
    svg = document.getElementById("space-svg"),
    stage = document.getElementById("space-stage"),
    world = document.getElementById("space-world");
  const edgeLayer = document.getElementById("space-edges"),
    nodeLayer = document.getElementById("space-nodes"),
    panel = document.getElementById("space-inspector");
  const NS = "http://www.w3.org/2000/svg",
    nodes = new Map(data.nodes.map((n) => [n.id, { ...n }]));
  const original = new Map(data.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
  const small = stage.clientWidth < 850;
  const view = svg.viewBox.baseVal;
  const viewCenter = {
    x: view.x + view.width / 2,
    y: view.y + view.height / 2,
  };
  const initialZoom = small ? 2.4 : 1;
  const initialPan = { ...viewCenter };
  let zoom = initialZoom,
    pan = { ...initialPan },
    group = "all",
    selected = "human",
    gesture = null,
    moved = false;
  const escape = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const el = (name, attrs = {}) => {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };
  const pairs = data.edges.map((e, i) => {
    const g = el("g", {
      "data-edge": i,
      class: "space-edge " + (e.kind === "claim" ? "" : "is-concept"),
    });
    const visible = el("path", {
        fill: "none",
        "vector-effect": "non-scaling-stroke",
        ...(e.kind === "claim" ? { "marker-end": "url(#space-arrow)" } : {}),
      }),
      hit = el("path", {
        fill: "none",
        stroke: "transparent",
        "stroke-width": 16,
        "vector-effect": "non-scaling-stroke",
      });
    g.append(visible, hit);
    edgeLayer.append(g);
    g.addEventListener("click", (event) => {
      if (!moved) {
        showEdge(e);
        event.stopPropagation();
      }
    });
    return { e, g, visible, hit };
  });
  const conceptQuery = (s) =>
    s
      .toLowerCase()
      .replace(/genetics/g, "genetic")
      .replace(/free will/g, "agency")
      .trim();
  const matches = (n, q) =>
    conceptQuery(
      n.label + " " + n.summary + " " + n.kind + " " + n.group,
    ).includes(conceptQuery(q));
  const elements = new Map();
  for (const n of nodes.values()) {
    const g = el("g", {
      "data-node": n.id,
      class:
        "space-node" +
        (n.major ? " is-major" : "") +
        (n.id === "human" ? " is-center" : "") +
        (n.tier === 3 ? " is-detail" : ""),
      tabindex: "0",
      role: "button",
      "aria-label": n.label,
    });
    const halo = el("circle", {
        class: "node-halo",
        r: n.radius + 18,
      }),
      circle = el("circle", {
        class: "node-disc",
        r: n.radius,
      });
    g.append(halo, circle);
    const longestWord = Math.max(
      ...n.label.split(" ").map((word) => word.length),
    );
    const baseSize =
      n.tier === 0 ? 64 : n.tier === 1 ? 50 : n.tier === 2 ? 36 : 28;
    n.fontSize = Math.min(baseSize, (n.radius * 1.8) / (longestWord * 0.52));
    nodeLayer.append(g);
    elements.set(n.id, g);
    g.addEventListener("click", (e) => {
      if (!moved) {
        select(n.id);
        e.stopPropagation();
      }
    });
    g.addEventListener("focus", () => {
      if (g.matches(":focus-visible")) {
        focusNode(n);
        scheduleDraw();
      }
    });
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select(n.id);
      }
    });
  }
  new window.PerceivedMapLabels(svg, nodes, elements);
  function connected(id) {
    return new Set([
      id,
      ...data.edges
        .filter((e) => e.from === id || e.to === id)
        .flatMap((e) => [e.from, e.to]),
    ]);
  }
  let pendingFrame = 0;
  function scheduleDraw() {
    if (pendingFrame) return;
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = 0;
      draw();
    });
  }
  function draw() {
    world.setAttribute(
      "transform",
      `translate(${pan.x} ${pan.y}) scale(${zoom})`,
    );
    const connectedNodes = connected(selected),
      q = document.getElementById("space-search").value.trim().toLowerCase();
    for (const n of nodes.values()) {
      const g = elements.get(n.id),
        visible =
          group === "all" || n.group === group || n.major || n.id === "human";
      g.style.display = visible ? "" : "none";
      g.setAttribute("transform", `translate(${n.x} ${n.y})`);
      g.classList.toggle("is-selected", n.id === selected);
      g.setAttribute("aria-pressed", String(n.id === selected));
      g.classList.toggle("is-related", connectedNodes.has(n.id));
      g.classList.toggle(
        "is-dim",
        q
          ? !matches(n, q) && !connectedNodes.has(n.id)
          : group !== "all" &&
              n.group !== group &&
              !n.major &&
              n.id !== "human",
      );
    }
    pairs.forEach(({ e, g, visible, hit }) => {
      const a = nodes.get(e.from),
        b = nodes.get(e.to),
        show =
          group === "all" ||
          a.group === group ||
          b.group === group ||
          e.from === "human";
      g.style.display = show ? "" : "none";
      const dx = b.x - a.x,
        dy = b.y - a.y,
        bend = Math.min(70, Math.hypot(dx, dy) * 0.12);
      const len = Math.hypot(dx, dy) || 1;
      const mx = (a.x + b.x) / 2 - (dy / len) * bend,
        my = (a.y + b.y) / 2 + (dx / len) * bend;
      const ar = a.radius + 3,
        br = b.radius + 5;
      const al = Math.hypot(mx - a.x, my - a.y) || 1,
        bl = Math.hypot(mx - b.x, my - b.y) || 1;
      const ax = a.x + ((mx - a.x) * ar) / al,
        ay = a.y + ((my - a.y) * ar) / al,
        bx = b.x + ((mx - b.x) * br) / bl,
        by = b.y + ((my - b.y) * br) / bl;
      const d = `M${ax},${ay} Q${mx},${my} ${bx},${by}`;
      visible.setAttribute("d", d);
      hit.setAttribute("d", d);
      g.classList.toggle("is-active", e.from === selected || e.to === selected);
    });
  }
  new ResizeObserver(() => scheduleDraw()).observe(stage);
  function sourceLinks(refs) {
    return [...new Set(refs || [])]
      .slice(0, 4)
      .map((id) => {
        const v = data.videos[id];
        return v
          ? `<a class="space-video" href="${escape(v.url)}" target="_blank" rel="noopener noreferrer"><span>V${String(id).padStart(3, "0")} · ${v.date}</span>${escape(v.title)}</a>`
          : "";
      })
      .join("");
  }
  function select(id) {
    selected = id;
    const n = nodes.get(id);
    const related = [...connected(id)].filter((x) => x !== id);
    panel.innerHTML = `<p class="kicker">${escape(n.kind)}</p><h3>${escape(n.label)}</h3><p>${escape(n.summary)}</p><a class="space-read" href="#${escape(n.href)}">Read this topic →</a><div class="space-related"><h4>Connected ideas</h4>${related.map((x) => `<button data-select="${escape(x)}">${escape(nodes.get(x).label)}</button>`).join("")}</div><div class="space-sources"><h4>Original videos</h4>${sourceLinks(n.videos)}</div>`;
    panel.querySelectorAll("[data-select]").forEach((b) =>
      b.addEventListener("click", () => {
        focusNode(nodes.get(b.dataset.select));
        select(b.dataset.select);
      }),
    );
    panel.scrollTop = 0;
    scheduleDraw();
  }
  function showEdge(e) {
    const a = nodes.get(e.from),
      b = nodes.get(e.to);
    selected = e.from;
    panel.innerHTML = `<p class="kicker">${e.kind === "claim" ? "Proposed link" : "Conceptual connection"}</p><h3>${escape(e.label)}</h3><p class="space-endpoints">${escape(a.label)} → ${escape(b.label)}</p><p>${escape(e.summary)}</p>${
      e.sourceEdges?.length
        ? `<p class="space-edge-ids">Related original links: ${e.sourceEdges
            .map((id) => {
              const item = data.sourceLinks[id];
              return `<span><b>${escape(id)}</b>: ${escape(item?.label || "")}<small>${escape(item?.status || "See original ledger")}</small></span>`;
            })
            .join(
              "",
            )}</p><a class="space-read" href="#ref-diagrams">Inspect the original source ledger →</a>`
        : ""
    }<div class="space-sources"><h4>Related original videos</h4>${sourceLinks([...(a.videos || []), ...(b.videos || [])])}</div>`;
    scheduleDraw();
  }
  function point(event) {
    const p = svg.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  svg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault(); // Dragging the canvas must never select its text.
    const p = point(e),
      target = e.target.closest("[data-node]");
    moved = false;
    gesture = {
      id: target?.dataset.node || null,
      edge: e.target.closest("[data-edge]")?.dataset.edge,
      start: p,
      last: p,
      pan: { ...pan },
    };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", (e) => {
    if (!gesture) return;
    const p = point(e);
    if (Math.hypot(p.x - gesture.start.x, p.y - gesture.start.y) > 4)
      moved = true;
    if (gesture.id) {
      const n = nodes.get(gesture.id);
      n.x += (p.x - gesture.last.x) / zoom;
      n.y += (p.y - gesture.last.y) / zoom;
    } else {
      pan.x = gesture.pan.x + p.x - gesture.start.x;
      pan.y = gesture.pan.y + p.y - gesture.start.y;
    }
    gesture.last = p;
    scheduleDraw();
  });
  const stop = (e) => {
    if (gesture) {
      const g = gesture;
      svg.releasePointerCapture(e.pointerId);
      gesture = null;
      scheduleDraw();
      if (e.type === "pointerup" && !moved) {
        if (g.id) select(g.id);
        else if (g.edge !== undefined) showEdge(data.edges[Number(g.edge)]);
      }
      requestAnimationFrame(() => {
        moved = false;
      });
    }
  };
  svg.addEventListener("pointerup", stop);
  svg.addEventListener("pointercancel", stop);
  function focusNode(n) {
    zoom = small ? 4.8 : 3;
    pan = { x: viewCenter.x - n.x * zoom, y: viewCenter.y - n.y * zoom };
  }
  function fitGroup(id) {
    const list = [...nodes.values()].filter((n) => n.group === id);
    const x1 = Math.min(...list.map((n) => n.x - n.radius)) - 70,
      x2 = Math.max(...list.map((n) => n.x + n.radius)) + 70;
    const y1 = Math.min(...list.map((n) => n.y - n.radius)) - 70,
      y2 = Math.max(...list.map((n) => n.y + n.radius)) + 70;
    zoom = Math.min(view.width / (x2 - x1), view.height / (y2 - y1));
    pan = {
      x: viewCenter.x - ((x1 + x2) / 2) * zoom,
      y: viewCenter.y - ((y1 + y2) / 2) * zoom,
    };
  }
  function setZoom(next, anchor = viewCenter) {
    next = Math.max(0.55, Math.min(10, next));
    const ratio = next / zoom;
    pan = {
      x: anchor.x - (anchor.x - pan.x) * ratio,
      y: anchor.y - (anchor.y - pan.y) * ratio,
    };
    zoom = next;
    scheduleDraw();
  }
  svg.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      setZoom(zoom * Math.exp(-e.deltaY * 0.0014), point(e));
    },
    { passive: false },
  );
  document
    .getElementById("space-zoom-in")
    .addEventListener("click", () => setZoom(zoom * 1.25));
  document
    .getElementById("space-zoom-out")
    .addEventListener("click", () => setZoom(zoom / 1.25));
  document.getElementById("space-reset").addEventListener("click", () => {
    zoom = 1;
    pan = { ...viewCenter };
    for (const n of nodes.values()) Object.assign(n, original.get(n.id));
    scheduleDraw();
  });
  document.querySelectorAll("[data-space-group]").forEach((b) =>
    b.addEventListener("click", () => {
      group = b.dataset.spaceGroup;
      document
        .querySelectorAll("[data-space-group]")
        .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      if (group !== "all") {
        fitGroup(group);
        select(group);
      } else {
        zoom = initialZoom;
        pan = { ...initialPan };
        scheduleDraw();
      }
    }),
  );
  function searchConcept(e) {
    document.getElementById("space-search").value = e.target.value;
    document.getElementById("space-expanded-query").value = e.target.value;
    const q = conceptQuery(e.target.value),
      found = [...nodes.values()].filter((n) => q && matches(n, q)),
      match =
        found.find((n) => conceptQuery(n.label) === q) ||
        found.find((n) => conceptQuery(n.label).includes(q)) ||
        found[0];
    document.getElementById("space-search-feedback").textContent = q
      ? found.length
        ? `${found.length} matching concepts`
        : "No matches. Try appearance, time, or inheritance."
      : "";
    if (match) {
      focusNode(match);
      select(match.id);
    } else scheduleDraw();
  }
  for (const id of ["space-search", "space-expanded-query"])
    document.getElementById(id).addEventListener("input", searchConcept);

  const closeExpanded = document.getElementById("space-close");
  const backdrop = document.getElementById("space-backdrop");
  const layout = document.querySelector(".space-layout");
  const outside = [
    ...document.querySelectorAll(
      "body > header, body > aside, body > .skip, main > *",
    ),
    ...document.querySelector("#idea-space").children,
  ].filter((element) => element !== layout && !element.contains(layout));
  const inertBefore = new Map();
  const expand = document.getElementById("space-expand");
  const toggleExpanded = () => {
    const active = layout.classList.toggle("is-expanded");
    expand.textContent = active ? "Close expanded view" : "Expand";
    expand.setAttribute("aria-pressed", String(active));
    closeExpanded.hidden = !active;
    document.querySelector(".space-expanded-search").hidden = !active;
    backdrop.hidden = !active;
    for (const element of outside) {
      if (active) {
        inertBefore.set(element, element.inert);
        element.inert = true;
      } else {
        element.inert = inertBefore.get(element) || false;
      }
    }
    if (!active) inertBefore.clear();
    document.body.classList.toggle("space-open", active);
    if (active) {
      layout.setAttribute("role", "dialog");
      layout.setAttribute("aria-modal", "true");
      layout.setAttribute("aria-label", "Expanded idea space");
    } else {
      layout.removeAttribute("role");
      layout.removeAttribute("aria-modal");
      layout.removeAttribute("aria-label");
    }
    (active ? closeExpanded : expand).focus({ preventScroll: true });
  };
  expand.addEventListener("click", toggleExpanded);
  backdrop.addEventListener("click", () => {
    if (layout.classList.contains("is-expanded")) toggleExpanded();
  });
  closeExpanded.addEventListener("click", () => {
    if (layout.classList.contains("is-expanded")) toggleExpanded();
  });
  document.addEventListener("keydown", (e) => {
    if (!layout.classList.contains("is-expanded")) return;
    if (e.key === "Escape") toggleExpanded();
    if (e.key === "Tab") {
      const focusable = [
          ...layout.querySelectorAll('button,a[href],input,[tabindex="0"]'),
        ].filter((x) => x.getClientRects().length),
        first = focusable[0],
        last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  layout.addEventListener("click", (e) => {
    if (
      e.target.closest('a[href^="#"]') &&
      layout.classList.contains("is-expanded")
    )
      toggleExpanded();
  });
  svg.addEventListener("keydown", (e) => {
    if (e.target !== svg) return;
    const shifts = {
      ArrowLeft: [80, 0],
      ArrowRight: [-80, 0],
      ArrowUp: [0, 80],
      ArrowDown: [0, -80],
    };
    if (shifts[e.key]) {
      e.preventDefault();
      pan.x += shifts[e.key][0];
      pan.y += shifts[e.key][1];
      scheduleDraw();
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      setZoom(zoom * 1.25);
    } else if (e.key === "-") {
      e.preventDefault();
      setZoom(zoom / 1.25);
    }
  });
  select("human");
})();
