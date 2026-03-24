"""Analytics module — full type hints for TypeScript generation.

Run:
  npx node-api-python generate-types ./examples/fullstack/analytics.py -o ./examples/fullstack/types/

This generates a .d.ts file with matching TypeScript types.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import TypedDict


class UserEvent(TypedDict):
    """A single user analytics event."""
    user_id: str
    action: str
    page: str
    timestamp: float


@dataclass
class AnalyticsReport:
    """Aggregated analytics report."""
    unique_users: int
    total_events: int
    top_page: str
    by_action: dict[str, int]
    by_page: dict[str, int]


def generate_report(events: list[UserEvent]) -> AnalyticsReport:
    """Generate an analytics report from a list of user events.

    Args:
        events: List of user events to analyze

    Returns:
        Aggregated analytics report
    """
    users = set()
    by_action: dict[str, int] = {}
    by_page: dict[str, int] = {}

    for event in events:
        users.add(event["user_id"])
        by_action[event["action"]] = by_action.get(event["action"], 0) + 1
        by_page[event["page"]] = by_page.get(event["page"], 0) + 1

    top_page = max(by_page, key=by_page.get) if by_page else ""

    return AnalyticsReport(
        unique_users=len(users),
        total_events=len(events),
        top_page=top_page,
        by_action=by_action,
        by_page=by_page,
    )


def filter_events(
    events: list[UserEvent],
    user_id: str | None = None,
    action: str | None = None,
    page: str | None = None,
) -> list[UserEvent]:
    """Filter events by criteria.

    Args:
        events: Events to filter
        user_id: Filter by user ID (optional)
        action: Filter by action type (optional)
        page: Filter by page (optional)
    """
    result = events
    if user_id:
        result = [e for e in result if e["user_id"] == user_id]
    if action:
        result = [e for e in result if e["action"] == action]
    if page:
        result = [e for e in result if e["page"] == page]
    return result
