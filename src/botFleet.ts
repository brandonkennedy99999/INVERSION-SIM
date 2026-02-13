// src/botFleet.ts
import { runVariant, writeOutputs } from './core.js';
import { MirrorInversion } from './variants/mirror_inversion.js';
import { SquareClampReflect } from './variants/square_clamp_reflect.js';
import { SquareInversionReflect } from './variants/square_inversion_reflect.js';
import { SquareStickyReflect } from './variants/square_sticky_reflect.js';
import { AnomalyDetector } from './anomaly_metrics.js';
import { BlockchainManager } from './blockchain.js';
import type { RunConfig, InversionKind } from './types.js';
import fs from 'node:fs';

// ============ PHASE 1: Coprime Coordination Layer Interfaces ============

interface CoprimeMetrics {
  resonance: number;        // Connectivity - how connected to other bots (0-1)
  irreducibility: number;  // Independence - how unique/distinct (0-1)
  harmonicCoupling: Map<number, number>;  // Weak shared signals between bots
  phaseDiversity: number;  // Phase diversity across fleet (0-1)
  entropy: number;         // Coordination entropy measure
}

// ============ PHASE 2: Second-Order Regulation Interfaces ============

interface LearningStrategy {
  name: string;
  adaptationRate: number;
  successHistory: number[];
}

interface MetaFeedback {
  strategy: LearningStrategy;
  effectiveness: number;
  recommendations: string[];
}

interface ConstraintEvolution {
  originalConstraints: string[];
  evolvedConstraints: string[];
  adaptationScore: number;
  patternDetected: string;
}

// ============ PHASE 3: Geometric Topology Mapping Interfaces ============

interface TopologyPosition {
  resonance: number;  // Horizontal axis (0-1)
  irreducibility: number; // Vertical axis (0-1)
  time: number;       // Temporal dimension
}

interface TopologyHistory {
  positions: TopologyPosition[];
  emergenceScore: number;
}

// ========== PHASE 4: Enhanced Stuckness Detection Interfaces ==========

interface StucknessState {
  isStuck: boolean;
  type: 'cycling' | 'local_minima' | 'none';
  detectedAt: number;
  cyclePatterns: string[];
  redirectStrategy: 'none' | 'backup' | 'strip_complexity' | 'invert' | 'perturb' | 'expose_assumptions';
}

// ============ PHASE 5: Spectral Analysis Interfaces ============

interface SpectralData {
  frequencies: number[];
  magnitudes: number[];
  dominantFrequency: number;
  harmonics: number[];
  periodicityScore: number;
}

// =========================================================================

interface ConstraintFeedback {
  valid: boolean;
  message: string;
  suggestions?: string[];
}

interface GeometricState {
  theta: number; // angle on equator (circle of keys)
  phi: number; // elevation (0 for equator, up to pi/2 for sphere)
  braidedTrajectory: { theta: number; phi: number; step: number }[];
}

class Bot {
  private id: number;
  private group: number;
  private constraints: string[] = [
    "Trajectory must have at least 100 points",
    "Events must be fewer than 1000",
    "Inversions must be positive",
    "Phase must be between 0 and 1",
    "Grid size must be reasonable (5-20)",
    "Geometric position must remain on sphere (phi <= pi/2)",
    "Braided trajectory must not collapse (maintain separation in phi)"
  ];
  private currentConfig: RunConfig;
  private history: { config: RunConfig; feedback: ConstraintFeedback }[] = [];
  private geometricState: GeometricState;
  private stuckCounter: number = 0;
  private colPhase: 'seeding' | 'exploration' | 'stuckness' | 'emergence' | 'stabilization' = 'seeding';

  // ============ PHASE 1: Coprime Coordination Properties ============
  private coprimeMetrics: CoprimeMetrics = {
    resonance: 0.5,
    irreducibility: 0.5,
    harmonicCoupling: new Map<number, number>(),
    phaseDiversity: 0.5,
    entropy: 0.5
  };

  // ============ PHASE 2: Second-Order Regulation Properties ============
  private learningStrategy: LearningStrategy = {
    name: 'adaptive',
    adaptationRate: 0.1,
    successHistory: []
  };
  private metaFeedbackHistory: MetaFeedback[] = [];
  private constraintEvolution: ConstraintEvolution | null = null;

