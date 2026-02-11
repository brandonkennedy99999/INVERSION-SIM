// src/botFleet.ts
import { runVariant, writeOutputs } from './core.js';
import { MirrorInversion } from './variants/mirror_inversion.js';
import { SquareClampReflect } from './variants/square_clamp_reflect.js';
import { SquareInversionReflect } from './variants/square_inversion_reflect.js';
import { SquareStickyReflect } from './variants/square_sticky_reflect.js';
import { AnomalyDetector } from './anomaly_metrics.js';
import type { RunConfig, InversionKind } from './types.js';
import fs from 'node:fs';

interface ConstraintFeedback {
  valid: boolean;
  message: string;
  suggestions?: string[];
}

class Bot {
  private id: number;
  private group: number;
  private constraints: string[] = [
    "Trajectory must have at least 100 points",
    "Events must be fewer than 1000",
    "Inversions must be positive",
    "Phase must be between 0 and 1",
    "Grid size must be reasonable (5-20)"
  ];
  private currentConfig: RunConfig | null = null;
  private history: { config: RunConfig; feedback: ConstraintFeedback }[] = [];

  constructor(id: number, group: number) {
    this.id = id;
    this.group = group;
  }

  // Generate a new config autonomously
  generateConfig(): RunConfig {
    const variants = [MirrorInversion, SquareClampReflect, SquareInversionReflect, SquareStickyReflect];
    const variant = variants[Math.floor(Math.random() * variants.length)];

    // Use braided logic: alternate assignment, but since groups are 2, use even/odd for simplicity
    const sizeX = Math.floor(Math.random() * 16) + 5; // 5-20
    const sizeY = Math.floor(Math.random() * 16) + 5;
    const x0 = Math.floor(Math.random() * sizeX);
    const y0 = Math.floor(Math.random() * sizeY);
    const vx0 = Math.floor(Math.random() * 10) - 5; // -5 to 4
    const vy0 = Math.floor(Math.random() * 10) - 5;
    const steps = Math.floor(Math.random() * 100000) + 10000; // 10k-110k
    const multiplier = Math.random() > 0.5 ? 3 : 7;
    const mod = 1000003;

    // Random inversion schedule
    const inversionKinds: InversionKind[] = ["GEOM", "SPHERE", "OBSERVER", "CAUSAL"];
    const inversionSchedule: { step: number; kind: InversionKind }[] = [];
    for (let i = 0; i < Math.floor(Math.random() * 4); i++) {
      const kind = inversionKinds[Math.floor(Math.random() * inversionKinds.length)]!;
      const step = Math.floor(steps * (0.2 + Math.random() * 0.6)); // 20%-80%
      inversionSchedule.push({ step, kind });
    }

    this.currentConfig = {
      sizeX, sizeY, x0, y0, vx0, vy0, phase0: 0, steps, multiplier, mod, inversionSchedule
    };
    return this.currentConfig;
  }

  // Run simulation and get feedback
  runSimulation(): any {
    if (!this.currentConfig) throw new Error("No config generated");
    const variants = [MirrorInversion, SquareClampReflect, SquareInversionReflect, SquareStickyReflect];
    const variant = variants[Math.floor(Math.random() * variants.length)];
    return runVariant(variant, this.currentConfig);
  }

  // Check constraints and provide feedback (COL method)
  checkConstraints(result: any): ConstraintFeedback {
    const violations: string[] = [];
    const suggestions: string[] = [];

    if (result.trajectory.length < 100) {
      violations.push("Trajectory too short");
      suggestions.push("Increase steps or adjust initial conditions");
    }
    if (result.events.length >= 1000) {
      violations.push("Too many events");
      suggestions.push("Reduce steps or change variant");
    }
    if (result.trajectory.some((s: any) => s.inverted < 0)) {
      violations.push("Negative inversions");
      suggestions.push("Check inversion logic");
    }
    if (result.trajectory.some((s: any) => s.phase < 0 || s.phase > 1)) {
      violations.push("Phase out of bounds");
      suggestions.push("Normalize phase calculation");
    }
    if (this.currentConfig!.sizeX < 5 || this.currentConfig!.sizeX > 20 ||
        this.currentConfig!.sizeY < 5 || this.currentConfig!.sizeY > 20) {
      violations.push("Grid size unreasonable");
      suggestions.push("Set sizeX and sizeY between 5 and 20");
    }

    const valid = violations.length === 0;
    const message = valid ? "All constraints satisfied" : `Violations: ${violations.join(", ")}`;

    const feedback: ConstraintFeedback = { valid, message, suggestions };
    this.history.push({ config: this.currentConfig!, feedback });
    return feedback;
  }

