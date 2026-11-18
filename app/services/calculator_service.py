"""'How much would you weigh?' and 'How old would you be?' calculators.

Both calculators are simple, transparent scaling calculations. Neither
claims to model anything beyond basic gravitational scaling or orbital
period ratios — see the disclaimers returned alongside each result.
"""

import math

from app.services import data_service

EARTH_GRAVITY_MS2 = 9.81
EARTH_ORBITAL_PERIOD_DAYS = 365.25

# The bodies offered by both calculators, in display order.
_BODY_IDS = ["mercury", "venus", "earth", "moon", "mars", "jupiter", "saturn", "uranus", "neptune"]


class CalculatorError(ValueError):
    pass


def _bodies_gravity():
    """Returns an ordered list of {id, name, gravity_ms2} for each body."""
    bodies = []
    for bid in _BODY_IDS:
        if bid == "moon":
            m = data_service.get_moon("moon")
            bodies.append({"id": "moon", "name": "The Moon", "gravity_ms2": m["gravity_ms2"]})
        else:
            p = data_service.get_planet(bid)
            bodies.append({"id": bid, "name": p["name"], "gravity_ms2": p["stats"]["gravity_ms2"]})
    return bodies


def _bodies_orbital_period():
    """Returns an ordered list of {id, name, orbital_period_days} for each
    body with a defined orbit around the Sun (the Moon is excluded, since
    it orbits Earth rather than the Sun)."""
    bodies = []
    for bid in _BODY_IDS:
        if bid == "moon":
            continue
        p = data_service.get_planet(bid)
        bodies.append({"id": bid, "name": p["name"], "orbital_period_days": p["stats"]["orbital_period_days"]})
    return bodies


def calculate_weight(earth_weight: float) -> dict:
    if earth_weight is None:
        raise CalculatorError("Enter your weight on Earth first.")
    try:
        earth_weight = float(earth_weight)
    except (TypeError, ValueError):
        raise CalculatorError("Weight must be a number.")
    if not math.isfinite(earth_weight):
        raise CalculatorError("Weight must be a finite number.")
    if earth_weight <= 0:
        raise CalculatorError("Weight must be greater than zero.")
    if earth_weight > 100000:
        raise CalculatorError("Enter a realistic weight value.")

    results = []
    for body in _bodies_gravity():
        factor = body["gravity_ms2"] / EARTH_GRAVITY_MS2
        results.append({
            "id": body["id"],
            "name": body["name"],
            "gravity_ms2": body["gravity_ms2"],
            "factor": round(factor, 3),
            "equivalent_weight": round(earth_weight * factor, 2),
        })

    return {
        "input_weight": earth_weight,
        "results": results,
        "disclaimer": (
            "This shows how your weight (a gravitational force) would read on a scale "
            "at each body's surface gravity. Your mass does not change — only the local "
            "gravitational pull does."
        ),
    }


def calculate_age(earth_age: float) -> dict:
    if earth_age is None:
        raise CalculatorError("Enter your age in Earth years first.")
    try:
        earth_age = float(earth_age)
    except (TypeError, ValueError):
        raise CalculatorError("Age must be a number.")
    if not math.isfinite(earth_age):
        raise CalculatorError("Age must be a finite number.")
    if earth_age < 0:
        raise CalculatorError("Age cannot be negative.")
    if earth_age > 150:
        raise CalculatorError("Enter a realistic age in years.")

    earth_days = earth_age * EARTH_ORBITAL_PERIOD_DAYS
    results = []
    for body in _bodies_orbital_period():
        age_in_body_years = earth_days / body["orbital_period_days"]
        results.append({
            "id": body["id"],
            "name": body["name"],
            "orbital_period_days": body["orbital_period_days"],
            "age": round(age_in_body_years, 2),
        })

    return {
        "input_age": earth_age,
        "results": results,
        "disclaimer": (
            "Your age in 'planet years' is your exact time alive on Earth divided by "
            "how long that planet takes to orbit the Sun — it does not reflect biological aging."
        ),
    }
