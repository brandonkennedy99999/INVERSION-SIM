// src/browser.ts
import { TopologyRenderer } from './visualization/TopologyRenderer.js';
import { MirrorInversion } from './variants/mirror_inversion.js';
import { SquareClampReflect } from './variants/square_clamp_reflect.js';
import { SquareInversionReflect } from './variants/square_inversion_reflect.js';
import { SquareStickyReflect } from './variants/square_sticky_reflect.js';
import { runVariant } from './core.js';
import type { RunConfig, InversionKind } from './types.js';
import BotFleet from './botFleet.js';
import * as THREE from 'three';

let currentRenderer: TopologyRenderer | ThreeDRenderer | AbstractRenderer | null = null;
let topologyRenderer: TopologyRenderer | null = null;
let currentResult: any = null;
let currentCfg: RunConfig;
let currentVariant = MirrorInversion;
let botFleet: BotFleet | null = null;
let ws: WebSocket | null = null;

class ThreeDRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private zoomLevel: number = 1;
  private trajectoryLine: THREE.Line | null = null;
  private eventSpheres: THREE.Mesh[] = [];
  private inversionCubes: THREE.Mesh[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);
    this.camera.position.z = 10;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  render(result: any, cfg: RunConfig, maxIndex?: number) {
    this.scene.clear();

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    const effectiveMax = maxIndex ?? result.trajectory.length;

    // Render trajectory as 3D line with multi-color segments
    const segmentLength = Math.floor(result.trajectory.length / 4);
    const colors = [0xff0000, 0x0000ff, 0x00ff00, 0x800080]; // red, blue, green, purple

    for (let segment = 0; segment < 4; segment++) {
      const startIdx = segment * segmentLength;
      const endIdx = segment === 3 ? result.trajectory.length : (segment + 1) * segmentLength;
      const positions = [];
      for (let i = startIdx; i < Math.min(endIdx, effectiveMax); i++) {
        const state = result.trajectory[i];
        positions.push(state.x, state.y, state.phase * 2);
      }
      if (positions.length > 0) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const material = new THREE.LineBasicMaterial({ color: colors[segment] });
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
      }
    }

    // Render events as spheres
    for (const event of result.events) {
      const geometry = new THREE.SphereGeometry(0.1);
      const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(event.x, event.y, event.phaseAfter * 2);
      this.scene.add(sphere);
    }

    // Render inversions as cubes
    for (const state of result.trajectory.slice(0, effectiveMax)) {
      if (state.inverted) {
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(state.x, state.y, state.phase * 2);
        this.scene.add(cube);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  animateTrajectory(result: any, cfg: RunConfig, speed: number = 0.1) {
    let maxIndex = 0;
    const animate = () => {
      this.render(result, cfg, maxIndex);
      maxIndex += speed;
      if (maxIndex >= result.trajectory.length) {
        maxIndex = 0; // Loop back to start
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  zoom(factor: number) {
    this.zoomLevel *= factor;
    this.camera.position.z *= factor;
    this.render(currentResult, currentCfg);
  }
}

class AbstractRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private zoomLevel: number = 1;

  constructor(container: HTMLElement) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.ctx = this.canvas.getContext('2d')!;
    container.appendChild(this.canvas);
  }

  render(result: any, cfg: RunConfig, maxIndex?: number) {
    this.ctx.clearRect(0, 0, 800, 600);
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, 800, 600);

    const effectiveMax = maxIndex ?? result.trajectory.length;

    // Abstract representation: phase space with multi-color segments
    const segmentLength = Math.floor(result.trajectory.length / 4);
    const colors = ['red', 'blue', 'green', 'purple'];

    for (let segment = 0; segment < 4; segment++) {
      const startIdx = segment * segmentLength;
      const endIdx = segment === 3 ? result.trajectory.length : (segment + 1) * segmentLength;
      this.ctx.strokeStyle = colors[segment]!;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();

      for (let i = Math.max(startIdx + 1, 1); i < Math.min(endIdx, effectiveMax); i++) {
        const p1 = result.trajectory[i - 1];
        const p2 = result.trajectory[i];
        if (i === Math.max(startIdx + 1, 1)) {
          this.ctx.moveTo((p1.x / cfg.sizeX) * 800, (p1.y / cfg.sizeY) * 600);
        }
        this.ctx.lineTo((p2.x / cfg.sizeX) * 800, (p2.y / cfg.sizeY) * 600);
      }
      this.ctx.stroke();
    }

    // Events as abstract shapes
    for (const event of result.events) {
      this.ctx.fillStyle = `hsl(${event.phaseAfter * 360}, 100%, 70%)`;
      this.ctx.beginPath();
      this.ctx.arc((event.x / cfg.sizeX) * 800, (event.y / cfg.sizeY) * 600, 10, 0, 2 * Math.PI);
      this.ctx.fill();
    }
  }

  animateTrajectory(result: any, cfg: RunConfig, speed: number = 0.5) {
    let maxIndex = 0;
    const animate = () => {
      this.render(result, cfg, maxIndex);
      maxIndex += speed;
      if (maxIndex >= result.trajectory.length) {
        maxIndex = 0; // Loop back to start
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  zoom(factor: number) {
    this.zoomLevel *= factor;
    this.render(currentResult, currentCfg);
  }
}

function getConfigFromUI(): RunConfig {
  const sizeRatio = parseFloat((document.getElementById('sizeRatio') as HTMLInputElement).value);
  const multiplierRatio = parseFloat((document.getElementById('multiplierRatio') as HTMLInputElement).value);
  const stepRatio = parseFloat((document.getElementById('stepRatio') as HTMLInputElement).value);
  const baseSize = 10;
  const sizeX = Math.round(sizeRatio * baseSize);

function getColorModeFromUI(): string {
  const colorModeSelect = document.getElementById('colorMode') as HTMLSelectElement;
  return colorModeSelect.value;
}

function runSimulation() {
  console.log("Running simulation in browser...");

  currentCfg = getConfigFromUI();
  currentResult = runVariant(currentVariant, currentCfg);

  console.log("Simulation complete");
  console.log(`Events: ${currentResult.events.length}`);
  console.log(`Trajectory points: ${currentResult.trajectory.length}`);

  // Default to 2D view
  switchToMode('2D');
}

function switchToMode(mode: string) {
  const visualization = document.getElementById('visualization')!;
  visualization.innerHTML = '';

  if (currentRenderer) {
    // Clean up previous renderer if needed
  }

  const colorMode = getColorModeFromUI();

  if (mode === '2D') {
    topologyRenderer = new TopologyRenderer(visualization, 800, 600);
    topologyRenderer.setColorMode(colorMode);
    topologyRenderer.renderGrid(currentResult.trajectory, currentCfg.sizeX, currentCfg.sizeY);
    topologyRenderer.animateTrajectory(currentResult.trajectory, 50, true); // Enable looping
    topologyRenderer.renderEvents(currentResult.events);
    topologyRenderer.renderInversions(currentResult.trajectory);
    currentRenderer = topologyRenderer;
  } else if (mode === '3D') {
    currentRenderer = new ThreeDRenderer(visualization);
    (currentRenderer as ThreeDRenderer).animateTrajectory(currentResult, currentCfg);
  } else if (mode === 'Abstract') {
    currentRenderer = new AbstractRenderer(visualization);
    (currentRenderer as AbstractRenderer).animateTrajectory(currentResult, currentCfg);
  } else if (mode === 'Toroidal') {
    if (!topologyRenderer) {
      topologyRenderer = new TopologyRenderer(visualization, 800, 600);
    }
    topologyRenderer.setColorMode(colorMode);
    topologyRenderer.animateToroidal(currentResult.trajectory, currentCfg.sizeX, currentCfg.sizeY);
    currentRenderer = topologyRenderer;
  } else if (mode === 'Hyperbolic') {
    if (!topologyRenderer) {
      topologyRenderer = new TopologyRenderer(visualization, 800, 600);
    }
    topologyRenderer.setColorMode(colorMode);
    topologyRenderer.animateHyperbolic(currentResult.trajectory);
    currentRenderer = topologyRenderer;
  } else if (mode === 'PhaseSpace') {
    if (!topologyRenderer) {
      topologyRenderer = new TopologyRenderer(visualization, 800, 600);
    }
    topologyRenderer.setColorMode(colorMode);
    topologyRenderer.animatePhaseSpace(currentResult.trajectory);
    currentRenderer = topologyRenderer;
  }
}

function zoom(factor: number) {
  if (currentRenderer instanceof TopologyRenderer) {
    currentRenderer.zoom(factor);
  } else if (currentRenderer instanceof ThreeDRenderer) {
    currentRenderer.zoom(factor);
  } else if (currentRenderer instanceof AbstractRenderer) {
    currentRenderer.zoom(factor);
  }
}

// WebSocket connection
function connectWebSocket() {
  ws = new WebSocket('ws://localhost:8080');
  ws.onopen = () => {
    console.log('Connected to autorunner WebSocket');
  };
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'runUpdate') {
      updateRunCount(data.runCount);
      updateAnomaliesTable(data.anomalies, data.logEntry, data.topK);
    }
  };
  ws.onclose = () => {
    console.log('WebSocket connection closed, retrying in 5 seconds...');
    setTimeout(connectWebSocket, 5000);
  };
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

function updateRunCount(count: number) {
  const runCountElement = document.getElementById('runCount');
  if (runCountElement) {
    runCountElement.textContent = count.toString();
  }
}

function updateAnomaliesTable(anomalies: any, logEntry: any, topK?: any) {
  if (topK) {
    // Update randomness table
    const randomnessTableBody = document.querySelector('#randomnessTable tbody');
    if (randomnessTableBody) {
      randomnessTableBody.innerHTML = '';
      topK.randomness.forEach((entry: any, index: number) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${entry.run}</td>
          <td>${entry.anomalies.randomness.toFixed(4)}</td>
          <td>${entry.cfg.multiplier}</td>
          <td>${entry.cfg.sizeX}x${entry.cfg.sizeY}</td>
        `;
        randomnessTableBody.appendChild(row);
      });
    }

    // Update structure table
    const structureTableBody = document.querySelector('#structureTable tbody');
    if (structureTableBody) {
      structureTableBody.innerHTML = '';
      topK.structure.forEach((entry: any, index: number) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${entry.run}</td>
          <td>${entry.anomalies.structure.toFixed(4)}</td>
          <td>${entry.cfg.multiplier}</td>
          <td>${entry.cfg.sizeX}x${entry.cfg.sizeY}</td>
        `;
        structureTableBody.appendChild(row);
      });
    }

    // Update reemergence table
    const reemergenceTableBody = document.querySelector('#reemergenceTable tbody');
    if (reemergenceTableBody) {
      reemergenceTableBody.innerHTML = '';
      topK.reemergence.forEach((entry: any, index: number) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${entry.run}</td>
          <td>${entry.anomalies.reemergence}</td>
          <td>${entry.cfg.multiplier}</td>
          <td>${entry.cfg.sizeX}x${entry.cfg.sizeY}</td>
        `;
        reemergenceTableBody.appendChild(row);
      });
    }

    // Update anomaly summary table with top 10 per category
    const summaryBody = document.getElementById('anomalySummaryBody');
    if (summaryBody) {
      summaryBody.innerHTML = '';
      const categories = ['randomness', 'structure', 'reemergence'];
      categories.forEach(category => {
        if (topK[category]) {
          topK[category].slice(0, 10).forEach((item: any, index: number) => {
            const score = item.anomalies[category] || 0;
            const anomaly = {
              type: category,
              score,
              description: getAnomalyDescription(category, score),
              run: item.run,
              multiplier: item.cfg.multiplier,
              sizeX: item.cfg.sizeX,
              sizeY: item.cfg.sizeY,
              steps: item.cfg.steps,
              bandOk: item.bandOk,
              primeOk: item.primeOk,
              spectralOk: item.spectralOk,
              optimal: item.isOptimal,
              item
            };
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${category}</td>
              <td>${index + 1}</td>
              <td>${score.toFixed(6)}</td>
              <td>${anomaly.description}</td>
              <td>${new Date().toLocaleString()}</td>
            `;
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => showAnomalyDetails(anomaly));
            summaryBody.appendChild(row);
          });
        }
      });
    }
  } else {
    // Fallback for old format if needed
    console.log('No topK data received');
  }
}