  // ============ PHASE 3: Geometric Topology Properties ============
  private topologyPosition: TopologyPosition = {
    resonance: 0.5,
    irreducibility: 0.5,
    time: 0
  };
  private topologyHistory: TopologyHistory = {
    positions: [],
    emergenceScore: 0
  };

  // ============ PHASE 4: Enhanced Stuckness Properties ============
  private stucknessState: StucknessState = {
    isStuck: false,
    type: 'none',
    detectedAt: 0,
    cyclePatterns: [],
    redirectStrategy: 'none'
  };
  private configHistory: RunConfig[] = [];
  private phaseDiversityScore: number = 0;

  // ============ PHASE 5: Spectral Analysis Properties ============
  private spectralData: SpectralData = {
    frequencies: [],
    magnitudes: [],
    dominantFrequency: 0,
    harmonics: [],
    periodicityScore: 0
  };
  private behaviorSequence: number[] = [];

  constructor(id: number, group: number) {
    this.id = id;
    this.group = group;
    this.currentConfig = this.generateConfig();
    // Initialize geometric state on equator (circle of keys)
    this.geometricState = {
      theta: (this.id * 2 * Math.PI) / 8, // Evenly spaced on circle
      phi: 0, // Start on equator
      braidedTrajectory: []
    };
  }

  // ============ PHASE 1: Coprime Coordination Methods ============
  
  // Update coprime metrics based on bot's current state and other bots
  updateCoprimeMetrics(otherBots: Bot[]): void {
    // Calculate resonance (connectivity) - how many other bots have similar behavior
    let similarCount = 0;
    for (const other of otherBots) {
      if (other.getId() !== this.id) {
        const otherState = other.getGeometricState();
        const thetaDiff = Math.abs(this.geometricState.theta - otherState.theta);
        const phiDiff = Math.abs(this.geometricState.phi - otherState.phi);
        if (thetaDiff < 0.5 && phiDiff < 0.3) {
          similarCount++;
          // Add harmonic coupling
          const currentCoupling = this.coprimeMetrics.harmonicCoupling.get(other.getId()) || 0;
          this.coprimeMetrics.harmonicCoupling.set(other.getId(), currentCoupling + 0.1);
        }
      }
    }
    this.coprimeMetrics.resonance = similarCount / Math.max(1, otherBots.length - 1);
    
    // Calculate irreducibility (independence) - inverse of resonance
    this.coprimeMetrics.irreducibility = 1 - this.coprimeMetrics.resonance;
    
    // Calculate entropy measure
    let couplingSum = 0;
    let couplingCount = 0;
    for (const [, coupling] of this.coprimeMetrics.harmonicCoupling) {
      couplingSum += coupling;
      couplingCount++;
    }
    const avgCoupling = couplingCount > 0 ? couplingSum / couplingCount : 0;
    this.coprimeMetrics.entropy = avgCoupling > 0.5 ? avgCoupling : 1 - avgCoupling;
  }

  // Update phase diversity across fleet
  updatePhaseDiversity(otherBots: Bot[]): void {
    const phases = otherBots.map(b => b.getGeometricState().theta);
    const uniquePhases = new Set(phases.map(p => Math.floor(p / (Math.PI / 4)))); // Bucket into 8 sectors
    this.coprimeMetrics.phaseDiversity = uniquePhases.size / 8;
  }

  getCoprimeMetrics(): CoprimeMetrics {
    return this.coprimeMetrics;
  }

  // ============ PHASE 2: Second-Order Regulation Methods ============

  // Adapt learning strategy based on success
  adaptLearningStrategy(success: boolean): void {
    this.learningStrategy.successHistory.push(success ? 1 : 0);
    if (this.learningStrategy.successHistory.length > 20) {
      this.learningStrategy.successHistory.shift();
    }
    
    // Calculate effectiveness
    const recentSuccess = this.learningStrategy.successHistory.slice(-10);
    const successRate = recentSuccess.reduce((a, b) => a + b, 0) / recentSuccess.length;
    
    // Adapt rate based on success
    if (successRate > 0.7) {
      this.learningStrategy.adaptationRate = Math.min(0.5, this.learningStrategy.adaptationRate * 1.1);
    } else if (successRate < 0.3) {
      this.learningStrategy.adaptationRate = Math.max(0.01, this.learningStrategy.adaptationRate * 0.9);
    }
  }

