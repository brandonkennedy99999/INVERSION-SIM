# INVERSION-SIM

A simulation framework for grid-based inversion dynamics, supporting multi-inversion schedules, anomaly tracking, and stress testing.

## Features
- Multi-inversion protocol with customizable schedules
- Anomaly detection and top-K anomaly storage
- Stress testing and batch simulation
- Modular variant system for different grid behaviors

## Usage

### Running a Simulation
Run the main simulation with:

```
npx tsx src/main.ts
```

Simulation outputs are saved in the `runs/` directory, with events and trajectory files for each run.

### Stress Testing
Run stress tests to batch-generate runs and analyze anomalies:

```
npx tsx src/stress.ts <runs> <seed>
```

Or for fast stress testing:

```
npx tsx src/stress_fast.ts <runs> <seed>
```

### Project Structure
- `src/` — Main source code
- `anomalies/` — Top anomaly results
- `runs/` — Output of simulation runs
- `data/` — Input data and logs

## Extending
- Add new variants in `src/variants/`
- Update anomaly logic in `src/anomaly_store.ts`
- Add new CLI tools or scripts in `src/`

## Requirements
- Node.js
- tsx (TypeScript executor)

---
For more details, see comments in each source file.