function getAnomalyDescription(type: string, score: number): string {
  switch (type) {
    case 'randomness': return `Entropy measure: ${score.toFixed(4)} - Higher indicates more chaotic event distribution.`;
    case 'structure': return `Order measure: ${score.toFixed(4)} - Higher indicates more structured trajectory.`;
    case 'reemergence': return `Reemergence steps: ${score} - Distance to inversion point.`;
    case 'event_density': return `Events per step: ${score.toFixed(6)} - High density suggests frequent interactions.`;
    case 'trajectory_variance': return `Position variance: ${score.toFixed(2)} - Measures spread in trajectory positions.`;
    case 'phase_periodicity': return `Phase regularity: ${score.toFixed(4)} - Inverse variance indicating periodicity.`;
    case 'inversion_frequency': return `Inversions per step: ${score.toFixed(6)} - Frequency of reality inversions.`;
    case 'velocity_anomaly': return `Average velocity: ${score.toFixed(2)} - Speed of particle movement.`;
    case 'chaos_index': return `Position uniqueness: ${score.toFixed(4)} - Inverse of unique positions ratio.`;
    default: return `Unknown anomaly: ${score}`;
  }
}

function showAnomalyDetails(anomaly: any) {
  const detailsDiv = document.getElementById('anomalyDetails');
  const detailsText = document.getElementById('anomalyDetailsText');
  if (detailsDiv && detailsText) {
    const deductions = generateMathematicalDeductions(anomaly);
    detailsText.textContent = deductions;
    detailsDiv.style.display = 'block';
  }
}