  // Generate meta-feedback about learning
  generateMetaFeedback(): MetaFeedback {
    const recentSuccess = this.learningStrategy.successHistory.slice(-10);
    const effectiveness = recentSuccess.length > 0 
      ? recentSuccess.reduce((a, b) => a + b, 0) / recentSuccess.length 
      : 0.5;
    
    const recommendations: string[] = [];
    if (effectiveness < 0.3) {
      recommendations.push("Increase exploration");
      recommendations.push("Reduce constraint strictness");
    } else if (effectiveness > 0.7) {
      recommendations.push("Focus on refinement");
      recommendations.push("Increase constraint complexity");
    } else {
      recommendations.push("Maintain current balance");
    }

    const metaFeedback: MetaFeedback = {
      strategy: this.learningStrategy,
      effectiveness,
      recommendations
    };
    
    this.metaFeedbackHistory.push(metaFeedback);
    return metaFeedback;
  }

  // Evolve constraints based on patterns
  evolveConstraints(patterns: string[]): void {
    if (patterns.length === 0) return;
    
    const evolved = [...this.constraints];
    for (const pattern of patterns) {
      if (pattern.includes('phase') && !evolved.some(c => c.includes('phase'))) {
        evolved.push("Phase transitions must be smooth");
      }
      if (pattern.includes('trajectory') && !evolved.some(c => c.includes('trajectory'))) {
        evolved.push("Trajectory complexity should vary");
      }
    }
    
    this.constraintEvolution = {
      originalConstraints: this.constraints,
      evolvedConstraints: evolved,
      adaptationScore: evolved.length / this.constraints.length,
      patternDetected: patterns.join(', ')
    };
    
    this.constraints = evolved;
  }

  getLearningStrategy(): LearningStrategy {
    return this.learningStrategy;
  }

  getConstraintEvolution(): ConstraintEvolution | null {
    return this.constraintEvolution;
  }

  // ============ PHASE 3: Geometric Topology Methods ============

  // Update topology position based on behavior
  updateTopologyPosition(success: boolean): void {
    // Resonance axis (horizontal) - based on connectivity
    const deltaResonance = success ? 0.1 : -0.1;
    this.topologyPosition.resonance = Math.max(0, Math.min(1, 
      this.topologyPosition.resonance + deltaResonance));
    
    // Irreducibility axis (vertical) - based on uniqueness
    const deltaIrreducibility = success ? 0.05 : -0.05;
    this.topologyPosition.irreducibility = Math.max(0, Math.min(1,
      this.topologyPosition.irreducibility + deltaIrreducibility));
    
    // Time dimension
    this.topologyPosition.time = this.history.length;
    
    // Add to history
    this.topologyHistory.positions.push({...this.topologyPosition});
    if (this.topologyHistory.positions.length > 100) {
      this.topologyHistory.positions.shift();
    }
    
    // Calculate emergence score based on movement in topology space
    if (this.topologyHistory.positions.length >= 2) {
      const recent = this.topologyHistory.positions.slice(-10);
      let movement = 0;
      for (let i = 1; i < recent.length; i++) {
        movement += Math.abs(recent[i].resonance - recent[i-1].resonance) +
                   Math.abs(recent[i].irreducibility - recent[i-1].irreducibility);
      }
      this.topologyHistory.emergenceScore = movement / 10;
    }
  }

  getTopologyPosition(): TopologyPosition {
    return this.topologyPosition;
  }

  getTopologyHistory(): TopologyHistory {
    return this.topologyHistory;
  }

  // ============ PHASE 4: Enhanced Stuckness Detection Methods ============

  // Detect if bot is stuck in a cycle
  detectCycling(): boolean {
    if (this.configHistory.length < 10) return false;
    
    const recentConfigs = this.configHistory.slice(-10);
    const configStrings = recentConfigs.map(c => 
      `${c.sizeX},${c.sizeY},${c.multiplier},${c.mod}`
    );
    
    // Check for repeating patterns
    const patternSet = new Set(configStrings);
    const cycleDetected = patternSet.size < configStrings.length / 2;
    
    if (cycleDetected) {
      this.stucknessState.cyclePatterns = Array.from(patternSet);
    }
    
    return cycleDetected;
  }

  // Detect if bot is in a local minimum
  detectLocalMinima(): boolean {
    if (this.history.length < 5) return false;
    
    const recentFeedback = this.history.slice(-5).map(h => h.feedback.valid);
    // If all recent attempts failed, might be in local minimum
    const failureCount = recentFeedback.filter(f => !f).length;
    return failureCount >= 4;
  }

