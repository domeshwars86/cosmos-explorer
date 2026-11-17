/**
 * "You may also want to explore" — a small, deterministic relationship
 * graph between celestial objects (MASTER PROMPT §30). No AI or backend
 * call needed: it's a fixed lookup table of genuinely related objects
 * (a planet's moons, orbital neighbors, and thematic siblings).
 */
const GRAPH = {
  'sun': [{ t: 'Planet', l: 'Mercury', u: '/planet/mercury' }, { t: 'Planet', l: 'Earth', u: '/planet/earth' }, { t: 'Lab', l: 'Gravity Lab', u: '/labs#gravity' }, { t: 'Term', l: 'Nuclear Fusion', u: '/glossary' }],
  'planet:mercury': [{ t: 'Star', l: 'The Sun', u: '/sun' }, { t: 'Planet', l: 'Venus', u: '/planet/venus' }, { t: 'Tool', l: 'Compare Planets', u: '/compare' }, { t: 'Spacecraft', l: 'BepiColombo', u: '/explore#bepicolombo' }],
  'planet:venus': [{ t: 'Planet', l: 'Mercury', u: '/planet/mercury' }, { t: 'Planet', l: 'Earth', u: '/planet/earth' }, { t: 'Lab', l: 'Atmosphere Comparison', u: '/labs' }, { t: 'Term', l: 'Retrograde Rotation', u: '/glossary#retrograde-rotation' }],
  'planet:earth': [{ t: 'Moon', l: 'The Moon', u: '/moon/moon' }, { t: 'Planet', l: 'Mars', u: '/planet/mars' }, { t: 'Lab', l: 'Seasons Lab', u: '/labs#seasons' }, { t: 'Lab', l: 'Habitability Lab', u: '/labs#habitability' }],
  'planet:mars': [{ t: 'Planet', l: 'Earth', u: '/planet/earth' }, { t: 'Moon', l: 'Phobos', u: '/moon/phobos' }, { t: 'Astrobiology', l: 'Could Life Exist on Mars?', u: '/planet/mars#astrobiology' }, { t: 'Tool', l: 'Mission Builder', u: '/mission-builder' }],
  'planet:jupiter': [{ t: 'Moon', l: 'Europa', u: '/moon/europa' }, { t: 'Moon', l: 'Ganymede', u: '/moon/ganymede' }, { t: 'Planet', l: 'Saturn', u: '/planet/saturn' }, { t: 'Lab', l: 'Gravity Lab', u: '/labs#gravity' }],
  'planet:saturn': [{ t: 'Moon', l: 'Titan', u: '/moon/titan' }, { t: 'Moon', l: 'Enceladus', u: '/moon/enceladus' }, { t: 'Planet', l: 'Jupiter', u: '/planet/jupiter' }],
  'planet:uranus': [{ t: 'Planet', l: 'Neptune', u: '/planet/neptune' }, { t: 'Planet', l: 'Saturn', u: '/planet/saturn' }, { t: 'Moon', l: 'Titania', u: '/moon/titania' }, { t: 'Term', l: 'Retrograde Rotation', u: '/glossary#retrograde-rotation' }],
  'planet:neptune': [{ t: 'Moon', l: 'Triton', u: '/moon/triton' }, { t: 'Planet', l: 'Uranus', u: '/planet/uranus' }, { t: 'Dwarf Planet', l: 'Pluto', u: '/dwarf-planet/pluto' }, { t: 'Small Bodies', l: 'Kuiper Belt', u: '/small-bodies' }],
  'moon:moon': [{ t: 'Planet', l: 'Earth', u: '/planet/earth' }, { t: 'Planet', l: 'Mars', u: '/planet/mars' }, { t: 'Lab', l: 'Moon Phase Lab', u: '/labs#moonphase' }, { t: 'Lab', l: 'Eclipse Lab', u: '/labs#eclipse' }],
  'moon:phobos': [{ t: 'Planet', l: 'Mars', u: '/planet/mars' }, { t: 'Moon', l: 'Deimos', u: '/moon/deimos' }],
  'moon:deimos': [{ t: 'Planet', l: 'Mars', u: '/planet/mars' }, { t: 'Moon', l: 'Phobos', u: '/moon/phobos' }],
  'moon:europa': [{ t: 'Planet', l: 'Jupiter', u: '/planet/jupiter' }, { t: 'Moon', l: 'Ganymede', u: '/moon/ganymede' }, { t: 'Astrobiology', l: 'Astrobiology Explorer', u: '/astrobiology' }, { t: 'Lab', l: 'Habitability Lab', u: '/labs#habitability' }],
  'moon:ganymede': [{ t: 'Planet', l: 'Jupiter', u: '/planet/jupiter' }, { t: 'Moon', l: 'Europa', u: '/moon/europa' }, { t: 'Moon', l: 'Callisto', u: '/moon/callisto' }],
  'moon:callisto': [{ t: 'Planet', l: 'Jupiter', u: '/planet/jupiter' }, { t: 'Moon', l: 'Io', u: '/moon/io' }],
  'moon:io': [{ t: 'Planet', l: 'Jupiter', u: '/planet/jupiter' }, { t: 'Moon', l: 'Europa', u: '/moon/europa' }],
  'moon:titan': [{ t: 'Planet', l: 'Saturn', u: '/planet/saturn' }, { t: 'Moon', l: 'Enceladus', u: '/moon/enceladus' }, { t: 'Astrobiology', l: 'Astrobiology Explorer', u: '/astrobiology' }, { t: 'Spacecraft', l: 'Cassini-Huygens', u: '/spacecraft/cassini' }],
  'moon:enceladus': [{ t: 'Planet', l: 'Saturn', u: '/planet/saturn' }, { t: 'Moon', l: 'Europa', u: '/moon/europa' }, { t: 'Moon', l: 'Titan', u: '/moon/titan' }, { t: 'Astrobiology', l: 'Astrobiology Explorer', u: '/astrobiology' }],
  'moon:triton': [{ t: 'Planet', l: 'Neptune', u: '/planet/neptune' }, { t: 'Dwarf Planet', l: 'Pluto', u: '/dwarf-planet/pluto' }, { t: 'Spacecraft', l: 'Voyager 2', u: '/spacecraft/voyager2' }],
  'dwarf:pluto': [{ t: 'Planet', l: 'Neptune', u: '/planet/neptune' }, { t: 'Dwarf Planet', l: 'Eris', u: '/dwarf-planet/eris' }, { t: 'Spacecraft', l: 'New Horizons', u: '/spacecraft/newhorizons' }, { t: 'Small Bodies', l: 'Kuiper Belt', u: '/small-bodies' }],
};

const DEFAULT = [
  { t: 'Tool', l: 'Compare Planets', u: '/compare' },
  { t: 'Section', l: 'Explore the Galaxy', u: '/galaxy' },
  { t: 'Fact', l: 'Cosmic Facts', u: '/facts' },
];

export function mountRecommendations(container, kind, id) {
  if (!container) return;
  const key = kind === 'sun' ? 'sun' : `${kind}:${id}`;
  const items = GRAPH[key] || DEFAULT;
  container.innerHTML = items.map((i) => `
    <a class="recommend-card" href="${i.u}">
      <span><span class="rec-type">${i.t}</span><span class="rec-name">${i.l}</span></span>
    </a>
  `).join('');
}
