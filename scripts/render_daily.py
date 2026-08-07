#!/usr/bin/env python3
"""Render the canonical daily JSON into GitHub and Notion Markdown views."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def link(title: str, url: str) -> str:
    return f"[{title}]({url})"


def render(packet: dict, notion: bool = False) -> str:
    date_kst = packet["date_kst"]
    lines = []
    if notion:
        lines += [
            '<callout icon="📌" color="blue_bg">',
            f'\t**{date_kst} · Git이 기록의 정본입니다.** 전체 이력은 [GitHub](https://github.com/Alliesy/ai-daily-intelligence)에서 확인하세요.',
            '</callout>',
        ]
    else:
        lines += [f"# AI Daily Intelligence · {date_kst}", "", f"> {packet['todays_insight']}"]

    lines += ["", "# Today's Top 5" if notion else "## Today's Top 5"]
    for index, item in enumerate(packet["news"], 1):
        lines += [
            f"### {index}. {link(item['title'], item['original_url'])}",
            f"**중요도 {item['importance']} · 영향도:** {item['impact']}",
            item["one_line_summary"],
        ]
        if not notion:
            lines += [f"- 왜 중요한가: {item['why_it_matters']}", f"- 전망: {item['outlook']}"]

    lines += ["", "# Business Radar" if notion else "## Business Radar"]
    if packet["business_ideas"]:
        for idea in packet["business_ideas"]:
            lines += [
                f"### {idea['name']} · {'★' * idea['stars']}",
                f"**가능성:** {idea['potential']} · **난이도:** {idea['difficulty']} · **고객:** {idea['customer']}",
                f"- 문제: {idea['problem']}",
                f"- 2주 MVP: {idea['mvp_2_weeks']}",
            ]
    else:
        lines.append("> 오늘은 강한 사업 기회 신호 없음")
    candidate = packet["build_candidate"]
    if candidate:
        lines += [
            '<callout icon="⏸️" color="orange_bg">' if notion else "> **사용자 지시 대기**",
            f"\t**구축 후보: {candidate['idea_name']}** · Notion 검토 후 Codex에 `설계 시작: {candidate['idea_name']}`이라고 지시하세요." if notion else f"> 구축 후보: {candidate['idea_name']} — 자동 설계/구현하지 않음",
            "</callout>" if notion else "",
        ]

    lines += ["", "# AI Tool Radar" if notion else "## AI Tool Radar"]
    for tool in packet["tools"]:
        lines.append(f"- {link(tool['name'], tool['url'])} · {'★' * tool['stars']} — {tool['why_trending']} / {tool['worth_trying']}")
    lines += ["", "# Community Pulse" if notion else "## Community Pulse"]
    for item in packet["community"]:
        lines.append(f"- **{item['platform']} · {item['mood']}** — {link(item['one_line_summary'], item['url'])}")
    skill = packet["skill_of_the_day"]
    lines += [
        "", "# AI Skill of the Day" if notion else "## AI Skill of the Day",
        f"### {skill['name']}", skill["when_to_use"],
        f"- 실무 예제: {skill['practical_example']}",
        f"- 프롬프트 예제: `{skill['prompt_example']}`",
        "", "# Worth Reading" if notion else "## Worth Reading",
    ]
    for item in packet["worth_reading"]:
        lines.append(f"- **{item['type']}** · {link(item['title'], item['url'])} — {item['why_read']}")
    lines += ["", "---", "", "# Today's Insight" if notion else "## Today's Insight", packet["todays_insight"]]
    if packet.get("warnings"):
        lines += ["", "## Warnings"] + [f"- {warning}" for warning in packet["warnings"]]
    return "\n".join(line for line in lines if line is not None).strip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("packet", type=Path)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    packet = json.loads(args.packet.read_text(encoding="utf-8"))
    year = packet["date_kst"][:4]
    report = args.root / "reports" / year / f"{packet['date_kst']}.md"
    report.parent.mkdir(parents=True, exist_ok=True)
    full = render(packet)
    report.write_text(full, encoding="utf-8")
    (args.root / "LATEST.md").write_text(full, encoding="utf-8")
    (args.root / "publish" / "notion-latest.md").write_text(render(packet, notion=True), encoding="utf-8")
    pointer = {"date_kst": packet["date_kst"], "data_path": args.packet.relative_to(args.root).as_posix(), "report_path": report.relative_to(args.root).as_posix(), "status": packet["status"]}
    (args.root / "latest.json").write_text(json.dumps(pointer, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