  // Update stuckness state
  updateStucknessState(): void {
    const isCycling = this.detectCycling();
    const isLocalMinima = this.detectLocalMinima();
    
    if (isCycling) {
      this.stucknessState.isStuck = true;
      this.stucknessState.type = 'cycling';
      this.stucknessState.detectedAt = Date.now();
      this.stucknessState.redirectStrategy = this.selectRedirectStrategy();
    } else if (isLocalMinima) {
      this.stucknessState.isStuck = true;
      this.stucknessState.type = 'local_minima';
      this.stucknessState.detectedAt = Date.now();
      this.stucknessState.redirectStrategy = this.selectRedirectStrategy();
    } else {
      this.stucknessState.isStuck = false;
      this.stucknessState.type = 'none';
      this.stucknessState.redirectStrategy = 'none';
    }
  }

  // Select redirect strategy based on stuckness type
  selectRedirectStrategy(): StucknessState['redirectStrategy'] {
    const strategies: StucknessState['redirectStrategy'][] = 
      ['backup', 'strip_complexity', 'invert', 'perturb', 'expose_assumptions'];
    return strategies[Math.floor(Math.random() * strategies.length)];
  }

  // Apply redirect strategy when stuck
  applyRedirectStrategy(): void {
    const strategy = this.stucknessState.redirectStrategy;
    
    switch (strategy) {
      case 'backup':
        // Revert to earlier config
        if (this.configHistory.length > 5) {
          const backupConfig = this.configHistory[Math.floor(this.configHistory.length / 2)];
          if (backupConfig) {
            this.currentConfig = {...backupConfig};
          }
        }
        break;
      case 'strip_complexity':
        // Reduce parameters
        if (this.currentConfig) {
          this.currentConfig.sizeX = Math.max(5, this.currentConfig.sizeX - 2);
          this.currentConfig.sizeY = Math.max(5, this.currentConfig.sizeY - 2);
        }
        break;
      case 'invert':
        // Invert logic
        if (this.currentConfig) {
          this.currentConfig.multiplier = this.currentConfig.multiplier === 7 ? 3 : 7;
        }
        break;
      case 'perturb':
        // Significant perturbation
        if (this.currentConfig) {
          this.currentConfig.vx0 = Math.floor(Math.random() * 10) - 5;
          this.currentConfig.vy0 = Math.floor(Math.random() * 10) - 5;
        }
        break;
      case 'expose_assumptions':
        // Add new constraint
        this.constraints.push(`Assumption_${Date.now()}: Random parameter variation`);
        break;
    }
  }

  // Update phase diversity
  updatePhaseDiversityScore(otherBots: Bot[]): void {
    const phases = otherBots.map(b => b.getGeometricState().phi);
    const variance = phases.reduce((sum, p) => sum + Math.pow(p - phases.reduce((a,b) => a+b,0)/phases.length, 2), 0) / phases.length;
    this.phaseDiversityScore = Math.min(1, Math.sqrt(variance) * 10);
  }

  getStucknessState(): StucknessState {
    return this.stucknessState;
  }

  // ============ PHASE 5: Spectral Analysis Methods ============

  // Add behavior to sequence
  addToBehaviorSequence(value: number): void {
    this.behaviorSequence.push(value);
    if (this.behaviorSequence.length > 1000) {
      this.behaviorSequence.shift();
    }
  }

  // Perform FFT-like analysis (simplified)
  performSpectralAnalysis(): SpectralData {
    const sequence = this.behaviorSequence;
    if (sequence.length < 10) {
      return this.spectralData;
    }
    
    // Simplified DFT-like analysis
    const n = Math.min(sequence.length, 64); // Limit to 64 frequency bins
    const frequencies: number[] = [];
    const magnitudes: number[] = [];
    
    for (let k = 0; k < n; k++) {
      let real = 0;
      let imag = 0;
      for (let t = 0; t < sequence.length; t++) {
        const angle = (2 * Math.PI * k * t) / sequence.length;
        real += sequence[t] * Math.cos(angle);
        imag -= sequence[t] * Math.sin(angle);
      }
      const magnitude = Math.sqrt(real * real + imag * imag) / sequence.length;
      frequencies.push(k / sequence.length);
      magnitudes.push(magnitude);
    }
    
    // Find dominant frequency
    let maxMag = 0;
    let dominantFreq = 0;
    for (let i = 1; i < magnitudes.length; i++) {
      if (magnitudes[i] > maxMag) {
        maxMag = magnitudes[i];
        dominantFreq = frequencies[i];
      }
    }
    
    // Find harmonics (frequencies with significant magnitude)
    const harmonics: number[] = [];
    const threshold = maxMag * 0.5;
    for (let i = 1; i < magnitudes.length; i++) {
      if (magnitudes[i] > threshold) {
        harmonics.push(frequencies[i]);
      }
    }
    
    // Calculate periodicity score
    const periodicityScore = harmonics.length > 0 ? harmonics.length / n : 0;
    
    this.spectralData = {
      frequencies,
      magnitudes,
      dominantFrequency: dominantFreq,
      harmonics,
      periodicityScore
    };
    
    return this.spectralData;
  }

