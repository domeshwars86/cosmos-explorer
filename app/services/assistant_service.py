"""COSMOS Knowledge Engine — a deterministic, rule-based question answerer
over this site's own astronomy dataset.

This is explicitly NOT a large language model or any external AI service —
see MASTER PROMPT §52/§53. It matches a question against a small set of
patterns (superlatives like "hottest planet", or "<stat> of <planet>"
lookups) and computes the answer directly from app/data/*.json, the same
dataset every other page on the site uses. The `AstronomyAssistantService`
class is deliberately isolated behind a simple `ask(question) -> dict`
interface so that, if a real AI backend is ever added later, it can sit
behind the same call signature without the frontend needing to change.
"""

import re

from app.services import data_service

_SUPERLATIVES = [
    (re.compile(r"\b(hottest|warmest)\b.*\bplanet\b|\bplanet\b.*\b(hottest|warmest)\b"),
     lambda: _describe_extreme("temp_c_avg", "max", "the hottest planet", "°C average temperature")),
    (re.compile(r"\b(coldest)\b.*\bplanet\b|\bplanet\b.*\b(coldest)\b"),
     lambda: _describe_extreme("temp_c_avg", "min", "the coldest planet", "°C average temperature")),
    (re.compile(r"\b(largest|biggest)\b.*\bplanet\b|\bplanet\b.*\b(largest|biggest)\b"),
     lambda: _describe_extreme("diameter_km", "max", "the largest planet", "km in diameter")),
    (re.compile(r"\b(smallest)\b.*\bplanet\b|\bplanet\b.*\b(smallest)\b"),
     lambda: _describe_extreme("diameter_km", "min", "the smallest planet", "km in diameter")),
    (re.compile(r"\b(strongest)\b.*\bgravity\b"),
     lambda: _describe_extreme("gravity_ms2", "max", "the strongest surface gravity", "m/s²")),
    (re.compile(r"\b(weakest)\b.*\bgravity\b"),
     lambda: _describe_extreme("gravity_ms2", "min", "the weakest surface gravity", "m/s²")),
    (re.compile(r"\b(most)\b.*\bmoons\b"),
     lambda: _describe_extreme("moons", "max", "the most known moons", "moons", verb="has")),
    (re.compile(r"\b(fewest|least)\b.*\bmoons\b"),
     lambda: _describe_extreme("moons", "min", "the fewest known moons", "moons", verb="has")),
    (re.compile(r"\b(closest|nearest)\b.*\bsun\b"),
     lambda: _describe_extreme("distance_km", "min", "the closest planet to the Sun", "km from the Sun")),
    (re.compile(r"\b(farthest|furthest)\b.*\bsun\b"),
     lambda: _describe_extreme("distance_km", "max", "the farthest planet from the Sun", "km from the Sun")),
    (re.compile(r"\bred planet\b"), lambda: _fixed_answer("mars", "Mars is nicknamed \"the Red Planet\" because iron oxide (rust) in its surface dust gives it a reddish color.")),
    (re.compile(r"\bblue planet\b"), lambda: _fixed_answer("earth", "Earth is sometimes called \"the Blue Planet\" because oceans cover about 71% of its surface.")),
]

_STAT_QUESTIONS = [
    (re.compile(r"\b(year|orbital period|orbit)\b"), "orbital_period_days", "an orbital period of {value} Earth days"),
    (re.compile(r"\b(rotat(e|ion)|day length|length of a day|spin)\b"), "rotation_period_hours", "a rotation period of {value} hours"),
    (re.compile(r"\b(gravity|weigh)\b"), "gravity_ms2", "a surface gravity of {value} m/s²"),
    (re.compile(r"\b(moons?)\b"), "moons", "{value} known moon(s)"),
    (re.compile(r"\b(diameter|big|size|large)\b"), "diameter_km", "a diameter of {value:,} km"),
    (re.compile(r"\b(temperature|hot|cold)\b"), "temp_c_avg", "an average temperature of {value}°C"),
    (re.compile(r"\b(distance|far)\b"), "distance_km", "an average distance of {value:,} km from the Sun"),
    (re.compile(r"\bring"), "rings", None),  # handled specially below
]


