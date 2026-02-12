# TODO: Add WebSocket Live Updates to Autorunner and Browser

## Steps to Complete
- [ ] Add 'ws' WebSocket library to package.json dependencies
- [ ] Modify src/autorunner.ts to integrate WebSocket server on port 8080
  - Start WebSocket server at the beginning
  - After each run, broadcast run results (run count, anomalies, etc.) to connected clients
  - Add pause logic: Every 10 runs, pause for 5 seconds to "upload" data (broadcast accumulated data), then resume
- [ ] Modify src/browser.ts to add WebSocket client
  - Connect to WebSocket server on page load
  - Listen for messages and update UI elements (run count, anomalies table) in real-time
- [ ] Install dependencies with npm install
- [ ] Test: Run autorunner in background (npm run autorunner) and browser (npm run browser) to verify live updates

## Notes
- WebSocket server broadcasts JSON messages with run data.
- Browser updates #runCount, #anomaliesTable, etc., on receiving messages.
- Autorunner pauses briefly to simulate uploading data before resuming simulations.