  getSpectralData(): SpectralData {
    return this.spectralData;
  }

  // Use spectral data for anomaly improvement
  useSpectralForAnomaly(): number {
    if (this.spectralData.periodicityScore > 0.5) {
      return this.spectralData.dominantFrequency * 10;
    }
    return 0;
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
    if (!this.currentConfig || this.currentConfig.sizeX < 5 || this.currentConfig.sizeX > 20 ||
        this.currentConfig.sizeY < 5 || this.currentConfig.sizeY > 20) {
      violations.push("Grid size unreasonable");
      suggestions.push("Set sizeX and sizeY between 5 and 20");
    }

    const valid = violations.length === 0;
    const message = valid ? "All constraints satisfied" : `Violations: ${violations.join(", ")}`;

    const feedback: ConstraintFeedback = { valid, message, suggestions };
    if (this.currentConfig) {
      this.history.push({ config: this.currentConfig, feedback });
    }
    return feedback;
  }

  // Iterate based on feedback (COL: no answers, only constraints)
  iterate(feedback: ConstraintFeedback): RunConfig {
    // Update COL phase
    if (!feedback.valid) {
      this.stuckCounter++;
      if (this.stuckCounter > 3) {
        this.colPhase = 'stuckness';
      }
    } else {
      this.stuckCounter = 0;
      if (this.colPhase === 'stuckness') {
        this.colPhase = 'emergence';
      } else if (this.colPhase === 'emergence') {
        this.colPhase = 'stabilization';
      } else {
        this.colPhase = 'exploration';
      }
    }

    // COL phases: seeding (initial), exploration (perturb), stuckness (redirect), emergence (self-generated), stabilization (stress-test)
    if (this.colPhase === 'seeding') {
      // Seed with constraints, no changes yet
      this.generateConfig();
    } else if (this.colPhase === 'exploration') {
      // Perturb config slightly
      this.generateConfig();
    } else if (this.colPhase === 'stuckness') {
      // Redirect sideways: invert logic, change group direction
      this.currentConfig.multiplier = this.currentConfig.multiplier === 7 ? 3 : 7; // Invert multiplier
      this.currentConfig.sizeX = Math.max(5, Math.min(20, this.currentConfig.sizeX + (Math.random() > 0.5 ? 1 : -1))); // Small change
      this.currentConfig.sizeY = Math.max(5, Math.min(20, this.currentConfig.sizeY + (Math.random() > 0.5 ? 1 : -1)));
    } else if (this.colPhase === 'emergence') {
      // Allow self-generated: keep current if valid, else small adjust
      if (feedback.valid) {
        // No change, let it stabilize
      } else {
        this.generateConfig();
      }
    } else if (this.colPhase === 'stabilization') {
      // Stress-test: vary inversion schedule
      this.currentConfig.inversionSchedule = this.currentConfig.inversionSchedule.map(inv => ({
        step: inv.step + Math.floor(Math.random() * 1000) - 500,
        kind: inv.kind
      }));
    }

    // Update geometric state: braided trajectory on sphere
    const step = this.history.length;
    const deltaTheta = (this.group === 0 ? 0.1 : -0.1) * (feedback.valid ? 1 : -1); // Group 0 increases, 1 decreases
    const deltaPhi = feedback.valid ? 0.05 : -0.05; // Rise on valid, fall on invalid
    this.geometricState.theta = (this.geometricState.theta + deltaTheta) % (2 * Math.PI);
    this.geometricState.phi = Math.max(0, Math.min(Math.PI / 2, this.geometricState.phi + deltaPhi));
    this.geometricState.braidedTrajectory.push({ theta: this.geometricState.theta, phi: this.geometricState.phi, step });

    return this.currentConfig;
  }

