/* All interactions run locally. Nothing is sent to a server. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const safeGet = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const safeSet = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  };
  const escapeHTML = (s) =>
    s.replace(
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
  document.addEventListener("click", (event) => {
    const close = event.target.closest("[data-close-reference]");
    if (!close) return;
    const reference = close.closest("details.full-reference");
    if (!reference) return;
    reference.open = false;
    const summary = reference.querySelector("summary");
    summary.focus({ preventScroll: true });
    summary.scrollIntoView({ block: "center", behavior: "instant" });
  });
  const normalize = (s) =>
    s
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const announce = (text) => {
    $("#status-message").textContent = text;
  };
  $("#print-button").addEventListener("click", () => window.print());
  const sidebar = $("#sidebar"),
    menu = $("#menu-button");
  const closeMenu = () => {
    sidebar.classList.remove("is-open");
    menu.setAttribute("aria-expanded", "false");
  };
  menu.addEventListener("click", () => {
    const open = sidebar.classList.toggle("is-open");
    menu.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !menu.contains(e.target)) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
  $("#back-top").addEventListener("click", () => {
    closeMenu();
    history.replaceState(null, "", "#top");
    const top = $("#top");
    top.setAttribute("tabindex", "-1");
    top.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  });

  function reveal(id, move = true) {
    const target = document.getElementById(id);
    if (!target) return;
    let parent = target.parentElement;
    while (parent) {
      if (parent.tagName === "DETAILS") parent.open = true;
      parent = parent.parentElement;
    }
    if (target.tagName === "DETAILS") target.open = true;
    if (target.closest(".source-entry")) {
      $("#source-query").value = "";
      $("#source-year").value = "all";
      filterSources();
    }
    if (target.classList.contains("evidence-claim")) setEvidenceFilter("all");
    if (target.classList.contains("glossary-item")) {
      $("#glossary-query").value = "";
      filterGlossary();
    }
    if (move) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: "start", behavior: "instant" });

        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    }
  }
  document.addEventListener("click", (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor || anchor.getAttribute("href") === "#") return;
    const id = decodeURIComponent(anchor.getAttribute("href").slice(1));
    if (!document.getElementById(id)) return;
    e.preventDefault();
    closeMenu();
    if ($("#search-dialog").open) $("#search-dialog").close();
    history.pushState(null, "", "#" + encodeURIComponent(id));
    reveal(id);
  });
  window.addEventListener("hashchange", () =>
    reveal(decodeURIComponent(location.hash.slice(1))),
  );
  if (location.hash)
    requestAnimationFrame(() =>
      reveal(decodeURIComponent(location.hash.slice(1))),
    );

  const chapters = $$(".main-chapter"),
    navLinks = $$(".sidebar nav a");
  let ticking = false,
    lastSaved = 0;
  function onScroll() {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    $("#reading-progress").style.width =
      `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    let current = "top";
    for (const c of chapters) {
      if (c.getBoundingClientRect().top <= 155) current = c.id;
      else break;
    }
    navLinks.forEach((a) =>
      a.setAttribute("aria-current", String(a.hash === "#" + current)),
    );
    if (Date.now() - lastSaved > 1500 && current !== "top") {
      safeSet("atlas-position", current);
      lastSaved = Date.now();
    }
  }
  addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true },
  );
  onScroll();
  const saved = safeGet("atlas-position");
  if (saved && document.getElementById(saved)) {
    $("#continue-reading").hidden = false;
    $("#continue-reading").href = "#" + saved;
  }

  // Search all editorial sections, preserved references, and all source texts.
  const searchDialog = $("#search-dialog"),
    searchInput = $("#global-query"),
    searchOutput = $("#search-results");
  let searchIndex = null,
    searchTimer;
  function index() {
    if (searchIndex) return searchIndex;
    searchIndex = $$("[data-search-unit]").map((el) => {
      const text = el.textContent.replace(/\s+/g, " ").trim();
      return {
        id: el.id,
        title: el.dataset.searchTitle,
        label: el.dataset.searchLabel,
        text,
        normalized: normalize(text),
        name: normalize(el.dataset.searchTitle || ""),
        weight: Number(el.dataset.searchWeight || 0),
      };
    });
    return searchIndex;
  }
  function highlight(s, tokens) {
    const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (!escaped.length) return escapeHTML(s);
    const re = new RegExp("(" + escaped.join("|") + ")", "ig");
    return s
      .split(re)
      .map((p, i) => (i % 2 ? `<mark>${escapeHTML(p)}</mark>` : escapeHTML(p)))
      .join("");
  }
  function runSearch() {
    const query = normalize(searchInput.value.trim()).slice(0, 160),
      tokens = query.split(/\s+/).filter(Boolean).slice(0, 10);
    if (query.length < 2) {
      searchOutput.innerHTML =
        '<p class="search-tip">Search ideas, evidence, definitions, and the complete supplied source collection. Try <b>heritability</b>, <b>security desire</b>, <b>recurrence</b>, or a source number such as <b>V104</b>.</p>';
      $("#search-count").textContent =
        "Everything stays on this device. Minimum 2 characters.";
      return;
    }
    const found = index().filter((r) =>
      tokens.every((t) => r.normalized.includes(t) || r.name.includes(t)),
    );
    found.forEach((r) => {
      r.score =
        r.weight +
        tokens.reduce((n, t) => n + (r.name.includes(t) ? 10 : 0), 0) +
        (r.name.includes(query) ? 20 : 0);
    });
    found.sort((a, b) => b.score - a.score);
    const visible = found.slice(0, 60);
    searchOutput.innerHTML =
      visible
        .map((r) => {
          const first = r.normalized.indexOf(tokens[0]),
            start = Math.max(0, first - 75);
          const snippet =
            (start ? "…" : "") +
            r.text.slice(start, start + 240) +
            (start + 240 < r.text.length ? "…" : "");
          return `<a class="search-result" href="#${encodeURIComponent(r.id)}"><span class="result-label">${escapeHTML(r.label || "Reference")}</span><b>${highlight(r.title || "", tokens)}</b><p>${highlight(snippet, tokens)}</p></a>`;
        })
        .join("") ||
      '<p class="search-tip">No matches. Try a shorter term or a different phrase.</p>';
    $("#search-count").textContent =
      `${found.length} matching sections${found.length > 60 ? " · showing the first 60; add a term to narrow the results" : ""}`;
  }
  function openSearch() {
    closeMenu();
    searchDialog.showModal();
    runSearch();
    searchInput.focus();
  }
  $$("[data-open-search]").forEach((b) =>
    b.addEventListener("click", openSearch),
  );
  $("#close-search").addEventListener("click", () => searchDialog.close());
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 120);
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (!searchDialog.open) openSearch();
    }
  });
  [searchDialog, $("#diagram-dialog")].forEach((d) =>
    d.addEventListener("click", (e) => {
      if (e.target === d) {
        const r = d.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          d.close();
      }
    }),
  );

  const sources = $$(".source-entry");
  const sourceIndex = sources.map((el) => ({
    el,
    text: null,
    year: el.dataset.year,
  }));
  let sourceTimer;
  function filterSources() {
    const q = normalize($("#source-query").value.trim()),
      year = $("#source-year").value;
    const tokens = q.split(/\s+/).filter(Boolean);
    let count = 0;
    sourceIndex.forEach((r) => {
      if (q && !r.text) r.text = normalize(r.el.textContent);
      const show =
        (year === "all" || r.year === year) &&
        (!q || tokens.every((t) => r.text.includes(t)));
      r.el.hidden = !show;
      if (show) count++;
    });
    const status = $("#source-count");
    status.textContent =
      `${count} of ${sources.length} ${status.dataset.sourceNoun}${q || year !== "all" ? " match this filter" : ` · ${status.dataset.sourceDetail}`}`;
  }
  $("#source-query").addEventListener("input", () => {
    clearTimeout(sourceTimer);
    sourceTimer = setTimeout(filterSources, 130);
  });
  $("#source-year").addEventListener("change", filterSources);
  $("#clear-source-filter").addEventListener("click", () => {
    $("#source-query").value = "";
    $("#source-year").value = "all";
    filterSources();
  });
  const glossary = $$(".glossary-item");
  function filterGlossary() {
    const q = normalize($("#glossary-query").value.trim());
    let count = 0;
    glossary.forEach((el) => {
      const show = normalize(el.textContent).includes(q);
      el.hidden = !show;
      if (show) count++;
    });
    $("#glossary-count").textContent = `${count} of ${glossary.length} terms`;
  }
  $("#glossary-query").addEventListener("input", filterGlossary);
  function setEvidenceFilter(filter) {
    const entries = $$(".evidence-claim");
    let count = 0;
    entries.forEach((el) => {
      const show = filter === "all" || el.dataset.category === filter;
      el.hidden = !show;
      if (show) count++;
    });
    $$("[data-evidence-filter]").forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.evidenceFilter === filter),
      ),
    );
    $("#evidence-count").textContent = `${count} of 27 research notes`;
  }
  $$("[data-evidence-filter]").forEach((b) =>
    b.addEventListener("click", () =>
      setEvidenceFilter(b.dataset.evidenceFilter),
    ),
  );
  $("#expand-evidence").addEventListener("click", (e) => {
    const open = e.currentTarget.dataset.expanded !== "true";
    $$(".evidence-claim:not([hidden])").forEach((d) => (d.open = open));
    e.currentTarget.dataset.expanded = String(open);
    e.currentTarget.textContent = open
      ? "Close visible reviews"
      : "Open visible reviews";
  });
  $("#expand-reference").addEventListener("click", (e) => {
    const open = e.currentTarget.dataset.expanded !== "true";
    $$(".full-reference").forEach((d) => (d.open = open));
    e.currentTarget.dataset.expanded = String(open);
    e.currentTarget.textContent = open
      ? "Close extended references"
      : "Open extended references";
  });

  $$("[data-full-reading]").forEach((button) =>
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-pressed") !== "true";
      $$(".full-reference").forEach((d) => {
        d.open = open;
      });
      $$("[data-full-reading]").forEach((b) => {
        b.setAttribute("aria-pressed", String(open));
        b.textContent = open
          ? "Close the extended reference panels"
          : "Open the complete reference";
      });
      $("#expand-reference").dataset.expanded = String(open);
      $("#expand-reference").textContent = open
        ? "Close extended references"
        : "Open extended references";
      announce(
        open
          ? "All complete reference panels are open. Use the chapter navigation to read them."
          : "Extended reference panels are closed.",
      );
    }),
  );
  let diagramScale = 1,
    diagramFit = true;
  function applyDiagramZoom(fit, scale = 1) {
    const img = $("#diagram-image"),
      stage = $("#diagram-stage");
    if (!img.naturalWidth) return;
    diagramFit = fit;
    diagramScale = fit
      ? Math.min(
          (stage.clientWidth - 28) / img.naturalWidth,
          (stage.clientHeight - 28) / img.naturalHeight,
        )
      : Math.max(0.15, Math.min(3, scale));
    img.style.width = `${img.naturalWidth * diagramScale}px`;
    img.style.height = "auto";
    $("#diagram-zoom-label").textContent =
      `${Math.round(diagramScale * 100)}%${fit ? " · fit" : ""}`;
  }
  $("#diagram-image").addEventListener("load", () => applyDiagramZoom(true));
  $("#diagram-fit").addEventListener("click", () => applyDiagramZoom(true));
  $("#diagram-native").addEventListener("click", () =>
    applyDiagramZoom(false, 1),
  );
  $("#diagram-in").addEventListener("click", () =>
    applyDiagramZoom(false, diagramScale * 1.25),
  );
  $("#diagram-out").addEventListener("click", () =>
    applyDiagramZoom(false, diagramScale / 1.25),
  );
  $$("[data-diagram]").forEach((button) =>
    button.addEventListener("click", () => {
      $("#diagram-title").textContent = button.dataset.title;
      $("#diagram-image").src = button.dataset.diagram;
      $("#diagram-image").alt = button.dataset.title;
      $("#diagram-caption").textContent = button.dataset.caption;
      $("#diagram-original").href = button.dataset.diagram;
      $("#diagram-dialog").showModal();
      requestAnimationFrame(() => applyDiagramZoom(true));
    }),
  );
  $("#close-diagram").addEventListener("click", () =>
    $("#diagram-dialog").close(),
  );
})();
