module.exports = {
  recursive: true,
  reporter: 'mocha-multi',
  'reporter-option': ['spec=-', 'json=./contract-test-results.json'],
  extension: ['.spec.js'],
  file: 'test/utils/contractTestSetup.js',
  timeout: 60000,
  ui: 'bdd',
  exit: true,
  spec: 'test/**/*.spec.js*',
}
