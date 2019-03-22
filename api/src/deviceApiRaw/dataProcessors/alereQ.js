const Promise = require('bluebird')
const _ = require('lodash')
const DataProcessor = require('./_base')

class DefaultAlereQ extends DataProcessor {
  constructor(deviceApiRawRecord, messageContext) {
    super('DefaultAlereQ', deviceApiRawRecord, messageContext)
    this.processRequest = this.processRequest.bind(this)
  }

  static async canProcessRequest(decrypteDeviceApiRaw) {
    return Promise.resolve(
      _.get(decrypteDeviceApiRaw, 'rawData.payload.type.id') === 'AlereQ'
    )
  }

  async processRequest() {
    this.messageContext.deviceRawMessageResponseReady(this.id, this.id)
    this.messageContext.deviceRawMessageProcessed(this.id)
    return Promise.resolve()
  }
}

module.exports = DefaultAlereQ
