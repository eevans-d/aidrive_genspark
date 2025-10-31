const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Base URL for the application
    baseUrl: 'http://localhost:3000',
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Test files pattern
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Support file
    supportFile: 'cypress/support/e2e.js',
    
    // Fixtures folder
    fixturesFolder: 'cypress/fixtures',
    
    // Screenshots and videos
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: true,
    screenshotOnRunFailure: true,
    
    // Test settings
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 30000,
    pageLoadTimeout: 30000,
    
    // Browser settings
    chromeWebSecurity: false,
    
    // Environment variables
    env: {
      apiUrl: 'http://localhost:3000/api',
      dbUrl: 'postgresql://postgres:password@localhost:5432/minimarket_test_db'
    },
    
    // Retry settings
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Reporter configuration
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      configFile: 'reporter-config.json'
    },
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      
      // Task for seeding database
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        
        seedDatabase() {
          // Database seeding logic
          console.log('🌱 Seeding test database...');
          return null;
        },
        
        clearDatabase() {
          // Database cleanup logic
          console.log('🧹 Clearing test database...');
          return null;
        }
      });
      
      // Plugin for handling file downloads
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          // Configure download directory
          launchOptions.preferences.default_content_settings = {
            popups: 0
          };
          launchOptions.preferences.default_content_setting_values = {
            notifications: 2
          };
        }
        return launchOptions;
      });
      
      return config;
    },
  },
  
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  },
});