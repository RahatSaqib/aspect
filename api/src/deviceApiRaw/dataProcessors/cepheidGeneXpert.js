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
    await Promise.delay(10000)
  }
}

module.exports = DefaultCepheidGeneXpert
