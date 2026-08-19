"""
Citation formatting and filtering.
Only shows citations when evidence is strong enough to support the answer.
"""


def filter_citations_by_answer(citations_list, answer_text, evidence_strength):
    """
    Filter citations to only include those that actually support the answer.
    If evidence is weak/insufficient, return empty list (no citations shown).
    If evidence is strong/moderate, deduplicate and return unique citations.
    """
    if evidence_strength in ("weak", "insufficient"):
        return []

    seen = set()
    unique = []
    for c in citations_list:
        key = c["document"]
        if key not in seen:
            seen.add(key)
            unique.append(c)

    return unique


def format_citations_text(citations_list, lang="en"):
    """Format citations as readable text for the user."""
    if not citations_list:
        return ""

    lines = []
    for i, c in enumerate(citations_list, 1):
        doc = c["document"]
        page = c["page"]
        score = c.get("relevance_score", 0)
        category = c.get("category", "")

        if lang == "ar":
            cat_ar = {
                "healthcare": "صحة",
                "nutrition": "تغذية",
                "food": "غذاء",
                "laboratory": "مختبر",
                "other": "أخرى",
            }.get(category, "")
            cat_display = f" | الفئة: {cat_ar}" if cat_ar else ""
            lines.append(
                f"{i}. المصدر: {doc} | صفحة: {page} | الصلة: {score:.0%}{cat_display}"
            )
        else:
            cat_display = f" | Category: {category}" if category else ""
            lines.append(
                f"{i}. Source: {doc} | Page: {page} | Relevance: {score:.0%}{cat_display}"
            )

    return "\n".join(lines)
