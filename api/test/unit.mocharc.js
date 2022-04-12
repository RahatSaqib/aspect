module.exports = {
  recursive: true,
  reporter: 'mocha-multi',
  'reporter-option': ['spec=-', 'json=./unit-test-results.json'],
  extension: ['.test.js'],
  file: 'test/utils/unitTestSetup.js',
  timeout: 10000,
  ui: 'bdd',
  exit: true,
  spec: 'test/**/*.test.js*',
}
