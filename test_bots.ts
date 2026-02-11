const { BotFleet } = require('./src/botFleet.js');

const fleet = new BotFleet();

// Start continuous running for 10 seconds (10 iterations at 1s interval)
fleet.startContinuousRunning(1000);

setTimeout(() => {
  fleet.stopContinuousRunning();
  console.log('Bots stopped. Checking results...');

  // Check if runs/ has new files
  const fs = require('fs');
  const runsDir = 'runs';
  if (fs.existsSync(runsDir)) {
    const runDirs = fs.readdirSync(runsDir).filter((d) => d.startsWith('run_'));
    console.log(`Generated ${runDirs.length} new runs.`);
  } else {
    console.log('No runs/ directory found.');
  }

  // Check categories/
  const categoriesDir = 'categories';
  if (fs.existsSync(categoriesDir)) {
    const categoryFiles = fs.readdirSync(categoriesDir).filter((f) => f.endsWith('.json'));
    console.log(`Generated ${categoryFiles.length} category files:`, categoryFiles);
    categoryFiles.forEach((file) => {
      const data = JSON.parse(fs.readFileSync(`${categoriesDir}/${file}`, 'utf-8'));
      console.log(`${file}: ${data.length} entries`);
    });
  } else {
    console.log('No categories/ directory found.');
  }

  // Check bot history
  const bots = fleet.getBots();
  bots.forEach(bot => {
    console.log(`Bot ${bot.getId()} history length: ${bot.getHistory().length}`);
  });

  console.log('Test completed.');
}, 10000); // 10 seconds
