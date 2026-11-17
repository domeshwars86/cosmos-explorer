"""Deterministically generates a simulated space mission profile from a
few user selections. Every generated mission is clearly labeled as a
simulation — this is an educational exercise in mission design, not a
real trajectory planner (MASTER PROMPT §25).
"""

import hashlib

from app.services import data_service

MISSION_TYPES = {
    "flyby": "Flyby",
    "orbiter": "Orbiter",
    "lander": "Lander",
    "rover": "Rover",
    "sample_return": "Sample Return",
}

SPACECRAFT_TYPES = {
    "probe": "Robotic Probe",
    "orbiter_class": "Orbiter Spacecraft",
    "lander_class": "Static Lander",
    "rover_class": "Mobile Rover",
    "crewed": "Crewed Spacecraft (conceptual)",
}

OBJECTIVES = {
    "water": "Search for evidence of past or present water",
    "atmosphere": "Study atmospheric composition and weather patterns",
    "geology": "Map surface geology and composition",
    "biosignatures": "Search for potential biosignatures",
    "magnetosphere": "Study the magnetic field and radiation environment",
    "technology": "Test new propulsion or communication technology",
}

# A representative average interplanetary cruise speed, used only to produce
# a rough order-of-magnitude travel estimate — not a real trajectory
# calculation (which would use gravity-assisted, curved transfer orbits).
ASSUMED_CRUISE_SPEED_KMS = 16

_ADJECTIVES = ["Silent", "Distant", "Bright", "Steady", "Bold", "Quiet", "Keen", "Swift", "Faithful", "Curious"]
_NOUNS = ["Horizon", "Beacon", "Compass", "Voyager", "Sentinel", "Pathfinder", "Aurora", "Meridian", "Odyssey", "Vanguard"]


class MissionBuilderError(ValueError):
    pass


def _destination_lookup(destination_id):
    destination_id = (destination_id or "").lower()
    planet = data_service.get_planet(destination_id)
    if planet:
        return {
            "id": planet["id"], "name": planet["name"], "kind": "planet",
            "distance_km": planet["stats"]["distance_km"], "url": f"/planet/{planet['id']}",
        }
    moon = data_service.get_moon(destination_id)
    if moon:
        parent = data_service.get_planet(moon["parent"])
        distance = (parent["stats"]["distance_km"] if parent else 0) + moon["distance_km"]
        return {"id": moon["id"], "name": moon["name"], "kind": "moon", "distance_km": distance, "url": f"/moon/{moon['id']}"}
    dwarf = data_service.get_dwarf_planet(destination_id)
    if dwarf:
        return {"id": dwarf["id"], "name": dwarf["name"], "kind": "dwarf planet", "distance_km": dwarf["distance_km"], "url": f"/dwarf-planet/{dwarf['id']}"}
    return None


def _codename(seed_text: str) -> str:
    digest = hashlib.sha1(seed_text.encode("utf-8")).hexdigest()
    a = _ADJECTIVES[int(digest[:4], 16) % len(_ADJECTIVES)]
    n = _NOUNS[int(digest[4:8], 16) % len(_NOUNS)]
    return f"{a} {n}"


def build_mission(destination_id: str, mission_type: str, spacecraft_type: str, objective_key: str) -> dict:
    destination = _destination_lookup(destination_id)
    if not destination:
        raise MissionBuilderError(f"Unknown destination: '{destination_id}'.")
    if mission_type not in MISSION_TYPES:
        raise MissionBuilderError("Choose a valid mission type.")
    if spacecraft_type not in SPACECRAFT_TYPES:
        raise MissionBuilderError("Choose a valid spacecraft type.")
    if objective_key not in OBJECTIVES:
        raise MissionBuilderError("Choose a valid mission objective.")

    mission_type_label = MISSION_TYPES[mission_type]
    spacecraft_label = SPACECRAFT_TYPES[spacecraft_type]
    objective_label = OBJECTIVES[objective_key]

    codename = _codename(f"{destination['id']}-{mission_type}-{spacecraft_type}-{objective_key}")
    mission_name = f"{codename} — {mission_type_label} Mission to {destination['name']}"

    distance_km = destination["distance_km"]
    travel_seconds = distance_km / ASSUMED_CRUISE_SPEED_KMS if distance_km else 0
    travel_days = travel_seconds / 86400

    stages = [
        {"stage": "Launch", "description": f"{spacecraft_label} launches from Earth and enters its transfer trajectory toward {destination['name']}."},
        {"stage": "Cruise", "description": f"Approximately {_format_duration(travel_days)} of interplanetary cruise, using this simulation's simplified straight-line distance estimate."},
        {"stage": "Arrival", "description": _arrival_description(mission_type_label, destination["name"])},
        {"stage": "Science Operations", "description": objective_label + f", focused on {destination['name']}."},
        {"stage": "Mission Status", "description": "End of simulated profile — a real mission's outcome would depend on engineering, funding, and discoveries made along the way."},
    ]

    return {
        "mission_name": mission_name,
        "destination": destination,
        "mission_type": mission_type_label,
        "spacecraft_type": spacecraft_label,
        "objective": objective_label,
        "travel_estimate_days": round(travel_days, 1),
        "travel_estimate_label": _format_duration(travel_days),
        "stages": stages,
        "disclaimer": "SIMULATED MISSION — this is an educational mission-design exercise. The travel estimate uses a simplified straight-line distance and an assumed constant cruise speed, not a real gravity-assisted trajectory calculation.",
    }


def _format_duration(days: float) -> str:
    if days < 1:
        return "under a day"
    if days < 60:
        return f"≈{days:.0f} days"
    if days < 730:
        return f"≈{days / 30.44:.1f} months"
    return f"≈{days / 365.25:.1f} years"


def _arrival_description(mission_type_label, destination_name):
    if mission_type_label == "Flyby":
        return f"Spacecraft performs a close flyby of {destination_name}, gathering data during a brief high-speed pass."
    if mission_type_label == "Orbiter":
        return f"Spacecraft performs an orbital insertion maneuver, entering a stable orbit around {destination_name}."
    if mission_type_label == "Lander":
        return f"Spacecraft performs a descent and landing sequence onto the surface of {destination_name}."
    if mission_type_label == "Rover":
        return f"Spacecraft lands and deploys a mobile rover to traverse the surface of {destination_name}."
    return f"Spacecraft lands, collects samples from {destination_name}, and prepares for the return journey to Earth."
