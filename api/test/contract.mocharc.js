module.exports = {
  recursive: true,
  reporter: 'mocha-multi',
  'reporter-option': ['spec=-', 'mocha-bamboo-reporter=-'],
  extension: ['.spec.js'],
  checkLeaks: true,
  file: 'test/utils/contractTestSetup.js',
  timeout: 60000,
  ui: 'bdd',
  exit: true,
  spec: 'test/**/*.spec.js*',
}
