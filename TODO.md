# TODO: Continue with Multi-Autorunner Enhancements

## Detailed Steps to Complete
- [x] Update TODO.md with detailed breakdown
- [x] Enhance autorunner.ts: Remove batched commit logic, add instant git add/commit/push after each autorunner run (already implemented)
- [x] Divide bot fleet into 3 groups (3,4,1) with opposing logic, mediating single bot, dynamic assignment for imbalance
- [ ] Update browser.ts: Add WebSocket onmessage handlers for 'autorunnerUpdate' (update individual autorunner position/direction/anomalies/trajectory/group) and 'cycleUpdate' (update collective anomalies, topK tables, cycle count, group summaries)
- [ ] Update browser.ts: Implement 2D autorunner map rendering in #mapCanvas - draw grid with multiplier on x-axis (1-20), sizeX on y-axis (5-15), plot autorunner positions as points, animate trajectories as lines (solid for current logic path, dashed for deviations), color-code by group
- [ ] Create generate_summary.js: Node.js script to read latest run data, anomaly stores, and generate/update summary.txt with logical definitions, key deductions, and summary based on simulation results
- [ ] Debug WebSocket/UI: Ensure WebSocket connects, messages are received, map updates live, tables refresh with topK data, group visualizations
- [ ] Test the enhanced system: Run autorunner, check instant commits, open browser, verify live map animations and updates, group dynamics

## Notes
- Trajectory lines: Each autorunner has a trajectory array of {x,y} positions over cycles; draw lines connecting them on the map.
- Current logic vs deviations: Solid lines for the main path (e.g., increasing sizeX), dashed for deviations (e.g., decreasing multiplier).
- Live updates: Map should redraw on each 'autorunnerUpdate', tables on 'cycleUpdate'.
- Instant autocommit: After each autorunner run, git add ., commit with message like "Instant commit autorunner X run Y", push.
- Summary script: Use fs to read JSON files, analyze data, write to summary.txt in structured format.
- Groups: Group1 (1-3): increase on high anomalies; Group2 (4-7): decrease; Group3 (8): mediate, assign extra autorunner for imbalance.
