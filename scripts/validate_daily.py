#!/usr/bin/env python3
"""Validate an AI Daily Intelligence packet using only the Python standard library."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


def normalized_url(value: str) -> str:
    parts = urlsplit(value.strip())
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), parts.path.rstrip("/"), parts.query, ""))


def is_http_url(value: object) -> bool:
    if not isinstance(value, str):
        return False
    parts = urlsplit(value)
    return parts.scheme in {"http", "https"} and bool(parts.netloc)


def validate(packet: dict) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    required = {
        "schema_version", "date_kst", "generated_at", "status", "news",
        "business_ideas", "tools", "community", "skill_of_the_day",
        "worth_reading", "todays_insight", "build_candidate",
    }
    missing = sorted(required - packet.keys())
    if missing:
        errors.append(f"missing required fields: {', '.join(missing)}")
        return errors, warnings

    if packet["schema_version"] != "1.0":
        errors.append("schema_version must be 1.0")
    try:
        date.fromisoformat(packet["date_kst"])
    except (TypeError, ValueError):
        errors.append("date_kst must be YYYY-MM-DD")
    try:
        datetime.fromisoformat(str(packet["generated_at"]).replace("Z", "+00:00"))
    except ValueError:
        errors.append("generated_at must be ISO 8601")
    if packet["status"] not in {"complete", "partial"}:
        errors.append("status must be complete or partial")

    news = packet["news"]
    if not isinstance(news, list) or not 3 <= len(news) <= 5:
        errors.append("news must contain 3 to 5 items")
        news = news if isinstance(news, list) else []
    event_keys: set[str] = set()
    urls: set[str] = set()
    for index, item in enumerate(news):
        prefix = f"news[{index}]"
        for field in ("event_key", "title", "importance", "one_line_summary", "impact", "original_url", "key_quote", "quote_translation", "summary", "why_it_matters", "industry_mood", "outlook", "business_opportunity", "tags", "sources"):
            if field not in item:
                errors.append(f"{prefix}.{field} is required")
        key = str(item.get("event_key", "")).strip().lower()
        if key in event_keys:
            errors.append(f"duplicate event_key: {key}")
        event_keys.add(key)
        url = item.get("original_url")
        if not is_http_url(url):
            errors.append(f"{prefix}.original_url is invalid")
        else:
            norm = normalized_url(url)
            if norm in urls:
                errors.append(f"duplicate original_url: {norm}")
            urls.add(norm)
        sources = item.get("sources", [])
        if not sources:
            errors.append(f"{prefix}.sources must not be empty")
        for source_index, source in enumerate(sources):
            if not is_http_url(source.get("url")):
                errors.append(f"{prefix}.sources[{source_index}].url is invalid")
        if len(str(item.get("key_quote", "")).split()) > 25:
            warnings.append(f"{prefix}.key_quote exceeds 25 words")

    ideas = packet["business_ideas"]
    if not isinstance(ideas, list) or len(ideas) > 3:
        errors.append("business_ideas must contain 0 to 3 items")
        ideas = ideas if isinstance(ideas, list) else []
    candidate = packet["build_candidate"]
    if candidate is not None:
        if candidate.get("owner_action_required") is not True:
            errors.append("build_candidate.owner_action_required must be true")
        if candidate.get("status") != "waiting_for_owner":
            errors.append("build_candidate.status must be waiting_for_owner")
        if float(candidate.get("score", 0)) < 4.3:
            errors.append("build_candidate.score must be at least 4.3")
        evidence = candidate.get("evidence_urls", [])
        if len(evidence) < 2 or any(not is_http_url(url) for url in evidence):
            errors.append("build_candidate needs at least two valid evidence_urls")
        matched = next((idea for idea in ideas if idea.get("name") == candidate.get("idea_name")), None)
        if not matched:
            errors.append("build_candidate must reference a business idea")
        elif matched.get("stars") != 5 or matched.get("potential") != "Very High":
            errors.append("build candidate idea must have 5 stars and Very High potential")

    bookmark_types = {item.get("type") for item in packet["worth_reading"]}
    expected = {"Paper", "GitHub", "YouTube", "Blog"}
    if len(packet["worth_reading"]) != 4 or bookmark_types != expected:
        errors.append("worth_reading must contain Paper, GitHub, YouTube, and Blog exactly once each")
    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("packet", type=Path)
    args = parser.parse_args()
    try:
        packet = json.loads(args.packet.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    errors, warnings = validate(packet)
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    if errors:
        return 1
    print(f"VALID: {args.packet}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
