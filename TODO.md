# TODO: Add WebSocket Live Updates to Autorunner and Browser

## Steps to Complete
- [x] Add 'ws' WebSocket library to package.json dependencies
- [x] Modify src/autorunner.ts to integrate WebSocket server on port 8080
  - Start WebSocket server at the beginning
  - After each run, broadcast run results (run count, anomalies, etc.) to connected clients
  - Add pause logic: Every 10 runs, pause for 5 seconds to "upload" data (broadcast accumulated data), then resume
- [x] Modify src/browser.ts to add WebSocket client
  - Connect to WebSocket server on page load
  - Listen for messages and update UI elements (run count, anomalies table) in real-time
- [x] Install dependencies with npm install
- [x] Test: Run autorunner in background (npm run autorunner) and browser (npm run browser) to verify live updates

## Notes
- WebSocket server broadcasts JSON messages with run data.
- Browser updates #runCount, #anomaliesTable, etc., on receiving messages.
- Autorunner pauses briefly to simulate uploading data before resuming simulations.

# TODO: Update Bot Coordination Visualization

## Steps to Complete
- [x] Separate bots into two groups (Group 0 and Group 1)
- [x] Assign 3 distinct colors per group (blue/green/light blue for Group 0, red/orange/dark red for Group 1)
- [x] Arrange bots around circles for each group
- [x] Draw solid white lines for intra-group cooperation
- [x] Draw dashed yellow lines for inter-group relative tasks
- [x] Add labels for groups and tasks

## Notes
- Visualization updates live during continuous bot running.
- Groups represent different cooperation strategies.

# TODO: Translate Current Objective into Words

## Steps to Complete
- [x] Describe the bots' infinite search through parameter space for optimal quantum inversion configurations
- [x] Explain direction towards low randomness, high structure, strong reemergence, quantized bands, prime envelopes, periodic spectra
- [x] Detail mathematical reasoning: anomaly thresholds (randomness < 0.5, structure > 0.5, reemergence < 100), PDF checks, spectral variance
- [x] Outline parameter adjustments: cycling multipliers 1-20, increasing grid sizes to 15x15, recalculating inversion schedules

## Notes
- Added as comment in src/autorunner.ts for documentation.

# TODO: Implement Dynamic Anomaly Detection and Weighting

## Steps to Complete
- [x] Autorunner detects new anomalies by itself (event_density, trajectory_variance, phase_periodicity, inversion_frequency, velocity_anomaly, chaos_index)
- [x] Names and categorizes new anomalies in the leaderboard dynamically
- [x] Uses logic to find whatever it wants: adaptive anomaly detection based on run-specific metrics
- [x] Makes weights changeable: scores are calculated and ranked live in leaderboard
- [x] Ensures simulations are different: cycles multipliers 1-20, increases grid sizes up to 15x15, recalculates inversion schedules
- [x] Puts in writing what logic it is diverging from (static thresholds) and logic it is using (adaptive detection, parameter space exploration to minimize anomalies and maximize coherence)

## Notes
- New anomalies are logged with explanations of diverging logic and trajectory exploration.
- Leaderboard updates live with top 10 per category sorted by anomaly score descending.
- Autorunner broadcasts topK data via WebSocket for real-time UI updates.

# TODO: Add Ratio-Based Data Collection, Config Inputs, Visualizations, and Batched Auto Upload

## Steps to Complete
- [ ] Update anomaly computation in autorunner.ts to include ratio versions (normalized to sum to 1)
- [ ] Store ratios in TopKAnomalyStore entries
- [ ] Add ratio input options in browser.ts UI (sliders/inputs for config ratios)
- [ ] Modify getConfigFromUI to compute discrete values from ratios
- [ ] Add toggle for discrete vs ratio input mode
- [ ] Implement ratio visualizations (bar charts for anomaly ratios, pie charts for config ratios)
- [ ] Change auto-commit logic in autorunner.ts to batch commits (every 10 insertions or 5-minute interval)
- [ ] Test autorunner with ratio data and batched commits
- [ ] Test browser UI with ratio inputs and visualizations
- [ ] Verify Git commits are batched and not overwhelming

## Notes
- Ratios represent relative weights in optimality search.
- Batch commits reduce Git overhead for large data uploads.
