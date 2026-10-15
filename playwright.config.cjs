const {defineConfig} = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  timeout: 45000,
  workers: 2,
  reporter: 'list',
  use: {baseURL:'http://127.0.0.1:4173', channel:process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless:true},
  webServer: {command:'node tests/server.cjs',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI}
});
