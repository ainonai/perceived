"""Prepare an offline editorial source plan for the Julius archive."""

import argparse
from datetime import date
import json
from pathlib import Path
import re
from urllib.parse import parse_qs, urlsplit


SITE = Path(__file__).resolve().parents[1]
VIDEO_ID = re.compile(r"[A-Za-z0-9_-]{11}")


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def youtube_id(value):
    if VIDEO_ID.fullmatch(value):
        return value
    parsed = urlsplit(value)
    if parsed.hostname in {"www.youtube.com", "youtube.com", "m.youtube.com"}:
        identity = parse_qs(parsed.query).get("v", [""])[0]
    elif parsed.hostname == "youtu.be":
        identity = parsed.path.strip("/")
    else:
        identity = ""
    if not VIDEO_ID.fullmatch(identity):
        raise ValueError(f"Expected a YouTube video ID or watch URL: {value}")
    return identity


def clock(value):
    parts = str(value).split(":")
    if (
        not 1 <= len(parts) <= 3 or not all(part.isdecimal() for part in parts)
        or any(int(part) >= 60 for part in parts[1:])
    ):
        raise ValueError(f"Invalid timestamp: {value}")
    seconds = 0
    for part in parts:
        seconds = seconds * 60 + int(part)
    return seconds


def stamp(seconds):
    minutes, seconds = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours:02}:{minutes:02}:{seconds:02}"


def indexed_sources(roots):
    result = {}
    for root in roots:
        root = root.resolve()
        for row in read_json(root / "manifest.json").values():
            identity = row["video_id"]
            if not VIDEO_ID.fullmatch(identity):
                raise ValueError("The source manifest contains an invalid video ID.")
            if identity not in result or result[identity][1]["status"] != "ok":
                result[identity] = (root, row)
    return result


def day(row):
    return (row.get("published_at_utc") or row.get("published_at") or row.get("published_date") or "")[:10]


def published_catalog():
    baseline = read_json(SITE / "original/SOURCE_CORPUS/CATALOG.json")["videos"]
    additions = read_json(SITE / "editorial/updates/videos.json")
    return {row["video_id"]: row for row in [*baseline, *additions]}


def source_file(root, row):
    if not row.get("json_path"):
        return None
    path = (root / row["json_path"]).resolve()
    if not path.is_relative_to(root):
        raise ValueError(f"Transcript path escapes the supplied source folder for {row['video_id']}.")
    return path


def describe(identity, catalog, inventory, anchors):
    published = catalog.get(identity)
    item = inventory.get(identity)
    base = f"https://www.youtube.com/watch?v={identity}"
    label = f"V{published['ordinal']:03}" if published else "Proposed addition"
    title = (published or (item[1] if item else {})).get("title", identity)
    print(f"\n## {label} · {title}")
    print(f"- Video: {base}")
    if not item:
        print("- Source status: absent from the supplied source inventories")
        return
    root, row = item
    print(f"- Publication: {day(row) or 'date unavailable'}")
    print(f"- Source status: {row['status']}")
    if row["status"] != "ok":
        return
    path = source_file(root, row)
    if not path or not path.is_file():
        print("- Timed caption file is missing from this source kit")
        return
    raw = read_json(path)
    if raw["video_id"] != identity:
        raise ValueError(f"Timed source ID does not match the manifest for {identity}.")
    cues = raw["segments"]
    print(f"- Timed source: {path} ({len(cues)} cues)")
    print(f"- Caption provenance: {row.get('transcript_source') or 'archived captions'}")
    terra = root.parent / "julius_analysis/faithful_pilot_v2/gpt-6.1-terra" / identity / "video_consolidated.md"
    if terra.is_file():
        print(f"- Saved Terra consolidation: {terra}")
    for center in anchors:
        print(f"\n[{stamp(center)}]({base}&t={center}s) · timed context")
        for cue in cues:
            if center - 12 <= cue["start"] <= center + 20:
                print(f"- [{stamp(cue['start'])}] {cue['text']}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, action="append", required=True,
                        help="Private directory with a manifest.json. Repeat to add refresh caches.")
    parser.add_argument("--video", action="append", default=[], help="Video ID or watch URL. Repeat as needed.")
    parser.add_argument("--at", action="append", default=[], metavar="VIDEO_ID@TIME",
                        help="Show adjacent raw cues around seconds or HH:MM:SS.")
    parser.add_argument("--after", type=date.fromisoformat,
                        help="Only propose uploads after this date. Without it, include the last archive day.")
    parser.add_argument("--limit", type=int, default=10, help="Maximum proposed uploads for batch mode.")
    args = parser.parse_args()
    if not 1 <= args.limit <= 30:
        parser.error("Use a limit between 1 and 30.")
    try:
        catalog = published_catalog()
        inventory = indexed_sources(args.archive)
        anchors = {}
        for request in args.at:
            identity, time = request.rsplit("@", 1)
            anchors.setdefault(youtube_id(identity), []).append(clock(time))
        ids = list(dict.fromkeys([*(youtube_id(value) for value in args.video), *anchors]))
        if not ids:
            cutoff = args.after.isoformat() if args.after else max(map(day, catalog.values()), default="")
            candidates = sorted(
                (day(row), identity) for identity, (_, row) in inventory.items()
                if identity not in catalog and day(row)
                and (day(row) > cutoff or (not args.after and day(row) == cutoff))
            )
            ids = [identity for _, identity in candidates[:args.limit]]
            boundary = "after" if args.after else "from"
            print(f"# Archive batch · {len(ids)} candidates {boundary} {cutoff or 'the baseline'}")
        else:
            print(f"# Editorial source review · {len(ids)} selected")
        print("\nLocal source plan. Review the captions and adjacent material before changing display copy or map edges.")
        for identity in ids:
            describe(identity, catalog, inventory, anchors.get(identity, []))
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.exit(1, f"{error}\n")


if __name__ == "__main__":
    main()
