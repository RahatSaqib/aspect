const Promise = require('bluebird')
const _ = require('lodash')
const DataProcessor = require('./_base')

class DefaultCepheidGeneXpert extends DataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.processRequest = this.processRequest.bind(this)
  }

  static async canProcessRequest(request) {
    return Promise.resolve(
      _.get(request, 'payload.type.id') === 'CepheidGeneXpert'
    )
  }

  async processRequest() {
    this.messageContext.deviceRawMessageResponseReady(this.id, this.id)
    this.messageContext.deviceRawMessageProcessed(this.id)
    return Promise.resolve()
  }
}

module.exports = DefaultCepheidGeneXpert