function generateMathematicalDeductions(anomaly: any): string {
  let deductions = `Anomaly Type: ${anomaly.type}\nScore: ${anomaly.score}\nRun: ${anomaly.run}\n\nMathematical Deductions:\n`;

  switch (anomaly.type) {
    case 'randomness':
      deductions += `- Entropy calculation: H = -∑ p_i log p_i, approximated as event count / steps.\n`;
      deductions += `- High randomness suggests uniform event distribution, low suggests clustering.\n`;
      deductions += `- Relation to chaos: Entropy correlates with Lyapunov exponents in dynamical systems.\n`;
      break;
    case 'structure':
      deductions += `- Structure = 1 - randomness, measuring order in trajectory.\n`;
      deductions += `- Low structure indicates high entropy, potentially chaotic behavior.\n`;
      deductions += `- In quantum systems, structure relates to wave function coherence.\n`;
      break;
    case 'reemergence':
      deductions += `- Reemergence = steps - inversion_step, measuring distance to symmetry breaking.\n`;
      deductions += `- Higher values suggest delayed phase transitions.\n`;
      deductions += `- Related to Poincaré recurrence in closed systems.\n`;
      break;
    case 'event_density':
      deductions += `- Density = events / steps, measuring interaction frequency.\n`;
      deductions += `- High density may indicate resonant conditions or critical points.\n`;
      deductions += `- In field theory, relates to particle production rates.\n`;
      break;
    case 'trajectory_variance':
      deductions += `- Variance = (1/n) ∑ (x_i - mean)^2 for positions.\n`;
      deductions += `- High variance suggests diffusive or ballistic motion.\n`;
      deductions += `- Connects to Brownian motion and random walk theory.\n`;
      break;
    case 'phase_periodicity':
      deductions += `- Periodicity = 1 / phase_variance, measuring phase coherence.\n`;
      deductions += `- High periodicity indicates quasi-periodic orbits.\n`;
      deductions += `- Related to KAM theory in Hamiltonian systems.\n`;
      break;
    case 'inversion_frequency':
      deductions += `- Frequency = inversions / steps, measuring symmetry breaking rate.\n`;
      deductions += `- High frequency suggests unstable manifolds.\n`;
      deductions += `- In topology, relates to Morse theory and critical points.\n`;
      break;
    case 'velocity_anomaly':
      deductions += `- Velocity = sqrt(vx^2 + vy^2), averaged over trajectory.\n`;
      deductions += `- High average velocity indicates energetic states.\n`;
      deductions += `- In mechanics, relates to kinetic energy and equipartition theorem.\n`;
      break;
    case 'chaos_index':
      deductions += `- Index = 1 / (unique_positions / steps), measuring trajectory diversity.\n`;
      deductions += `- High index suggests ergodic behavior.\n`;
      deductions += `- Connects to ergodic theory and mixing in dynamical systems.\n`;
      break;
  }

  deductions += `\nConfiguration Details:\n`;
  deductions += `- Multiplier: ${anomaly.multiplier} (affects modular arithmetic)\n`;
  deductions += `- Grid Size: ${anomaly.sizeX}x${anomaly.sizeY} (boundary conditions)\n`;
  deductions += `- Steps: ${anomaly.steps} (simulation length)\n`;
  deductions += `- Band OK: ${anomaly.bandOk} (quantized event differences)\n`;
  deductions += `- Prime OK: ${anomaly.primeOk} (prime-based patterns)\n`;
  deductions += `- Spectral OK: ${anomaly.spectralOk} (phase periodicity)\n`;
  deductions += `- Optimal: ${anomaly.optimal} (passes all checks)\n`;

  return deductions;
}