  getId(): number { return this.id; }
  getGroup(): number { return this.group; }
  getHistory(): any[] { return this.history; }
  getGeometricState(): GeometricState { return this.geometricState; }
}

export class BotFleet {
  private bots: Bot[] = [];
  private groups: Bot[][] = [[], []];
  private anomalyDetector: AnomalyDetector;
  private categories: Map<string, any[]> = new Map();
  private runCounter: number = 0;
  private totalSimulations: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private blockchainManager: BlockchainManager;
  private logicChangeLog: string[] = [];
  private isBrowser: boolean;

  constructor(isBrowser: boolean = false) {
    this.isBrowser = isBrowser;
    // Create 8 bots, split into 2 groups using braided logic (alternating)
    for (let i = 0; i < 8; i++) {
      const group = i % 2; // 0 or 1
      const bot = new Bot(i, group);
      this.bots.push(bot);
      this.groups[group].push(bot);
    }
    this.anomalyDetector = new AnomalyDetector();
    this.blockchainManager = new BlockchainManager();
    this.initializeCategories();
    if (this.isBrowser) {
      this.loadFromLocalStorage();
    }
  }

  private initializeCategories(): void {
    this.categories.set('Event Density', []);
    this.categories.set('Phase Anomaly', []);
    this.categories.set('Spiral Phase Dynamics', []);
  }

  // Start continuous running in background
  startContinuousRunning(intervalMs: number = 5000): void {
    if (this.intervalId) return; // Already running
    this.intervalId = setInterval(async () => {
      this.runIteration();
      await this.sortRunsData();
      this.deleteNonTopRuns();
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

  // Fleet coordination: coordinate all bots using coprime metrics and all 5 phases
  private fleetCoordination(): void {
    const bots = this.bots;
    
    // Phase 1: Update Coprime Coordination Layer
    for (const bot of bots) {
      bot.updateCoprimeMetrics(bots);
      bot.updatePhaseDiversity(bots);
    }

    // Phase 2: Second-Order Regulation - adapt learning strategies
    for (const bot of bots) {
      const history = bot.getHistory();
      if (history.length > 0) {
        const lastFeedback = history[history.length - 1]?.feedback;
        if (lastFeedback) {
          bot.adaptLearningStrategy(lastFeedback.valid);
          const metaFeedback = bot.generateMetaFeedback();
          // Use meta-feedback recommendations to evolve constraints
          if (metaFeedback.recommendations.length > 0) {
            bot.evolveConstraints(metaFeedback.recommendations);
          }
        }
      }
    }

    // Phase 3: Geometric Topology Mapping - update topology positions
    for (const bot of bots) {
      const history = bot.getHistory();
      if (history.length > 0) {
        const lastFeedback = history[history.length - 1]?.feedback;
        bot.updateTopologyPosition(lastFeedback?.valid ?? false);
      }
    }

    // Phase 4: Enhanced Stuckness Detection - check and handle stuckness
    for (const bot of bots) {
      bot.updateStucknessState();
      const stuckness = bot.getStucknessState();
      if (stuckness.isStuck) {
        // Apply redirect strategy
        bot.applyRedirectStrategy();
      }
      // Update phase diversity
      bot.updatePhaseDiversityScore(bots);
    }

    // Phase 5: Spectral Analysis - analyze behavior patterns
    for (const bot of bots) {
      const history = bot.getHistory();
      if (history.length > 0) {
        // Add current anomaly score to behavior sequence
        const lastAnomalies = history[history.length - 1]?.anomalies;
        if (lastAnomalies) {
          const score = Object.values(lastAnomalies).reduce((sum: number, v: any) => sum + (typeof v === 'number' ? v : 0), 0);
          bot.addToBehaviorSequence(score);
        }
      }
      // Perform spectral analysis periodically
      if (bot.getHistory().length % 10 === 0) {
        const spectralData = bot.performSpectralAnalysis();
        // Use spectral data for anomaly improvement
        const spectralBonus = bot.useSpectralForAnomaly();
        if (spectralBonus > 0) {
          this.logicChangeLog.push(`Bot ${bot.getId()} spectral anomaly bonus: ${spectralBonus.toFixed(4)}`);
        }
      }
    }
  }

  // Run one iteration for all bots, write outputs, detect anomalies
  runIteration(): void {
    // First, run fleet coordination to update all phase-based metrics
    this.fleetCoordination();
    
    for (const bot of this.bots) {
      const config = bot.generateConfig();
      const result = bot.runSimulation();
      const feedback = bot.checkConstraints(result);

      // Write outputs to runs/
      const runName = `run_${String(++this.runCounter).padStart(6, '0')}`;
      writeOutputs('runs', runName, result, config);

      // Detect anomalies
      const anomalies = this.anomalyDetector.detectAnomaliesFromResult(result, `bot_${bot.getId()}`);
      
      // Add spectral anomaly bonus if applicable
      const spectralData = bot.getSpectralData();
      if (spectralData.periodicityScore > 0.5) {
        anomalies.spectral_bonus = spectralData.dominantFrequency * 10;
      }
      
      // Add topology-based anomaly score
      const topologyHistory = bot.getTopologyHistory();
      anomalies.topology_score = topologyHistory.emergenceScore;

      // Add to history
      bot.getHistory().push({ config, feedback, anomalies });

      bot.iterate(feedback);

      // Increment total simulations
      this.totalSimulations++;
    }

    // Check for auto upload every 5000 simulations
    if (this.totalSimulations % 5000 === 0) {
      this.uploadSimulationSummaryToBlockchain();
    }
  }

  // Sort runs/ data into categories based on anomalies, post to blockchain, and limit to top 1000
  async sortRunsData(): Promise<void> {
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
        }).filter((e): e is NonNullable<typeof e> => e !== null && e.step !== undefined);

        // Detect categories and post to blockchain
        const eventCount = events.length;
        if (eventCount > 5) {
          const data = { runDir, events, trajectory: trajectoryJson, score: eventCount };
          await this.blockchainManager.postAnomaly('Event Density', data);
        }

        const phaseData = trajectoryJson.map((s: any) => s.phase);
        const phaseAnomalies = this.anomalyDetector.detectAnomalies(phaseData);
        if (phaseAnomalies.length > 0) {
          const data = { runDir, events, trajectory: trajectoryJson, anomalies: phaseAnomalies, score: Math.max(...phaseAnomalies) };
          await this.blockchainManager.postAnomaly('Phase Anomaly', data);
        }

        // Check for Spiral Phase Dynamics: multiplicative jumps
        const phaseJumps = events.map(e => e.phaseAfter - e.phaseBefore);
        const hasMultiplicative = phaseJumps.some(jump => jump > 1 && (jump % 7 === 0 || jump % 3 === 0)); // Check for *7 or *3
        if (hasMultiplicative) {
          const data = { runDir, events, trajectory: trajectoryJson, score: phaseJumps.filter(j => j > 1 && (j % 7 === 0 || j % 3 === 0)).length };
          await this.blockchainManager.postAnomaly('Spiral Phase Dynamics', data);
        }
      }
    }

