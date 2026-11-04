/* Visibility-aware parallax and translucent edge clouds. No audio or remote services. */
(() => {
  "use strict";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const atmosphere = document.querySelector(".edge-atmosphere");
  const scenes = [
    ...document.querySelectorAll("[data-parallax],.chapter-cover"),
  ];
  const visible = new Set();
  let frame = 0;
  function enabled() {
    return !reduced.matches && !document.hidden;
  }
  function applyMotion() {
    root.dataset.motion = enabled() ? "on" : "off";
    if (!enabled()) {
      cancelAnimationFrame(frame);
      frame = 0;
      for (const scene of scenes) {
        scene.style.setProperty("--parallax-y", "0px");
        scene.style.setProperty("--mx", 0);
        scene.style.setProperty("--my", 0);
      }
    } else schedule();
  }
  function schedule() {
    if (!frame && enabled()) frame = requestAnimationFrame(update);
  }
  function update() {
    frame = 0;
    for (const scene of visible) {
      const r = scene.getBoundingClientRect();
      scene.style.setProperty(
        "--parallax-y",
        `${Math.max(-18, Math.min(18, (innerHeight / 2 - r.top - r.height / 2) * 0.025))}px`,
      );
    }
    // Two bounded, different scroll phases keep clouds drifting through the margins
    // even in a very long archive, without growing a giant transformed layer.
    if (atmosphere) {
      atmosphere.style.setProperty(
        "--fog-left-x",
        `${Math.sin(scrollY / 1500) * 56}px`,
      );
      atmosphere.style.setProperty(
        "--fog-right-x",
        `${Math.sin(scrollY / 1900 + 0.8) * -72}px`,
      );
      atmosphere.style.setProperty(
        "--fog-deep-x",
        `${Math.sin(scrollY / 2800) * -105}px`,
      );
      atmosphere.style.setProperty(
        "--fog-left-y",
        `${Math.sin(scrollY / 1800) * 86}px`,
      );
      atmosphere.style.setProperty(
        "--fog-right-y",
        `${Math.sin(scrollY / 2300 + 0.8) * -104}px`,
      );
    }
  }
  const observer = new IntersectionObserver(
    (items) => {
      for (const item of items) {
        item.target.classList.toggle("is-in-view", item.isIntersecting);
        if (item.isIntersecting) visible.add(item.target);
        else visible.delete(item.target);
      }
      schedule();
    },
    { rootMargin: "100px" },
  );
  for (const scene of scenes) {
    observer.observe(scene);
    scene.addEventListener("pointermove", (e) => {
      if (!enabled() || e.pointerType === "touch") return;
      const r = scene.getBoundingClientRect();
      scene.style.setProperty(
        "--mx",
        ((e.clientX - r.left) / r.width - 0.5) * 2,
      );
      scene.style.setProperty(
        "--my",
        ((e.clientY - r.top) / r.height - 0.5) * 2,
      );
    });
    scene.addEventListener("pointerleave", () => {
      scene.style.setProperty("--mx", 0);
      scene.style.setProperty("--my", 0);
    });
  }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  document.addEventListener("visibilitychange", applyMotion);
  reduced.addEventListener("change", applyMotion);
  applyMotion();
})();
