"""Generates 'Identify the Object' mystery-planet challenges. A lightweight,
restrained discovery game over real planetary data — clues get vaguer as
difficulty increases, never fabricated (MASTER PROMPT §31, §72).
"""

import random

from app.services import data_service

DIFFICULTIES = ("easy", "medium", "hard", "expert")

EARTH_GRAVITY = 9.81


def _bucket_distance(km):
    if km < 250_000_000:
        return "the inner Solar System"
    if km < 900_000_000:
        return "the middle Solar System"
    return "the outer Solar System"


def _bucket_temp(c):
    if c > 100:
        return "scorching"
    if c > -50:
        return "temperate to cool"
    return "frigid"


def _bucket_gravity(g):
    if g > EARTH_GRAVITY * 1.5:
        return "notably stronger than Earth's"
    if g < EARTH_GRAVITY * 0.5:
        return "notably weaker than Earth's"
    return "roughly Earth-like"


def _clues_for(planet, difficulty):
    stats = planet["stats"]
    if difficulty == "easy":
        return [
            {"label": "Category", "value": planet["category"]},
            {"label": "Diameter", "value": f"{stats['diameter_km']:,} km"},
            {"label": "Distance from Sun", "value": f"{stats['distance_km']:,} km"},
            {"label": "Moons", "value": str(stats["moons"])},
            {"label": "Rings", "value": "Yes" if stats["rings"] else "No"},
        ]
    if difficulty == "medium":
        return [
            {"label": "Category", "value": planet["category"]},
            {"label": "Region", "value": _bucket_distance(stats["distance_km"])},
            {"label": "Average Temperature", "value": _bucket_temp(stats["temp_c_avg"])},
            {"label": "Moons", "value": str(stats["moons"])},
        ]
    if difficulty == "hard":
        return [
            {"label": "Region", "value": _bucket_distance(stats["distance_km"])},
            {"label": "Surface Gravity", "value": _bucket_gravity(stats["gravity_ms2"])},
            {"label": "Rings", "value": "Yes" if stats["rings"] else "No"},
        ]
    return [
        {"label": "Region", "value": _bucket_distance(stats["distance_km"])},
        {"label": "Average Temperature", "value": _bucket_temp(stats["temp_c_avg"])},
    ]


def generate_mystery(difficulty: str = "medium") -> dict:
    difficulty = (difficulty or "medium").lower()
    if difficulty not in DIFFICULTIES:
        difficulty = "medium"

    planets = data_service.get_all_planets()
    answer = random.choice(planets)

    distractor_pool = [p for p in planets if p["id"] != answer["id"]]
    distractors = random.sample(distractor_pool, k=min(3, len(distractor_pool)))
    options = [{"id": answer["id"], "name": answer["name"]}] + [{"id": p["id"], "name": p["name"]} for p in distractors]
    random.shuffle(options)

    return {
        "difficulty": difficulty,
        "clues": _clues_for(answer, difficulty),
        "options": options,
        "answer_id": answer["id"],
        "answer_name": answer["name"],
        "explanation": f"{answer['name']} is {answer['position_label'].lower()}, a {answer['category'].lower()} with {answer['stats']['moons']} known moon(s) and an average temperature of {answer['stats']['temp_c_avg']}°C.",
        "url": f"/planet/{answer['id']}",
    }