  // Iterate based on feedback (COL: no answers, only constraints)
  iterate(feedback: ConstraintFeedback): RunConfig {
    if (feedback.valid) {
      // Slightly perturb for exploration
      this.generateConfig();
    } else {
      // Adjust based on suggestions (simple heuristics)
      if (feedback.suggestions && feedback.suggestions.includes("Increase steps")) {
        this.currentConfig!.steps *= 1.5;
      }
      if (feedback.suggestions && feedback.suggestions.includes("Reduce steps")) {
        this.currentConfig!.steps *= 0.5;
      }
      if (feedback.suggestions && feedback.suggestions.includes("Set sizeX and sizeY between 5 and 20")) {
        this.currentConfig!.sizeX = Math.max(5, Math.min(20, this.currentConfig!.sizeX));
        this.currentConfig!.sizeY = Math.max(5, Math.min(20, this.currentConfig!.sizeY));
      }
      // Re-generate otherwise
      this.generateConfig();
    }
    return this.currentConfig!;
  }

  getId(): number { return this.id; }
  getGroup(): number { return this.group; }
  getHistory(): any[] { return this.history; }
}

export class BotFleet {
  private bots: Bot[] = [];
  private groups: Bot[][] = [[], []];
  private anomalyDetector: AnomalyDetector;
  private categories: Map<string, any[]> = new Map();
  private runCounter: number = 0;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    // Create 8 bots, split into 2 groups using braided logic (alternating)
    for (let i = 0; i < 8; i++) {
      const group = i % 2; // 0 or 1
      const bot = new Bot(i, group);
      this.bots.push(bot);
      this.groups[group].push(bot);
    }
    this.anomalyDetector = new AnomalyDetector();
    this.initializeCategories();
  }

  private initializeCategories(): void {
    this.categories.set('Event Density', []);
    this.categories.set('Phase Anomaly', []);
    this.categories.set('Spiral Phase Dynamics', []);
  }

  // Start continuous running in background
  startContinuousRunning(intervalMs: number = 5000): void {
    if (this.intervalId) return; // Already running
    this.intervalId = setInterval(() => {
      this.runIteration();
      this.sortRunsData();
      this.refineLogic();
    }, intervalMs);
  }

  // Stop continuous running
  stopContinuousRunning(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Run one iteration for all bots, write outputs, detect anomalies
  runIteration(): void {
    for (const bot of this.bots) {
      const config = bot.generateConfig();
      const result = bot.runSimulation();
      const feedback = bot.checkConstraints(result);

      // Write outputs to runs/
      const runName = `run_${String(++this.runCounter).padStart(6, '0')}`;
      writeOutputs('runs', runName, result, config);

      // Detect anomalies
      const anomalies = this.anomalyDetector.detectAnomaliesFromResult(result, `bot_${bot.getId()}`);
      // Add to history
      bot.getHistory().push({ config, feedback, anomalies });

      bot.iterate(feedback);
    }
  }

  // Sort runs/ data into categories based on anomalies
  sortRunsData(): void {
    const runsDir = 'runs';
    if (!fs.existsSync(runsDir)) return;
    const runDirs = fs.readdirSync(runsDir).filter(d => d.startsWith('run_'));

    for (const runDir of runDirs) {
      const eventsPath = `${runsDir}/${runDir}/${runDir}.events.csv`;
      const trajectoryPath = `${runsDir}/${runDir}/${runDir}.trajectory.json`;
      if (fs.existsSync(eventsPath) && fs.existsSync(trajectoryPath)) {
        const eventsCsv = fs.readFileSync(eventsPath, 'utf-8');
        const trajectoryJson = JSON.parse(fs.readFileSync(trajectoryPath, 'utf-8'));

        // Parse events
        const events = eventsCsv.split('\n').slice(1).map(line => {
          const parts = line.split(',');
          if (parts.length < 8) return null;
          const [step, eventType, phaseBefore, phaseAfter, x, y, vx, vy] = parts;
          return { step: parseInt(step || '0'), eventType: eventType || '', phaseBefore: parseFloat(phaseBefore || '0'), phaseAfter: parseFloat(phaseAfter || '0'), x: parseFloat(x || '0'), y: parseFloat(y || '0'), vx: parseFloat(vx || '0'), vy: parseFloat(vy || '0') };
        }).filter(e => e && e.step);

        // Detect categories
        const eventCount = events.length;
        if (eventCount > 5) {
          this.categories.get('Event Density')!.push({ runDir, events, trajectory: trajectoryJson });
        }

        const phaseData = trajectoryJson.map((s: any) => s.phase);
        const phaseAnomalies = this.anomalyDetector.detectAnomalies(phaseData);
        if (phaseAnomalies.length > 0) {
          this.categories.get('Phase Anomaly')!.push({ runDir, events, trajectory: trajectoryJson, anomalies: phaseAnomalies });
        }

        // Check for Spiral Phase Dynamics: multiplicative jumps
        const phaseJumps = events.map(e => e.phaseAfter - e.phaseBefore);
        const hasMultiplicative = phaseJumps.some(jump => jump > 1 && (jump % 7 === 0 || jump % 3 === 0)); // Check for *7 or *3
        if (hasMultiplicative) {
          this.categories.get('Spiral Phase Dynamics')!.push({ runDir, events, trajectory: trajectoryJson });
        }
      }
    }

    // Write categories to categories/ folder
    const categoriesDir = 'categories';
    fs.mkdirSync(categoriesDir, { recursive: true });
    for (const [category, data] of this.categories) {
      fs.writeFileSync(`${categoriesDir}/${category.replace(/\s+/g, '_')}.json`, JSON.stringify(data, null, 2));
    }
  }

  // Refine logic based on data: add new criteria, vary configs
  refineLogic(): void {
    // Analyze categories to find patterns
    const spiralData = this.categories.get('Spiral Phase Dynamics')!;
    if (spiralData.length > 0) {
      // Add custom criterion for spacing bands
      this.anomalyDetector.addCustomCriterion((result) => {
        const events = result.events;
        const spacings = [];
        for (let i = 1; i < events.length; i++) {
          spacings.push(events[i].step - events[i-1].step);
        }
        const uniqueSpacings = [...new Set(spacings)];
        if (uniqueSpacings.length <= 5) { // Discrete bands
          return [{
            id: `spacing_${Date.now()}`,
            score: uniqueSpacings.length,
            category: 'Spacing Bands',
            description: `Discrete spacings: ${uniqueSpacings.join(',')}`,
            timestamp: new Date().toISOString(),
            source: 'bot_logic'
          }];
        }
        return [];
      });

      // Vary configs: change multiplier/mod for more anomalies
      for (const bot of this.bots) {
        if (bot.getHistory().length > 5) {
          const lastConfig = bot.getHistory()[bot.getHistory().length - 1].config;
          lastConfig.multiplier = lastConfig.multiplier === 7 ? 3 : 7; // Alternate
          lastConfig.mod = Math.floor(Math.random() * 1000000) + 1000000; // Vary mod
        }
      }
    }
  }

  // Get results from a group
  getGroupResults(group: number): any[] {
    return this.groups[group].map(bot => ({
      id: bot.getId(),
      history: bot.getHistory()
    }));
  }

  // Get all bots
  getBots(): Bot[] {
    return this.bots;
  }

  // Get categories
  getCategories(): Map<string, any[]> {
    return this.categories;
  }
}

export default BotFleet;
