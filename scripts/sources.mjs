const original = "original/SOURCE_CORPUS";
const updates = "editorial/updates";
const videoUrl = "https://www.youtube.com/watch?v=";
const provenance = {
  "creator-provided": "Creator-provided timed transcript",
  "native-captions": "YouTube timed captions",
};

export function loadSources(read) {
  const videos = JSON.parse(read(`${original}/CATALOG.json`)).videos;
  const sections = read(`${original}/JULIUS_KNOWLEDGEBASE.md`)
    .split(/(?=^# )/m)
    .filter((section) =>
      /^- Video: https:\/\/www\.youtube\.com\/watch\?v=/m.test(section),
    );
  if (videos.length !== 202 || sections.length !== videos.length)
    throw Error("Expected 202 complete baseline source sections");
  for (const [index, video] of videos.entries()) {
    const sectionUrl = sections[index].match(/^- Video: (\S+)\s*$/m)?.[1];
    if (video.ordinal !== index + 1 || sectionUrl !== video.video_url)
      throw Error(
        `Baseline source ordering mismatch at V${String(index + 1).padStart(3, "0")}`,
      );
  }

  const manifest = JSON.parse(read(`${updates}/videos.json`));
  if (!Array.isArray(manifest))
    throw Error("Expected an array of reviewed video updates");
  const ids = new Set(videos.map((video) => video.video_id));
  for (const entry of manifest) {
    const {
      ordinal,
      video_id,
      title,
      channel,
      published_at,
      transcript_provenance,
      source_sha256,
      status,
    } = entry;
    if (typeof video_id !== "string" || !/^[A-Za-z0-9_-]{11}$/.test(video_id))
      throw Error("An archive update has an invalid YouTube video ID");
    if (ids.has(video_id))
      throw Error(`Duplicate archive video ID: ${video_id}`);
    if (ordinal !== videos.length + 1)
      throw Error(
        `Expected ordinal ${videos.length + 1} for archive video ${video_id}`,
      );
    const date = Date.parse(published_at);
    if (
      typeof published_at !== "string" ||
      !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(
        published_at,
      ) ||
      !Number.isFinite(date) ||
      new Date(date).toISOString().slice(0, 10) !== published_at.slice(0, 10)
    )
      throw Error(`Invalid publication date for archive video ${video_id}`);
    if (
      typeof title !== "string" ||
      !title.trim() ||
      !["main", "raw"].includes(channel) ||
      status !== "reviewed" ||
      typeof transcript_provenance !== "string" ||
      !Object.hasOwn(provenance, transcript_provenance) ||
      typeof source_sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(source_sha256)
    )
      throw Error(
        `Incomplete review or provenance for archive video ${video_id}`,
      );

    const section = read(`${updates}/${video_id}.md`);
    if (!/^\s*(?:- )?\[\d{2}:[0-5]\d:[0-5]\d\]\s+\S/m.test(section))
      throw Error(`Missing timestamped review for archive video ${video_id}`);
    ids.add(video_id);
    videos.push({
      ordinal,
      video_id,
      title,
      video_url: videoUrl + video_id,
      published_at_utc: published_at,
      consolidated_words: section.trim().split(/\s+/).length,
      update: { channel, provenance: provenance[transcript_provenance] },
    });
    sections.push(section);
  }
  return { videos, sections, updateCount: manifest.length };
}
