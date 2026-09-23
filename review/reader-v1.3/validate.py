"""Validate V1.3 review fixtures; never publish or modify archive files."""
import argparse
import copy
import json
import re
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

parser = argparse.ArgumentParser()
parser.add_argument("--baseline-root", type=Path, required=True)
parser.add_argument("--baseline-schema", type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[2]
schema = json.loads((root / "schema/daily.schema.json").read_text())
old_schema = json.loads(args.baseline_schema.read_text())
Draft202012Validator.check_schema(schema)
validator = Draft202012Validator(schema, format_checker=FormatChecker())
old_validator = Draft202012Validator(old_schema, format_checker=FormatChecker())
stripped_schema = copy.deepcopy(schema)
del stripped_schema["$defs"]["reader"]
del stripped_schema["$defs"]["news"]["properties"]["reader"]
assert stripped_schema == old_schema, "Unexpected non-additive schema change"
results = []
for path in sorted((root / "review/reader-v1.3/packets").glob("*.json")):
    packet = json.loads(path.read_text())
    baseline = json.loads((args.baseline_root / path.name).read_text())
    old_validator.validate(baseline)
    validator.validate(baseline)
    validator.validate(packet)
    old_validator.validate(packet)
    stripped = copy.deepcopy(packet)
    rows = []
    for news in stripped["news"]:
        reader = news.pop("reader")
        paragraphs = reader["body"].split("\n\n")
        assert 3 <= len(paragraphs) <= 7
        counts = [len(re.findall(r"[.!?](?=\s|$)", p)) for p in paragraphs]
        assert all(2 <= n <= 4 for n in counts), (news["event_key"], counts)
        assert not re.search(r"FACT:|INTERPRETATION:|SIGNAL:|SPECULATION:", reader["body"])
        sentences = []
        for field in ("headline", "dek", "body", "why_it_matters", "outlook", "action"):
            for sentence in re.split(r"(?<=[.!?])\s+|\n\n", reader[field] or ""):
                normalized = re.sub(r"\s+", " ", sentence).strip()
                if normalized:
                    sentences.append((field, normalized))
        texts = [value for _, value in sentences]
        assert len(texts) == len(set(texts)), ("exact repeated sentence", news["event_key"])
        rows.append({"event_key": news["event_key"], "paragraphs": len(paragraphs),
                     "sentences_per_paragraph": counts, "exact_duplicate_sentences": 0})
    assert stripped == baseline, "Legacy payload changed"
    results.append({"date": packet["date_kst"], "events": rows, "legacy_preserved": True,
                    "old_and_new_schema_valid": True})
sample = json.loads(next((root / "review/reader-v1.3/packets").glob("*.json")).read_text())
negative_cases = {}
for name, mutate in [
    ("missing_body", lambda r: r.pop("body")),
    ("wrong_version", lambda r: r.update(version="2.0")),
    ("empty_body", lambda r: r.update(body="")),
    ("numeric_action", lambda r: r.update(action=42)),
    ("unknown_reader_field", lambda r: r.update(extra=True)),
]:
    invalid = copy.deepcopy(sample)
    mutate(invalid["news"][0]["reader"])
    rejected = not validator.is_valid(invalid)
    assert rejected, name
    negative_cases[name] = "rejected"
print(json.dumps({"status": "passed", "schema_version": "1.0",
 "schema_change": "two_additive_elements_only", "days": results,
 "negative_cases": negative_cases,
 "limitations": ["Exact duplicate detection is not semantic duplicate proof.",
                 "No live importer, database, browser, non-developer or audio test."]},
 ensure_ascii=False, indent=2))
