const Promise = require('bluebird')
const { createRawDataProcessor } = require('./rawDataProcessor')

module.exports = {
  name: 'Default',
  predicate: async () => Promise.resolve(true),
  create: createRawDataProcessor,
}
