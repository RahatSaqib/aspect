const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('boom')
const { createSalt, encrypt } = require('../../shared/encryption')
const { getUtcTime } = require('../../shared/date')
const { deviceApiRawStatusToId } = require('../../shared/dictionary')
const { knex } = require('../../db')
const {
  types,
  deviceRawMessagePosted,
  deviceRawMessageResponseReady,
  deviceRawMessageProcessed,
  deviceRawMessageError,
} = require('../actions')

class DataProcessor {
  constructor(request, messageContext) {
    this.name = this.constructor.name
    this.id = null
    this.timeoutMilliseconds = 60000
    this.timeoutMessage = 'Timeout waiting for raw message to be handled'
    this.request = request
    this.messageContext = messageContext.bindActionCreators({
      deviceRawMessageResponseReady,
      deviceRawMessagePosted,
      deviceRawMessageProcessed,
      deviceRawMessageError,
    })
    this.saveRequestAsReady = this.saveRequestAsReady.bind(this)
    this.start = this.start.bind(this)
    this.responseReadyPromise = this.responseReadyPromise.bind(this)
    this.dataProcessorErrorPromise = this.dataProcessorErrorPromise.bind(this)
    this.getResponse = this.getResponse.bind(this)
    this.processRequest = this.processRequest.bind(this)
  }

  static async canProcessRequest() {
    return Promise.resolve(false)
  }

  async saveRequestAsReady() {
    const { auth = { credentials: { token: null } } } = this.request
    const { credentials: { token } } = auth
    const salt = createSalt()
    const utcNow = getUtcTime()
    const deviceApiKey = await knex('DeviceApiKey')
      .where({ token })
      .first()
    const [deviceApiRawId] = await knex('DeviceApiRaw').insert({
      rawData: encrypt(
        JSON.stringify(
          _.pick(
            this.request,
            'url',
            'query',
            'path',
            'method',
            'mime',
            'headers',
            'info',
            'id',
            'app',
            'auth',
            'params',
            'paramsArray',
            'payload'
          )
        ),
        salt
      ),
      salt,
      deviceApiKeyId: deviceApiKey.id,
      deviceApiKeySnapshot: JSON.stringify(deviceApiKey),
      deviceApiRawStatusId: await deviceApiRawStatusToId('Ready'),
      dataProcessor: this.name,
      createdOn: utcNow,
      updatedOn: utcNow,
    })
    this.id = deviceApiRawId
  }

  async start() {
    try {
      const lockedId = await deviceApiRawStatusToId('Locked')
      const deviceApiRawRecord = await knex('DeviceApiRaw')
        .where('id', this.id)
        .first()
      if (deviceApiRawRecord.deviceApiRawStatusId === lockedId) {
        throw Boom.locked(
          'The raw message record has already been locked for processing',
          { deviceApiRawId: this.id }
        )
      }
      await DataProcessor.updateDeviceApiRawStatus(this.id, 'Locked')

      const actionIsForThisDataProcessorInstance = action =>
        action.deviceApiRawId === this.id
      this.messageContext.queue.subscribe('deviceApiRaw', [
        {
          actions: {
            DEVICE_RAW_MESSAGE_POSTED: {
              handlerFunction: this.handlerFunction,
              shouldHandle: actionIsForThisDataProcessorInstance,
              allowInfiniteListeners: true,
              consumerTag: `${this.name}_${this.id}`,
            },
          },
        },
      ])
      this.messageContext.deviceRawMessagePosted(this.id)
    } catch (error) {
      this.messageContext.deviceRawMessageError(this.id, error)
    }
  }

  responseReadyPromise() {
    if (!this.id) {
      throw new Error('The request needs to be saved first')
    }
    return this.messageContext.queue
      .waitForAction(
        {
          type: types.DEVICE_RAW_MESSAGE_RESPONSE_READY,
          deviceApiRawId: this.id,
        },
        this.timeoutMilliseconds,
        this.timeoutMessage
      )
      .then(action => action.response)
  }

  dataProcessorErrorPromise() {
    if (!this.id) {
      throw new Error('The request needs to be saved first')
    }
    return this.messageContext.queue
      .waitForAction(
        {
          type: types.DEVICE_RAW_MESSAGE_ERROR,
          deviceApiRawId: this.id,
        },
        this.timeoutMilliseconds,
        this.timeoutMessage
      )
      .then(action => {
        if (_.get(action, 'error.isBoom')) {
          const errorPayload = _.get(action, 'error.output.payload', {})
          const statusCode =
            _.get(action, 'error.output.statusCode') ||
            _.get(errorPayload, 'statusCode')
          const error = Boom.boomify(
            new Error(_.get(errorPayload, 'message')),
            { statusCode }
          )
          if (_.get(action, 'error.data')) {
            error.data = _.get(action, 'error.data')
          }
          throw error
        }
        throw action.error
      })
  }

  static async updateDeviceApiRawStatus(id, status) {
    return knex('DeviceApiRaw')
      .where('id', id)
      .update({
        deviceApiRawStatusId: await deviceApiRawStatusToId(status),
        updatedOn: getUtcTime(),
      })
  }

  async getResponse() {
    return Promise.resolve(this.id)
  }

  async processRequest() {
    return Promise.resolve()
  }

  static async onDeviceRawMessageProcessed({ deviceApiRawId }) {
    return DataProcessor.updateDeviceApiRawStatus(deviceApiRawId, 'Processed')
    // TODO: Archive message?
  }

  static async onDeviceRawMessageError({ deviceApiRawId }) {
    return DataProcessor.updateDeviceApiRawStatus(deviceApiRawId, 'Error')
    // TODO: Archive message?
  }
}

class SynchronousDataProcessor extends DataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.handlerFunction = this.handlerFunction.bind(this)
  }

  static async canProcessRequest() {
    return DataProcessor.canProcessRequest()
  }

  async handlerFunction() {
    await this.processRequest()
    const response = await this.getResponse()
    this.messageContext.deviceRawMessageResponseReady(this.id, response)
    this.messageContext.deviceRawMessageProcessed(this.id)
    this.messageContext.queue.unsubscribe(`${this.name}_${this.id}`)
  }
}

class AsynchronousDataProcessor extends DataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.handlerFunction = this.handlerFunction.bind(this)
  }

  static async canProcessRequest() {
    return DataProcessor.canProcessRequest()
  }

  async handlerFunction() {
    const response = await this.getResponse()
    this.messageContext.deviceRawMessageResponseReady(this.id, response)
    await this.processRequest()
    this.messageContext.deviceRawMessageProcessed(this.id)
    this.messageContext.queue.unsubscribe(`${this.name}_${this.id}`)
  }
}

module.exports = {
  SynchronousDataProcessor,
  AsynchronousDataProcessor,
  onDeviceRawMessageProcessed: DataProcessor.onDeviceRawMessageProcessed,
  onDeviceRawMessageError: DataProcessor.onDeviceRawMessageError,
}