def _fixed_answer(planet_id, text):
    p = data_service.get_planet(planet_id)
    return {"answer": text, "subject": p["name"] if p else planet_id, "url": f"/planet/{planet_id}" if p else None}


def _describe_extreme(stat_key, mode, label, unit_suffix, verb="is"):
    p = data_service.get_extreme_planet(stat_key, mode)
    if not p:
        return None
    value = p["stats"].get(stat_key)
    value_str = f"{value:,}" if isinstance(value, (int, float)) and abs(value) >= 1000 else str(value)
    return {
        "answer": f"{p['name']} {verb} {label} in our Solar System, at {value_str} {unit_suffix}.",
        "subject": p["name"],
        "url": f"/planet/{p['id']}",
    }


def _find_planet_in_text(text):
    for planet in data_service.get_all_planets():
        if planet["name"].lower() in text:
            return planet
    return None


def _answer_stat_question(text, planet):
    for pattern, stat_key, template in _STAT_QUESTIONS:
        if not pattern.search(text):
            continue
        if stat_key == "rings":
            has_rings = planet["stats"]["rings"]
            return {
                "answer": f"{'Yes — ' if has_rings else 'No — '}{planet['name']} {'has a ring system.' if has_rings else 'does not have a visible ring system.'}",
                "subject": planet["name"],
                "url": f"/planet/{planet['id']}",
            }
        value = planet["stats"].get(stat_key)
        if value is None:
            continue
        try:
            phrase = template.format(value=value)
        except (ValueError, TypeError):
            phrase = template.format(value=str(value))
        return {
            "answer": f"{planet['name']} has {phrase}.",
            "subject": planet["name"],
            "url": f"/planet/{planet['id']}",
        }
    return None


class AstronomyAssistantService:
    """Deterministic question-answering over the local astronomy dataset.

    Usage:
        result = AstronomyAssistantService().ask("Which planet is hottest?")
        # {"matched": True, "answer": "...", "subject": "Venus", "url": "/planet/venus"}
    """

    SUGGESTED_QUESTIONS = [
        "Which planet is hottest?",
        "Which planet has the most moons?",
        "How long is a year on Mars?",
        "How many moons does Jupiter have?",
        "Which planet has the strongest gravity?",
        "What is the diameter of Saturn?",
        "Does Uranus have rings?",
        "How far is Neptune from the Sun?",
    ]

    def ask(self, question: str) -> dict:
        if not question or not question.strip():
            return self._miss(question)
        text = question.strip().lower()

        for pattern, handler in _SUPERLATIVES:
            if pattern.search(text):
                result = handler()
                if result:
                    return {"matched": True, "question": question, **result}

        planet = _find_planet_in_text(text)
        if planet:
            result = _answer_stat_question(text, planet)
            if result:
                return {"matched": True, "question": question, **result}
            return {
                "matched": True,
                "question": question,
                "answer": f"{planet['name']} is a {planet['category'].lower()}, {planet['position_label'].lower()}. {planet['short_description']}",
                "subject": planet["name"],
                "url": f"/planet/{planet['id']}",
            }

        if "sun" in text:
            sun = data_service.get_sun()
            return {
                "matched": True, "question": question,
                "answer": f"The Sun is a {sun['type']}, about {sun['stats']['diameter_km']:,} km across, with a surface temperature of roughly {sun['stats']['surface_temp_c']:,}°C.",
                "subject": "The Sun", "url": "/sun",
            }
        if "moon" in text and "moons" not in text:
            moon = data_service.get_moon("moon")
            return {
                "matched": True, "question": question,
                "answer": f"The Moon is Earth's only natural satellite, about {moon['diameter_km']:,} km across, orbiting roughly every {moon['orbital_period_days']} days.",
                "subject": "The Moon", "url": "/moon/moon",
            }

        return self._miss(question)

    def _miss(self, question):
        return {
            "matched": False,
            "question": question,
            "answer": "I don't have a direct answer for that yet. Try asking about a planet's size, gravity, moons, temperature, rings, or orbit — for example, \"How long is a year on Mars?\"",
            "subject": None,
            "url": None,
            "suggestions": self.SUGGESTED_QUESTIONS,
        }


assistant = AstronomyAssistantService()
