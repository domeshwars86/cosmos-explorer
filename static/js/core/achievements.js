/**
 * A small, elegant exploration-achievement system. Tracks which planets,
 * moons, and sections a visitor has opened (stored in localStorage only —
 * nothing is sent anywhere) and unlocks a short list of achievements with
 * a subtle toast, never a game-like popup barrage. Exposed as
 * window.COSMOS.achievements so any page script can call `.track(event)`.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'cosmos:exploration:v1';
  const ALL_PLANETS = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

  const ACHIEVEMENTS = [
    { id: 'first_orbit', title: 'First Orbit', desc: 'Opened your first planet profile.' },
    { id: 'planet_hopper', title: 'Planet Hopper', desc: 'Visited all 8 planets.' },
    { id: 'moon_walker', title: 'Moon Walker', desc: 'Explored a moon in detail.' },
    { id: 'giant_world', title: 'Giant World', desc: 'Explored Jupiter, the largest planet.' },
    { id: 'ring_master', title: 'Ring Master', desc: 'Explored Saturn\'s ring system.' },
    { id: 'galactic_tourist', title: 'Galactic Tourist', desc: 'Visited the Milky Way section.' },
    { id: 'cosmic_scale', title: 'Cosmic Scale', desc: 'Completed the scale-of-the-universe journey.' },
    { id: 'lab_scientist', title: 'Lab Scientist', desc: 'Ran experiments in five different COSMOS Labs.' },
    { id: 'mission_commander', title: 'Mission Commander', desc: 'Designed a simulated space mission.' },
    { id: 'world_builder', title: 'World Builder', desc: 'Created and saved a procedural planet.' },
  ];

  const DEFAULT_STATE = { planets: [], moons: [], dwarfs: [], galaxy: false, scaleComplete: false, labsUsed: [], missionBuilt: false, worldBuilt: false, unlocked: [] };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      return Object.assign({ ...DEFAULT_STATE }, JSON.parse(raw));
    } catch (err) {
      return { ...DEFAULT_STATE };
    }
  }

  let state = load();
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (err) { /* ignore */ }
  }

  function showToast(achievement) {
    let toast = document.getElementById('achievement-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'achievement-toast';
      toast.setAttribute('role', 'status');
      toast.innerHTML = '<span class="ach-icon" aria-hidden="true">&#10022;</span><span><span class="ach-label">Achievement Unlocked</span><div class="ach-title"></div></span>';
      document.body.appendChild(toast);
    }
    toast.querySelector('.ach-title').textContent = achievement.title;
    toast.classList.add('visible');
    window.COSMOS?.blip?.(760, 0.09);
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('visible'), 4200);
  }

  function unlock(id) {
    if (state.unlocked.includes(id)) return;
    state.unlocked.push(id);
    save();
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    if (achievement) showToast(achievement);
  }

  function evaluate() {
    if (state.planets.length > 0) unlock('first_orbit');
    if (ALL_PLANETS.every((p) => state.planets.includes(p))) unlock('planet_hopper');
    if (state.moons.length > 0) unlock('moon_walker');
    if (state.planets.includes('jupiter')) unlock('giant_world');
    if (state.planets.includes('saturn')) unlock('ring_master');
    if (state.galaxy) unlock('galactic_tourist');
    if (state.scaleComplete) unlock('cosmic_scale');
    if (state.labsUsed.length >= 5) unlock('lab_scientist');
    if (state.missionBuilt) unlock('mission_commander');
    if (state.worldBuilt) unlock('world_builder');
  }

  function track(event, meta) {
    meta = meta || {};
    if (event === 'visit_planet' && meta.id && !state.planets.includes(meta.id)) state.planets.push(meta.id);
    else if (event === 'visit_moon' && meta.id && !state.moons.includes(meta.id)) state.moons.push(meta.id);
    else if (event === 'visit_dwarf' && meta.id && !state.dwarfs.includes(meta.id)) state.dwarfs.push(meta.id);
    else if (event === 'visit_galaxy') state.galaxy = true;
    else if (event === 'scale_complete') state.scaleComplete = true;
    else if (event === 'lab_used' && meta.id && !state.labsUsed.includes(meta.id)) state.labsUsed.push(meta.id);
    else if (event === 'mission_built') state.missionBuilt = true;
    else if (event === 'world_built') state.worldBuilt = true;
    save();
    evaluate();
  }

  function getProgress() {
    return {
      planets: { done: state.planets.length, total: ALL_PLANETS.length },
      moons: { done: state.moons.length, total: 17 },
      dwarfs: { done: state.dwarfs.length, total: 5 },
      labs: { done: state.labsUsed.length, total: 9 },
      achievements: ACHIEVEMENTS.map((a) => ({ ...a, unlocked: state.unlocked.includes(a.id) })),
    };
  }

  function reset() {
    state = { ...DEFAULT_STATE };
    save();
  }

  window.COSMOS = window.COSMOS || {};
  window.COSMOS.achievements = { track, getProgress, reset, ALL: ACHIEVEMENTS };
})();
