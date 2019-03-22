const Promise = require('bluebird')
const DataProcessor = require('./_base')

class DefaultDataProcessor extends DataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.processRequest = this.processRequest.bind(this)
  }

  static async canProcessRequest() {
    return Promise.resolve(true)
  }

  async processRequest() {
    this.messageContext.deviceRawMessageResponseReady(this.id, this.id)
    this.messageContext.deviceRawMessageProcessed(this.id)
    return Promise.resolve()
  }
}

module.exports = DefaultDataProcessor
