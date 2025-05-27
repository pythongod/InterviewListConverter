/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  transform: {}, // Attempt to use Node's native ESM support
  // If native ESM support doesn't work, we might need to add:
  // extensionsToTreatAsEsm: ['.js'], // Treat .js files as ES modules
  // moduleNameMapper to handle specific paths if needed
};

module.exports = config;
