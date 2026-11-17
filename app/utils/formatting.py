"""Number formatting helpers exposed to Jinja templates as filters."""


def compact_km(value) -> str:
    """Formats a kilometer distance compactly for display in tight UI
    spaces, e.g. 4500000000 -> "4.50B", 149600000 -> "149.6M", 57900 ->
    "57.9K". Falls back to a plain comma-grouped number for small values.
    """
    if value is None:
        return "—"
    try:
        v = float(value)
    except (TypeError, ValueError):
        return str(value)

    sign = "-" if v < 0 else ""
    v = abs(v)

    if v >= 1_000_000_000:
        return f"{sign}{v / 1_000_000_000:.2f}B"
    if v >= 1_000_000:
        return f"{sign}{v / 1_000_000:.1f}M"
    if v >= 1_000:
        return f"{sign}{v / 1_000:.1f}K"
    return f"{sign}{v:,.0f}"


def with_commas(value) -> str:
    """Formats a number with thousands separators, e.g. 4500000000 ->
    "4,500,000,000". Used for exact figures shown in tooltips/titles."""
    if value is None:
        return "—"
    try:
        v = float(value)
    except (TypeError, ValueError):
        return str(value)
    if v == int(v):
        return f"{int(v):,}"
    return f"{v:,.2f}"