    // Update local categories from blockchain (top 1000 sorted by score descending)
    for (const category of ['Event Density', 'Phase Anomaly', 'Spiral Phase Dynamics']) {
      const topAnomalies = await this.blockchainManager.getTopAnomalies(category, 1000);
      this.categories.set(category, topAnomalies.sort((a, b) => b.score - a.score));
    }

    // Write categories to categories/ folder
    const categoriesDir = 'categories';
    fs.mkdirSync(categoriesDir, { recursive: true });
    for (const [category, data] of this.categories) {
      fs.writeFileSync(`${categoriesDir}/${category.replace(/\s+/g, '_')}.json`, JSON.stringify(data, null, 2));
    }
  }

  // Delete runs not in top 1000 for any category
  deleteNonTopRuns(): void {
    const runsDir = 'runs';
    if (!fs.existsSync(runsDir)) return;
    const runDirs = fs.readdirSync(runsDir).filter(d => d.startsWith('run_'));

    const topRunDirs = new Set<string>();
    for (const category of ['Event Density', 'Phase Anomaly', 'Spiral Phase Dynamics']) {
      const categoryData = this.categories.get(category) || [];
      categoryData.forEach(anomaly => topRunDirs.add(anomaly.runDir));
    }

    for (const runDir of runDirs) {
      if (!topRunDirs.has(runDir)) {
        fs.rmSync(`${runsDir}/${runDir}`, { recursive: true, force: true });
      }
    }
  }

  // Refine logic based on data: add new criteria, vary configs
  refineLogic(): void {
    // Analyze categories to find patterns
    const spiralData = this.categories.get('Spiral Phase Dynamics');
    if (spiralData && spiralData.length > 0) {
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
      this.logicChangeLog.push(`Added custom anomaly detection criterion for discrete spacing bands in event spacings.`);

      // Vary configs: change multiplier/mod for more anomalies
      let configChanges = 0;
      for (const bot of this.bots) {
        if (bot.getHistory().length > 5) {
          const lastConfig = bot.getHistory()[bot.getHistory().length - 1].config;
          lastConfig.multiplier = lastConfig.multiplier === 7 ? 3 : 7; // Alternate
          lastConfig.mod = Math.floor(Math.random() * 1000000) + 1000000; // Vary mod
          configChanges++;
        }
      }
      if (configChanges > 0) {
        this.logicChangeLog.push(`Varied configurations for ${configChanges} bots by alternating multipliers and randomizing mods.`);
      }
    }

    // Log current actions
    this.logicChangeLog.push(`Bot fleet iteration completed. Bots coordinated via blockchain. Anomalies detected and categorized.`);
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

  // Get logic change log
  getLogicChangeLog(): string[] {
    return this.logicChangeLog;
  }

  // Load from local storage (for browser mode)
  private loadFromLocalStorage(): void {
    // Placeholder for browser persistence
    console.log('Loading from local storage not implemented');
  }

  // Upload simulation summary to blockchain for auto deleter bots
  private async uploadSimulationSummaryToBlockchain(): Promise<void> {
    const summary = {
      totalSimulations: this.totalSimulations,
      totalRuns: this.runCounter,
      categories: Object.fromEntries(this.categories),
      timestamp: new Date().toISOString(),
      message: "Auto upload every 5000 simulations for deleter bots"
    };

    // Post to a special category for deleter bots
    await this.blockchainManager.postAnomaly('Simulation Summary', summary);
    this.logicChangeLog.push(`Uploaded simulation summary to blockchain: ${this.totalSimulations} total simulations.`);
  }

  // Summarize current logic of the bots
  getLogicSummary(): string {
    let summary = "Bot Fleet Logic Summary:\n\n";
    summary += `Total Bots: ${this.bots.length}\n`;
    summary += `Groups: 2 (Braided Logic: Alternating Assignment)\n`;
    summary += `Total Simulations Run: ${this.totalSimulations}\n\n`;

    summary += "Bot Logic:\n";
    summary += "- Each bot generates random configurations autonomously.\n";
    summary += "- Configurations include grid size (5-20), initial position/velocity, steps (10k-110k), multiplier (3 or 7), mod (1000003), and random inversion schedules.\n";
    summary += "- Bots run simulations using variants: MirrorInversion, SquareClampReflect, SquareInversionReflect, SquareStickyReflect.\n";
    summary += "- After simulation, bots check constraints: trajectory length >=100, events <1000, positive inversions, phase 0-1, grid size 5-20.\n";
    summary += "- Feedback is provided (valid/invalid with suggestions).\n";
    summary += "- Iteration: If valid, perturb config; if invalid, adjust based on suggestions (e.g., increase steps, reduce steps, fix grid size).\n\n";

    summary += "Fleet Operations:\n";
    summary += "- Continuous running: Every 5 seconds, run iteration, sort data, delete non-top runs, refine logic.\n";
    summary += "- Anomaly Detection: Detect from simulation results, categories: Event Density, Phase Anomaly, Spiral Phase Dynamics.\n";
    summary += "- Blockchain Integration: Post anomalies to smart contract, retrieve top 1000 per category.\n";
    summary += "- Auto Upload: Every 5000 simulations, upload summary to blockchain for auto deleter bots.\n";
    summary += "- Storage Management: Keep only top 1000 runs per category locally, delete others.\n";
    summary += "- Logic Refinement: Analyze Spiral Phase Dynamics to add custom criteria (e.g., spacing bands), vary configs.\n\n";

    summary += "Recent Logic Changes:\n";
    const recentChanges = this.logicChangeLog.slice(-10); // Last 10 changes
    if (recentChanges.length > 0) {
      recentChanges.forEach((change, index) => {
        summary += `${index + 1}. ${change}\n`;
      });
    } else {
      summary += "No recent changes.\n";
    }
    summary += "\n";

    summary += "Current Categories:\n";
    for (const [cat, data] of this.categories) {
      summary += `${cat}: ${data.length} entries\n`;
    }

    return summary;
  }
}

export default BotFleet;
