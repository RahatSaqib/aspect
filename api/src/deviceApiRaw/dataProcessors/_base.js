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
    this.messageContext = messageContext
    this.encryptRawData = true
    this.saveRequestAsReady = this.saveRequestAsReady.bind(this)
    this.populateFromDeviceApiRawRecord = this.populateFromDeviceApiRawRecord.bind(
      this
    )
    this.start = this.start.bind(this)
    this.responseReadyPromise = this.responseReadyPromise.bind(this)
    this.dataProcessorErrorPromise = this.dataProcessorErrorPromise.bind(this)
    this.updateDeviceApiRawStatus = this.updateDeviceApiRawStatus.bind(this)
    this.getResponse = this.getResponse.bind(this)
    this.processRequest = this.processRequest.bind(this)
    this.onDeviceRawMessageProcessed = this.onDeviceRawMessageProcessed.bind(
      this
    )
    this.onDeviceRawMessageError = this.onDeviceRawMessageError.bind(this)
    this.unsubscribe = this.unsubscribe.bind(this)
    this.listenerEndpoints = []
  }

  static async canProcessRequest() {
    return Promise.resolve(false)
  }

  async saveRequestAsReady() {
    const { auth = { credentials: { token: null } } } = this.request
    const {
      credentials: { token },
    } = auth
    const utcNow = getUtcTime()
    const deviceApiKey = await knex('DeviceApiKey')
      .where({ token })
      .first()
    let salt = null
    let rawData = JSON.stringify(
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
    )
    if (this.encryptRawData) {
      salt = createSalt()
      rawData = encrypt(rawData, salt)
    }
    const [deviceApiRawId] = await knex('DeviceApiRaw').insert({
      rawData,
      salt,
      deviceApiKeyId: deviceApiKey.id,
      deviceApiKeySnapshot: JSON.stringify(deviceApiKey),
      deviceApiRawStatusId: await deviceApiRawStatusToId('Ready'),
      dataProcessor: this.name,
      createdOn: utcNow,
      updatedOn: utcNow,
    })
    this.id = deviceApiRawId
    this.messageContext = this.messageContext.bindActionCreators(
      {
        deviceRawMessageResponseReady,
        deviceRawMessagePosted,
        deviceRawMessageProcessed,
        deviceRawMessageError,
      },
      this.id
    )
  }

  populateFromDeviceApiRawRecord(deviceApiRawRecord) {
    this.id = deviceApiRawRecord.id
    this.messageContext = this.messageContext.bindActionCreators(
      {
        deviceRawMessageResponseReady,
        deviceRawMessagePosted,
        deviceRawMessageProcessed,
        deviceRawMessageError,
      },
      this.id
    )
  }

  async start() {
    try {
      const actionIsForThisDataProcessorInstance = action =>
        action.deviceApiRawId === this.id
      const dataProcessorMessageHandlerSpec = {
        shouldHandle: actionIsForThisDataProcessorInstance,
        allowInfiniteListeners: true,
        bindingKey: `${this.id}`,
      }
      // TODO: Set message expiry on these queues so that they aren't blocked
      this.listenerEndpoints = [
        {
          actions: {
            DEVICE_RAW_MESSAGE_RESPONSE_READY: {
              ...dataProcessorMessageHandlerSpec,
              handlerFunction: async () => Promise.resolve(),
              consumerTag: `${this.name}_DEVICE_RAW_MESSAGE_RESPONSE_READY_${this.id}`,
            },
            DEVICE_RAW_MESSAGE_POSTED: {
              ...dataProcessorMessageHandlerSpec,
              handlerFunction: async () => {
                try {
                  await this.handlerFunction()
                } catch (error) {
                  this.messageContext.deviceRawMessageError(this.id, error)
                }
                await this.unsubscribe()
              },
              consumerTag: `${this.name}_DEVICE_RAW_MESSAGE_POSTED_${this.id}`,
            },
            DEVICE_RAW_MESSAGE_PROCESSED: {
              ...dataProcessorMessageHandlerSpec,
              handlerFunction: this.onDeviceRawMessageProcessed,
              consumerTag: `${this.name}_DEVICE_RAW_MESSAGE_PROCESSED_${this.id}`,
            },
            DEVICE_RAW_MESSAGE_ERROR: {
              ...dataProcessorMessageHandlerSpec,
              handlerFunction: this.onDeviceRawMessageError,
              consumerTag: `${this.name}_DEVICE_RAW_MESSAGE_ERROR_${this.id}`,
            },
          },
        },
      ]

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
      await this.updateDeviceApiRawStatus('Locked')

      this.messageContext.queue.subscribe(
        'deviceApiRaw',
        this.listenerEndpoints
      )
      // TODO: Find out how to check that the queue has been bound to the topic before dispatching DEVICE_RAW_MESSAGE_POSTED
      await Promise.delay(100)
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

  async updateDeviceApiRawStatus(status) {
    const deviceApiRawStatusId = await deviceApiRawStatusToId(status)
    return knex('DeviceApiRaw')
      .where('id', this.id)
      .update({
        deviceApiRawStatusId,
        updatedOn: getUtcTime(),
      })
  }

  async getResponse() {
    return Promise.resolve(this.id)
  }

  async processRequest() {
    return Promise.resolve()
  }

  async onDeviceRawMessageProcessed() {
    await this.updateDeviceApiRawStatus('Processed')
    // TODO: Archive message?
  }

  async onDeviceRawMessageError() {
    await this.updateDeviceApiRawStatus('Error')
    // TODO: Archive message?
    await this.unsubscribe()
  }

  // TODO: FIX: When the server is terminated, running data processors don't call this, leaving messages on the queue and blocking future data processors.
  async unsubscribe() {
    _.each(this.listenerEndpoints, (listenerEndpoint, index) => {
      _.each(listenerEndpoint.actions, (messageHandler, type) => {
        const queueName = `aspect_deviceApiRaw_${index}_actions_${type}`
        const topic = `aspect.actions.${type}.${messageHandler.bindingKey}`
        this.messageContext.queue.unsubscribe(
          queueName,
          topic,
          messageHandler.consumerTag
        )
      })
    })
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
    this.messageContext.deviceRawMessageProcessed(this.id)
    const response = await this.getResponse()
    this.messageContext.deviceRawMessageResponseReady(this.id, response)
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
  }
}

module.exports = {
  SynchronousDataProcessor,
  AsynchronousDataProcessor,
}
