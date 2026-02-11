# TODO: Complete Bot Fleet Automation and Anomaly Analysis

## Step 1: Create summary.txt
- Deduce from CORNERPHEN.rtf against simulation logic (phase updates, spacing bands, configs).
- Include math (e.g., spacings s_i - s_{i-1}, phase φ +1 or 7φ mod M), reasoning, and configs (5x7, multiplier 7, mod 1000003).
- Output: summary.txt in root directory.
- [x] COMPLETED

## Step 2: Modify BotFleet for continuous running
- Update botFleet.ts to run iterations continuously in background (e.g., setInterval).
- Bots use simulation data to update logic: Analyze history for new anomaly criteria and categories.
- Integrate anomaly detection to sort data into categories.
- [x] COMPLETED

## Step 3: Sort runs/ data into categories
- Bots read existing runs/ files (.events.csv, .trajectory.json).
- Detect anomalies/structures (e.g., spacing bands, phase ladders).
- Create categories/ folder and sort data (e.g., 'Event Density', 'Phase Anomaly', 'Spiral Phase Dynamics').
- [x] COMPLETED

## Step 4: Define new logic category 'Spiral Phase Dynamics'
- Add criteria in anomaly_metrics.ts for detecting phase ladders (multiplicative jumps) and spirals.
- Bots use this to find more anomalies by varying configs (multiplier, mod) or adding criteria.
- [x] COMPLETED

## Step 5: Iterate and collect data
- Bots run simulations continuously, refine configs/logic based on data.
- Collect better data iteratively to reveal next steps autonomously.
- Test: Run bots via execute_command to verify background operation and data collection.
- [x] COMPLETED - Bots are now running continuously in background, collecting data, sorting into categories, and refining logic.
