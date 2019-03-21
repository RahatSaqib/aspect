const Promise = require('bluebird')
const _ = require('lodash')
const { RawDataProcessor } = require('./rawDataProcessor')

class DefaultAlereQ extends RawDataProcessor {
  constructor(deviceApiRawRecord, messageContext) {
    super('DefaultAlereQ', deviceApiRawRecord, messageContext)
    this.processRequest = this.processRequest.bind(this)
  }

  async processRequest() {
    this.messageContext.deviceRawMessageResponseReady(this.id, this.id)
    this.messageContext.deviceRawMessageProcessed(this.id)
    return Promise.resolve()
  }
}

function createRawDataProcessor(deviceApiRawRecord, messageContext) {
  return new DefaultAlereQ(deviceApiRawRecord, messageContext)
}

module.exports = {
  predicate: async decrypteDeviceApiRaw =>
    Promise.resolve(
      _.get(decrypteDeviceApiRaw, 'rawData.payload.type.id') === 'AlereQ'
    ),
  create: createRawDataProcessor,
}