// Event listeners
window.addEventListener('load', () => {
  connectWebSocket();

  const runSimBtn = document.getElementById('runSim');
  const mode2DBtn = document.getElementById('mode2D');
  const mode3DBtn = document.getElementById('mode3D');
  const modeAbstractBtn = document.getElementById('modeAbstract');
  const toroidalBtn = document.getElementById('toroidal');
  const hyperbolicBtn = document.getElementById('hyperbolic');
  const phaseSpaceBtn = document.getElementById('phaseSpace');
  const variantMirrorBtn = document.getElementById('variantMirror');
  const variantSquareClampBtn = document.getElementById('variantSquareClamp');
  const variantSquareInversionBtn = document.getElementById('variantSquareInversion');
  const variantSquareStickyBtn = document.getElementById('variantSquareSticky');
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const colorModeSelect = document.getElementById('colorMode') as HTMLSelectElement;

  if (runSimBtn) runSimBtn.addEventListener('click', runSimulation);
  if (mode2DBtn) mode2DBtn.addEventListener('click', () => switchToMode('2D'));
  if (mode3DBtn) mode3DBtn.addEventListener('click', () => switchToMode('3D'));
  if (modeAbstractBtn) modeAbstractBtn.addEventListener('click', () => switchToMode('Abstract'));
  if (toroidalBtn) toroidalBtn.addEventListener('click', () => switchToMode('Toroidal'));
  if (hyperbolicBtn) hyperbolicBtn.addEventListener('click', () => switchToMode('Hyperbolic'));
  if (phaseSpaceBtn) phaseSpaceBtn.addEventListener('click', () => switchToMode('PhaseSpace'));
  if (variantMirrorBtn) variantMirrorBtn.addEventListener('click', () => { currentVariant = MirrorInversion; runSimulation(); });
  if (variantSquareClampBtn) variantSquareClampBtn.addEventListener('click', () => { currentVariant = SquareClampReflect; runSimulation(); });
  if (variantSquareInversionBtn) variantSquareInversionBtn.addEventListener('click', () => { currentVariant = SquareInversionReflect; runSimulation(); });
  if (variantSquareStickyBtn) variantSquareStickyBtn.addEventListener('click', () => { currentVariant = SquareStickyReflect; runSimulation(); });
  if (zoomInBtn) zoomInBtn.addEventListener('click', () => zoom(1.2));
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => zoom(0.8));

  // Add listeners for config inputs to update on change
  const configInputs = ['sizeX', 'sizeY', 'x0', 'y0', 'vx0', 'vy0', 'steps', 'primeGrowthRatio', 'inversionGEOM', 'inversionSPHERE', 'inversionOBSERVER', 'inversionCAUSAL'];
  configInputs.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', runSimulation);
      element.addEventListener('change', runSimulation);
    }
  });

  // Add listener for color mode
  if (colorModeSelect) {
    colorModeSelect.addEventListener('change', () => {
      const colorMode = getColorModeFromUI();
      if (topologyRenderer) {
        topologyRenderer.setColorMode(colorMode);
        // Re-render current view if it's 2D or advanced modes
        if (currentRenderer === topologyRenderer) {
          // Determine current mode and re-render
          // For simplicity, re-run simulation to update
          runSimulation();
        }
      }
    });
  }

  // Add listener for animation speed
  const animationSpeedInput = document.getElementById('animationSpeed') as HTMLInputElement;
  if (animationSpeedInput) {
    animationSpeedInput.addEventListener('input', () => {
      // Re-run simulation to apply new speed
      runSimulation();
    });
  }

  const runBotsBtn = document.getElementById('runBots');
  if (runBotsBtn) runBotsBtn.addEventListener('click', runBotFleet);

  const startContinuousBotsBtn = document.getElementById('startContinuousBots');
  if (startContinuousBotsBtn) startContinuousBotsBtn.addEventListener('click', startContinuousBotFleet);

  const stopContinuousBotsBtn = document.getElementById('stopContinuousBots');
  if (stopContinuousBotsBtn) stopContinuousBotsBtn.addEventListener('click', stopContinuousBotFleet);

  const displayCategoriesBtn = document.getElementById('displayCategories');
  if (displayCategoriesBtn) displayCategoriesBtn.addEventListener('click', displayTop10Anomalies);

  const displayLogicSummaryBtn = document.getElementById('displayLogicSummary');
  if (displayLogicSummaryBtn) displayLogicSummaryBtn.addEventListener('click', displayBotLogicSummary);

  // Initial run
  runSimulation();
});

