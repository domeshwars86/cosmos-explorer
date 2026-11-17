/**
 * COSMOS Labs — mounts all seven lab controllers. Each lab module is
 * self-contained and only touches its own DOM elements, so initializing
 * all of them up front is cheap (none run a heavy render loop except the
 * Orbit Lab, which already pauses itself while its tab isn't active).
 */
import { initGravityLab } from '../labs/gravity.js';
import { initOrbitLab } from '../labs/orbit.js';
import { initEclipseLab } from '../labs/eclipse.js';
import { initMoonPhaseLab } from '../labs/moonphase.js';
import { initSeasonsLab } from '../labs/seasons.js';
import { initSignalLab } from '../labs/signal.js';
import { initHabitabilityLab } from '../labs/habitability.js';
import { initStellarLab } from '../labs/stellar.js';
import { initTimeDilation, initInterstellarTravel } from '../labs/relativity.js';

initGravityLab();
initOrbitLab();
initEclipseLab();
initMoonPhaseLab();
initSeasonsLab();
initSignalLab();
initHabitabilityLab();
initStellarLab();
initTimeDilation();
initInterstellarTravel();

// Track lab engagement for the Explorer Passport's "Lab Scientist" achievement.
document.querySelectorAll('#labs-tabs .tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    window.COSMOS?.achievements?.track('lab_used', { id: btn.dataset.tab });
  }, { once: false });
});
window.COSMOS?.achievements?.track('lab_used', { id: 'gravity' }); // the default active tab on load
