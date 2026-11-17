"""Deterministic keyword-based tagging and categorization for space news.

No AI model is used for this — a simple keyword→tag lookup table is
sufficient and completely predictable, per MASTER PROMPT §19 ("Use
deterministic keyword mapping first"). This module also maps tags to
existing COSMOS pages, which is what powers the "related COSMOS object"
panel on article detail pages (§21).
"""

import re

# tag -> list of lowercase trigger phrases
KEYWORD_TAGS = {
    "Mars": ["mars", "martian"],
    "Moon": ["moon", "lunar"],
    "Jupiter": ["jupiter"],
    "Saturn": ["saturn"],
    "Venus": ["venus"],
    "Mercury": ["mercury"],
    "Uranus": ["uranus"],
    "Neptune": ["neptune"],
    "Europa": ["europa"],
    "Titan": ["titan"],
    "Enceladus": ["enceladus"],
    "ISRO": ["isro", "chandrayaan", "gaganyaan", "mangalyaan", "aditya-l1", "aditya l1", "pslv", "gslv", "lvm3", "sslv"],
    "NASA": ["nasa"],
    "ESA": ["esa ", " esa", "european space agency"],
    "SpaceX": ["spacex", "starship", "falcon 9", "falcon heavy"],
    "JAXA": ["jaxa"],
    "CNSA": ["cnsa", "china national space"],
    "Roscosmos": ["roscosmos"],
    "James Webb": ["james webb", "jwst"],
    "Hubble": ["hubble"],
    "ISS": ["international space station", " iss "],
    "Artemis": ["artemis"],
    "Voyager": ["voyager"],
    "Exoplanet": ["exoplanet"],
    "Asteroid": ["asteroid"],
    "Comet": ["comet"],
    "Black Hole": ["black hole"],
    "Astronaut": ["astronaut", "cosmonaut", "spacewalk"],
    "Rocket Launch": ["launch", "rocket", "liftoff"],
}

# Ordered: first match wins. Matches MASTER PROMPT §7's category list.
CATEGORY_RULES = [
    ("ISRO", ["ISRO"]),
    ("SpaceX", ["SpaceX"]),
    ("NASA", ["NASA"]),
    ("ESA", ["ESA"]),
    ("Mars", ["Mars"]),
    ("Moon", ["Moon"]),
    ("Telescopes", ["James Webb", "Hubble"]),
    ("Human Spaceflight", ["ISS", "Artemis", "Astronaut"]),
    ("Asteroids & Comets", ["Asteroid", "Comet"]),
    ("Deep Space", ["Voyager", "Exoplanet", "Black Hole"]),
    ("Planets", ["Jupiter", "Saturn", "Venus", "Mercury", "Uranus", "Neptune", "Europa", "Titan", "Enceladus"]),
    ("Launches", ["Rocket Launch"]),
]

ALL_CATEGORIES = [
    "Missions", "Launches", "NASA", "ISRO", "ESA", "SpaceX", "Science",
    "Planets", "Human Spaceflight", "Telescopes", "Asteroids & Comets",
    "Moon", "Mars", "Deep Space",
]

# tag -> a related COSMOS page, used for the "Related COSMOS Object" panel
TAG_TO_COSMOS_LINK = {
    "Mars": {"label": "Mars", "url": "/planet/mars", "kind": "Planet"},
    "Moon": {"label": "The Moon", "url": "/moon/moon", "kind": "Moon"},
    "Jupiter": {"label": "Jupiter", "url": "/planet/jupiter", "kind": "Planet"},
    "Saturn": {"label": "Saturn", "url": "/planet/saturn", "kind": "Planet"},
    "Venus": {"label": "Venus", "url": "/planet/venus", "kind": "Planet"},
    "Mercury": {"label": "Mercury", "url": "/planet/mercury", "kind": "Planet"},
    "Uranus": {"label": "Uranus", "url": "/planet/uranus", "kind": "Planet"},
    "Neptune": {"label": "Neptune", "url": "/planet/neptune", "kind": "Planet"},
    "Europa": {"label": "Europa", "url": "/moon/europa", "kind": "Moon"},
    "Titan": {"label": "Titan", "url": "/moon/titan", "kind": "Moon"},
    "Enceladus": {"label": "Enceladus", "url": "/moon/enceladus", "kind": "Moon"},
    "ISRO": {"label": "India in Space", "url": "/space/isro", "kind": "Agency"},
    "James Webb": {"label": "James Webb Space Telescope", "url": "/spacecraft/jwst", "kind": "Spacecraft"},
    "Hubble": {"label": "Hubble Space Telescope", "url": "/spacecraft/hubble", "kind": "Spacecraft"},
    "Voyager": {"label": "Voyager 1", "url": "/spacecraft/voyager1", "kind": "Spacecraft"},
    "Artemis": {"label": "The Moon", "url": "/moon/moon", "kind": "Moon"},
    "Exoplanet": {"label": "Exoplanets", "url": "/exoplanets", "kind": "Section"},
    "Asteroid": {"label": "Small Bodies of the Solar System", "url": "/small-bodies", "kind": "Section"},
    "Comet": {"label": "Small Bodies of the Solar System", "url": "/small-bodies", "kind": "Section"},
    "Black Hole": {"label": "Cosmology Concepts", "url": "/cosmology", "kind": "Section"},
    "ISS": {"label": "Gravity Lab", "url": "/labs#gravity", "kind": "Lab"},
}

# tag -> extra "why this matters" / lab suggestions, keyed by tag
TAG_TO_SUGGESTIONS = {
    "Mars": [{"label": "Astrobiology: Could Life Exist on Mars?", "url": "/planet/mars#astrobiology"}, {"label": "Mission Builder", "url": "/mission-builder"}],
    "Moon": [{"label": "Moon Phase Lab", "url": "/labs#moonphase"}, {"label": "Eclipse Lab", "url": "/labs#eclipse"}],
    "Europa": [{"label": "Astrobiology Explorer", "url": "/astrobiology"}, {"label": "Habitability Lab", "url": "/labs#habitability"}],
    "ISRO": [{"label": "India's Space Journey", "url": "/space/isro"}],
    "Asteroid": [{"label": "Small Bodies of the Solar System", "url": "/small-bodies"}],
    "Comet": [{"label": "Small Bodies of the Solar System", "url": "/small-bodies"}],
    "Exoplanet": [{"label": "Exoplanet Explorer", "url": "/exoplanets"}],
    "James Webb": [{"label": "Cosmic Timeline", "url": "/cosmic-timeline"}],
}


def extract_tags(title: str, summary: str) -> list:
    text = f" {title} {summary} ".lower()
    tags = []
    for tag, triggers in KEYWORD_TAGS.items():
        if any(t in text for t in triggers):
            tags.append(tag)
    return tags


def categorize(tags: list) -> str:
    for category, required_tags in CATEGORY_RULES:
        if any(t in tags for t in required_tags):
            return category
    return "Missions" if not tags else "Science"


def related_cosmos_links(tags: list) -> list:
    seen = set()
    links = []
    for tag in tags:
        link = TAG_TO_COSMOS_LINK.get(tag)
        if link and link["url"] not in seen:
            seen.add(link["url"])
            links.append(link)
    return links[:3]


def related_suggestions(tags: list) -> list:
    seen = set()
    out = []
    for tag in tags:
        for s in TAG_TO_SUGGESTIONS.get(tag, []):
            if s["url"] not in seen:
                seen.add(s["url"])
                out.append(s)
    return out[:4]