function runBotFleet() {
  console.log("Running bot fleet...");
  if (!botFleet) {
    botFleet = new BotFleet();
  }
  botFleet.runIteration();
  const group0Results = botFleet.getGroupResults(0);
  const group1Results = botFleet.getGroupResults(1);
  console.log("Group 0 results:", group0Results);
  console.log("Group 1 results:", group1Results);
  // Display results in UI or console
  alert(`Bot fleet run complete. Group 0: ${group0Results.length} bots, Group 1: ${group1Results.length} bots. Check console for details.`);
}

function startContinuousBotFleet() {
  console.log("Starting continuous bot fleet...");
  if (!botFleet) {
    botFleet = new BotFleet();
  }
  botFleet.startContinuousRunning(5000); // Run every 5 seconds
  // Auto-update logic summary and live updates every 5 seconds
  setInterval(() => {
    displayBotLogicSummary();
    updateBotLog();
    updateCoordinationGraph();
  }, 5000);
  // Initial display
  displayBotLogicSummary();
  updateBotLog();
  updateCoordinationGraph();
  alert("Bot fleet started continuously. Check console for updates.");
}

function stopContinuousBotFleet() {
  console.log("Stopping continuous bot fleet...");
  if (botFleet) {
    botFleet.stopContinuousRunning();
  }
  alert("Bot fleet stopped.");
}

