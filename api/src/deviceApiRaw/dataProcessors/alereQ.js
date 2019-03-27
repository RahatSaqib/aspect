const Promise = require('bluebird')
const _ = require('lodash')
const { AsynchronousDataProcessor } = require('./_base')

class DefaultAlereQ extends AsynchronousDataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.processRequest = this.processRequest.bind(this)
  }

  static async canProcessRequest(request) {
    return Promise.resolve(_.get(request, 'payload.type.id') === 'AlereQ')
  }

  async processRequest() {
    await Promise.delay(1000)
    console.log(
      this.name,
      new Date(),
      _.get(this.request, 'payload.requestNumber'),
      'Processing Done :)'
    )
  }
}

module.exports = DefaultAlereQ
