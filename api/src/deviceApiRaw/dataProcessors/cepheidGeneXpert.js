const Promise = require('bluebird')
const _ = require('lodash')
const { RawDataProcessor } = require('./rawDataProcessor')

class DefaultCepheidGeneXpert extends RawDataProcessor {
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
  return new DefaultCepheidGeneXpert(name, deviceApiRawRecord, messageContext)
}

module.exports = {
  name: 'DefaultCepheidGeneXpert',
  predicate: async decrypteDeviceApiRaw =>
    Promise.resolve(
      _.get(decrypteDeviceApiRaw, 'rawData.payload.type.id') ===
        'CepheidGeneXpert'
    ),
  create: createRawDataProcessor,
}
