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
    await Promise.resolve()
  }
}

module.exports = DefaultDataProcessor