function displayBotCategories() {
  if (!botFleet) {
    alert("No bot fleet running.");
    return;
  }
  const categories = botFleet.getCategories();
  let message = "Bot Categories:\n";
  for (const [cat, data] of categories) {
    message += `${cat}: ${data.length} entries\n`;
  }
  alert(message);
}

function displayTop10Anomalies() {
  if (!botFleet) {
    alert("No bot fleet running.");
    return;
  }
  const categories = botFleet.getCategories();
  const allAnomalies: any[] = [];
  for (const [category, anomalies] of categories) {
    anomalies.forEach(anomaly => {
      allAnomalies.push({ ...anomaly, category });
    });
  }
  allAnomalies.sort((a, b) => b.score - a.score);
  const top10 = allAnomalies.slice(0, 10);

  const tableBody = document.querySelector('#anomaliesTable tbody');
  if (tableBody) {
    tableBody.innerHTML = '';
    top10.forEach((anomaly, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${anomaly.category}</td>
        <td>${anomaly.score}</td>
        <td>${anomaly.description || 'N/A'}</td>
        <td>${new Date(anomaly.timestamp).toLocaleString()}</td>
      `;
      tableBody.appendChild(row);
    });
  }
}

function displayBotLogicSummary() {
  if (!botFleet) {
    alert("No bot fleet running.");
    return;
  }
  const summary = botFleet.getLogicSummary();
  const summaryText = document.getElementById('logicSummaryText');
  if (summaryText) {
    summaryText.textContent = summary;
  } else {
    alert(summary);
  }
}

function updateBotLog() {
  if (!botFleet) return;
  const log = botFleet.getLogicChangeLog();
  const logList = document.getElementById('botLogList');
  if (logList) {
    logList.innerHTML = '';
    log.slice(-10).forEach(entry => {
      const li = document.createElement('li');
      li.textContent = `${new Date().toLocaleTimeString()}: ${entry}`;
      logList.appendChild(li);
    });
  }
}

function updateCoordinationGraph() {
  if (!botFleet) return;
  const canvas = document.getElementById('coordinationCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const bots = botFleet.getBots();
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 50;

  // Separate bots into two groups
  const group0Bots = bots.filter(bot => bot.getGroup() === 0);
  const group1Bots = bots.filter(bot => bot.getGroup() === 1);

  // Colors for groups: 3 colors per group
  const colorsGroup0 = ['#00d4ff', '#00ff88', '#0088ff']; // blue, green, light blue
  const colorsGroup1 = ['#ff6b6b', '#ffaa00', '#ff4444']; // red, orange, darker red

  // Function to draw group
  const drawGroup = (groupBots: any[], groupCenterX: number, groupColors: string[], label: string) => {
    groupBots.forEach((bot, index) => {
      const angle = (index / groupBots.length) * 2 * Math.PI;
      const x = groupCenterX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Color based on index in group
      ctx.fillStyle = groupColors[index % groupColors.length];
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fill();

      // Label for tasks (placeholder: use index as task indicator)
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Task ${index + 1}`, x, y + 25);
    });

    // Draw cooperation lines within group (solid for cooperation)
    for (let i = 0; i < groupBots.length; i++) {
      for (let j = i + 1; j < groupBots.length; j++) {
        const bot1 = groupBots[i];
        const bot2 = groupBots[j];
        const angle1 = (i / groupBots.length) * 2 * Math.PI;
        const angle2 = (j / groupBots.length) * 2 * Math.PI;
        const x1 = groupCenterX + Math.cos(angle1) * radius;
        const y1 = centerY + Math.sin(angle1) * radius;
        const x2 = groupCenterX + Math.cos(angle2) * radius;
        const y2 = centerY + Math.sin(angle2) * radius;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; // white for cooperation
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  };

  // Draw group 0 on the left
  drawGroup(group0Bots, centerX - radius - 20, colorsGroup0, 'Group 0');

  // Draw group 1 on the right
  drawGroup(group1Bots, centerX + radius + 20, colorsGroup1, 'Group 1');

  // Draw relative task lines between groups (dashed for inter-group tasks)
  group0Bots.forEach((bot0, i0) => {
    group1Bots.forEach((bot1, i1) => {
      const angle0 = (i0 / group0Bots.length) * 2 * Math.PI;
      const angle1 = (i1 / group1Bots.length) * 2 * Math.PI;
      const x0 = (centerX - radius - 20) + Math.cos(angle0) * radius;
      const y0 = centerY + Math.sin(angle0) * radius;
      const x1 = (centerX + radius + 20) + Math.cos(angle1) * radius;
      const y1 = centerY + Math.sin(angle1) * radius;

      ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // yellow dashed for relative tasks
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  });

  // Add group labels
  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Group 0: Cooperation', centerX - radius - 20, centerY - radius - 10);
  ctx.fillText('Group 1: Cooperation', centerX + radius + 20, centerY - radius - 10);
  ctx.fillText('Inter-Group Tasks', centerX, centerY + radius + 30);
}
