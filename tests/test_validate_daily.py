import copy
import importlib.util
import unittest
from pathlib import Path


SPEC = importlib.util.spec_from_file_location("validate_daily", Path(__file__).parents[1] / "scripts" / "validate_daily.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def packet():
    source = {"title": "Official", "url": "https://example.com/source", "publisher": "Example", "published_at": "2026-08-07", "tier": "A"}
    news = []
    for index in range(3):
        news.append({
            "event_key": f"event-{index}", "title": f"News {index}", "importance": "A",
            "one_line_summary": "Summary", "impact": "High", "original_url": f"https://example.com/news/{index}",
            "key_quote": "A short quote", "quote_translation": "짧은 인용", "summary": "Full summary",
            "why_it_matters": "Reason", "industry_mood": {"GitHub": "positive"}, "outlook": "Outlook",
            "business_opportunity": "Opportunity", "tags": ["Agent"], "sources": [copy.deepcopy(source)],
        })
    idea = {"name": "Idea", "score": 4.5, "stars": 5, "potential": "Very High", "difficulty": "Medium", "customer": "Teams", "problem": "Problem", "competitors": [], "differentiation": "Diff", "mvp_2_weeks": "MVP", "monetization": "SaaS", "falsification": "No demand"}
    return {
        "schema_version": "1.0", "date_kst": "2026-08-07", "generated_at": "2026-08-07T07:00:00+09:00", "status": "complete", "warnings": [],
        "news": news, "business_ideas": [idea], "tools": [], "community": [],
        "skill_of_the_day": {"name": "RAG", "when_to_use": "Grounding", "practical_example": "Search", "prompt_example": "Use sources"},
        "worth_reading": [
            {"type": kind, "title": kind, "url": f"https://example.com/{kind.lower()}", "why_read": "Useful"}
            for kind in ("Paper", "GitHub", "YouTube", "Blog")
        ],
        "todays_insight": "This is a sufficiently useful daily insight.",
        "build_candidate": {"idea_name": "Idea", "score": 4.5, "owner_action_required": True, "status": "waiting_for_owner", "evidence_urls": ["https://example.com/a", "https://example.com/b"]},
    }


class ValidationTests(unittest.TestCase):
    def test_valid_packet(self):
        errors, _ = MODULE.validate(packet())
        self.assertEqual([], errors)

    def test_duplicate_event_and_url(self):
        value = packet()
        value["news"][1]["event_key"] = value["news"][0]["event_key"]
        value["news"][1]["original_url"] = value["news"][0]["original_url"] + "/"
        errors, _ = MODULE.validate(value)
        self.assertTrue(any("duplicate event_key" in error for error in errors))
        self.assertTrue(any("duplicate original_url" in error for error in errors))

    def test_candidate_cannot_skip_owner_gate(self):
        value = packet()
        value["build_candidate"]["owner_action_required"] = False
        value["build_candidate"]["status"] = "building"
        errors, _ = MODULE.validate(value)
        self.assertTrue(any("owner_action_required" in error for error in errors))
        self.assertTrue(any("waiting_for_owner" in error for error in errors))

    def test_fewer_than_three_news_fails(self):
        value = packet()
        value["news"] = value["news"][:2]
        errors, _ = MODULE.validate(value)
        self.assertTrue(any("3 to 5" in error for error in errors))

    def test_missing_reading_type_fails(self):
        value = packet()
        value["worth_reading"] = value["worth_reading"][:3]
        value["worth_reading"][0]["type"] = "Blog"
        errors, _ = MODULE.validate(value)
        self.assertTrue(any("exactly once" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
