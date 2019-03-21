const Promise = require('bluebird')
const { createRawDataProcessor } = require('./rawDataProcessor')

function createDefaultRawDataProcessor(deviceApiRawRecord, messageContext) {
  return createRawDataProcessor('Default', deviceApiRawRecord, messageContext)
}

module.exports = {
  predicate: async () => Promise.resolve(true),
  create: createDefaultRawDataProcessor,
}
