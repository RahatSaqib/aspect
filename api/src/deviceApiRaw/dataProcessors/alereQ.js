const Promise = require('bluebird')
const _ = require('lodash')
const { RawDataProcessor } = require('./rawDataProcessor')

class DefaultAlereQ extends RawDataProcessor {
  constructor(name, deviceApiRawRecord, messageContext) {
    super(name, deviceApiRawRecord, messageContext)
    this.processRequest = this.processRequest.bind(this)
  }

  async processRequest() {
    this.messageContext.deviceRawMessageProcessed(this.id, this.id)
    return Promise.resolve()
  }
}

function createRawDataProcessor(name, deviceApiRawRecord, messageContext) {
  return new DefaultAlereQ(name, deviceApiRawRecord, messageContext)
}

module.exports = {
  name: 'DefaultAlereQ',
  predicate: async decrypteDeviceApiRaw =>
    Promise.resolve(
      _.get(decrypteDeviceApiRaw, 'rawData.payload.type.id') === 'AlereQ'
    ),
  create: createRawDataProcessor,
}
