module.exports = {
  recursive: true,
  reporter: 'mocha-multi',
  'reporter-option': ['spec=-', 'mocha-bamboo-reporter=-'],
  extension: ['.test.js'],
  file: 'test/utils/unitTestSetup.js',
  timeout: 10000,
  ui: 'bdd',
  exit: true,
  spec: 'test/**/*.test.js*',
}
