const Promise = require('bluebird')
const { createRawDataProcessor } = require('./rawDataProcessor')

module.exports = {
  name: 'DefaultUnknown',
  predicate: async () => Promise.resolve(true),
  create: createRawDataProcessor,
}
