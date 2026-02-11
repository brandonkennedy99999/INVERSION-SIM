// src/browser.ts
import { TopologyRenderer } from './visualization/TopologyRenderer.js';
import { MirrorInversion } from './variants/mirror_inversion.js';
import { runVariant } from './core.js';
import type { RunConfig } from './types.js';

// Browser-compatible config (no file I/O)
const cfg: RunConfig = {
  sizeX: 5,
  sizeY: 7,
  x0: 1,
  y0: 1,
  vx0: 1,
  vy0: 1,
  phase0: 0,
  steps: 200003,
  multiplier: 7,
  mod: 1000003,
  inversionSchedule: [
    { step: Math.floor(200003 * 0.20), kind: "GEOM" },
    { step: Math.floor(200003 * 0.40), kind: "SPHERE" },
    { step: Math.floor(200003 * 0.60), kind: "OBSERVER" },
    { step: Math.floor(200003 * 0.80), kind: "CAUSAL" },
  ],
};

function runSimulation() {
  console.log("Running simulation in browser...");

  const result = runVariant(MirrorInversion, cfg);

  console.log("Simulation complete");
  console.log(`Events: ${result.events.length}`);
  console.log(`Trajectory points: ${result.trajectory.length}`);

  // Visualize
  const app = document.getElementById('app')!;
  const renderer = new TopologyRenderer(app, 800, 600);
  renderer.renderGrid(result.trajectory, cfg.sizeX, cfg.sizeY);
  renderer.renderTrajectory(result.trajectory);
  renderer.renderEvents(result.events);
  renderer.renderInversions(result.trajectory);
}

// Run on load
window.addEventListener('load', runSimulation);
