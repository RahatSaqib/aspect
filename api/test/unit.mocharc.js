module.exports = {
  recursive: true,
  'reporter-option': ['spec=-', 'maxDiffSize=250000'],
  extension: ['.test.js'],
  file: 'test/utils/unitTestSetup.js',
  timeout: 10000,
  ui: 'bdd',
  exit: true,
  spec: 'test/**/*.test.js*',
}
