const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );

/** Static metadata is readable by link-preview crawlers without executing JavaScript. */
export function pageMetadata(site) {
  const url = new URL(site.url).href;
  const image = new URL("assets/artwork/channel-avatar.png", url).href;
  const title = `${site.name}: The Julius Perceiver archive`;
  const alt =
    "A marble Caesar portrait used as the Julius Perceiver channel avatar.";
  const fields = [
    ["og:site_name", site.name],
    ["og:title", title],
    ["og:description", site.description],
    ["og:type", "website"],
    ["og:url", url],
    ["og:image", image],
    ["og:image:secure_url", image],
    ["og:image:type", "image/png"],
    ["og:image:width", "160"],
    ["og:image:height", "160"],
    ["og:image:alt", alt],
  ];
  const twitter = [
    ["twitter:card", "summary"],
    ["twitter:title", title],
    ["twitter:description", site.description],
    ["twitter:image", image],
    ["twitter:image:alt", alt],
  ];
  return (
    `<title>${escape(title)}</title><meta name="description" content="${escape(site.description)}"><meta name="theme-color" content="#080909"><link rel="canonical" href="${escape(url)}">` +
    fields
      .map(
        ([key, value]) => `<meta property="${key}" content="${escape(value)}">`,
      )
      .join("") +
    twitter
      .map(([key, value]) => `<meta name="${key}" content="${escape(value)}">`)
      .join("")
  );
}
