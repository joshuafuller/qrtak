#!/usr/bin/env python3
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent

PAIR_RE = re.compile(r"^\s*'([^']+)'\s*,\s*'([^']+)'\s*$")


def normalize_version(raw: str) -> str:
    """Normalize raw version strings to X.X (major.minor)."""
    # Extract all digit groups
    nums = re.findall(r"\d+", raw)
    if not nums:
        return raw
    major = int(nums[0])
    minor = int(nums[1]) if len(nums) > 1 else 0
    return f"{major}.{minor}"


def is_likely_key(s: str) -> bool:
    # Keys typically: no spaces, alnum underscore dot dash; often mixedCase or underscores
    if not re.match(r"^[A-Za-z0-9_.-]+$", s):
        return False
    return True


def parse_line(line: str):
    m = PAIR_RE.match(line)
    if not m:
        return None
    a, b = m.group(1).strip(), m.group(2).strip()
    # Heuristic: prefer the token that looks like a key
    a_key = is_likely_key(a)
    b_key = is_likely_key(b)
    if a_key and not b_key:
        return {"key": a, "label": b}
    if b_key and not a_key:
        return {"key": b, "label": a}
    # Tie-breaker: fewer spaces is likely key
    if a.count(" ") < b.count(" "):
        return {"key": a, "label": b}
    if b.count(" ") < a.count(" "):
        return {"key": b, "label": a}
    # Fallback: treat first as label then key
    # Many files use 'Label','key'
    return {"key": b, "label": a}


def gather_preferences():
    version_to_entries = defaultdict(dict)  # version -> key -> label
    label_votes = defaultdict(Counter)      # key -> Counter(label)

    for path in ROOT.glob("*.txt"):
        # derive version from filename
        # examples: 5.5-prefs.txt, 5.4.0-prefs.txt, 5.2.0.0-prefs.txt, 5.0-preferences.txt, 4.8.1-preferences.txt
        version_raw = path.stem.split("-")[0]
        version = normalize_version(version_raw)

        with path.open("r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                parsed = parse_line(line)
                if not parsed:
                    continue
                key = parsed["key"].strip()
                label = parsed["label"].strip()
                if not key or not label:
                    continue
                version_to_entries[version][key] = label
                label_votes[key][label] += 1

    # Choose canonical label per key by most common label
    canonical_label = {k: votes.most_common(1)[0][0] for k, votes in label_votes.items()}

    # Build preferencesByVersion as sorted lists
    preferences_by_version = {}
    all_versions = sorted(version_to_entries.keys(), key=lambda v: tuple(map(int, v.split("."))), reverse=True)
    for v in all_versions:
        entries = version_to_entries[v]
        normalized_list = [
            {"key": k, "label": canonical_label.get(k, lbl)}
            for k, lbl in entries.items()
        ]
        normalized_list.sort(key=lambda x: (x["label"].lower(), x["key"]))
        preferences_by_version[v] = normalized_list

    # Build preferenceIndex: list of {key, label, versions: [..]}
    key_to_versions = defaultdict(list)
    for v, items in preferences_by_version.items():
        for item in items:
            key_to_versions[item["key"]].append(v)

    preference_index = [
        {
            "key": k,
            "label": canonical_label.get(k, k),
            "versions": sorted(set(vs), key=lambda v: tuple(map(int, v.split("."))), reverse=True)
        }
        for k, vs in key_to_versions.items()
    ]
    preference_index.sort(key=lambda x: (x["label"].lower(), x["key"]))

    return {
        "versions": all_versions,
        "preferencesByVersion": preferences_by_version,
        "preferenceIndex": preference_index,
        "metadata": {
            "source": "generated from docs/prefs/*.txt",
            "description": "Normalized ATAK preferences with version lists (X.X)",
        },
    }


def main():
    data = gather_preferences()
    out_path = ROOT / "atak-preferences.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()


