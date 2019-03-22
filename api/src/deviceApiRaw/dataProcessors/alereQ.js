const Promise = require('bluebird')
const _ = require('lodash')
const DataProcessor = require('./_base')

class DefaultAlereQ extends DataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.processRequest = this.processRequest.bind(this)
    this.deferProcessing = true
  }

  static async canProcessRequest(request) {
    return Promise.resolve(_.get(request, 'payload.type.id') === 'AlereQ')
  }

  async processRequest() {
    await Promise.delay(100000)
    console.log(
      this.name,
      new Date(),
      _.get(this.request, 'payload.requestNumber'),
      'Processing Done :)'
    )
  }
}

module.exports = DefaultAlereQ
