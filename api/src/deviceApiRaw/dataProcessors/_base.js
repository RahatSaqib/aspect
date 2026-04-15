const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('@hapi/boom')
const config = require('../../config')
const { createSalt, encrypt } = require('../../shared/encryption')
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
    this.populateFromDeviceApiRawRecord = this.populateFromDeviceApiRawRecord.bind(this)
    this.start = this.start.bind(this)
    this.responseReadyPromise = this.responseReadyPromise.bind(this)
    this.dataProcessorErrorPromise = this.dataProcessorErrorPromise.bind(this)
    this.updateDeviceApiRawStatus = this.updateDeviceApiRawStatus.bind(this)
    this.getResponse = this.getResponse.bind(this)
    this.processRequest = this.processRequest.bind(this)
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
    const now = new Date()
    const deviceApiKey = token ? await knex('DeviceApiKey').where({ token }).first() : null
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
      deviceApiKeyId: _.get(deviceApiKey, 'id'),
      deviceApiKeySnapshot: JSON.stringify(deviceApiKey),
      deviceApiRawStatusId: await deviceApiRawStatusToId('Ready'),
      dataProcessor: this.name,
      createdOn: now,
      updatedOn: now,
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
      const actionIsForThisDataProcessorInstance = action => action.deviceApiRawId === this.id
      const dataProcessorMessageHandlerSpec = {
        shouldHandle: actionIsForThisDataProcessorInstance,
        allowInfiniteListeners: true,
        bindingKey: `${this.id}`,
      }
      this.listenerEndpoints = [
        {
          actions: {
            DEVICE_RAW_MESSAGE_RESPONSE_READY: {
              ...dataProcessorMessageHandlerSpec,
              handlerFunction: this.onDeviceRawMessageReady,
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
      const deviceApiRawRecord = await knex('DeviceApiRaw').where('id', this.id).first()
      if (deviceApiRawRecord.deviceApiRawStatusId === lockedId) {
        throw Boom.locked('The raw message record has already been locked for processing', { deviceApiRawId: this.id })
      }
      await this.updateDeviceApiRawStatus('Locked')

      this.messageContext.queue.subscribe('deviceApiRaw', this.listenerEndpoints, this.timeoutMilliseconds)
      // Wait for consumers, for this DataProcessor instance, to be registered on the queue's channel
      const getDataProcessorConsumersListeningToQueue = () =>
        Object.values(this.listenerEndpoints[0].actions).map(
          action => this.messageContext.queue.channel.consumers[action.consumerTag]
        )
      let ensureConsumers = getDataProcessorConsumersListeningToQueue()
      await Promise.each(_.range(1, 100), async waitMs => {
        if (_.some(ensureConsumers, consumer => _.isNil(consumer))) {
          await Promise.delay(waitMs)
          ensureConsumers = getDataProcessorConsumersListeningToQueue()
          return Promise.resolve(waitMs)
        }
        return Promise.reject(new Error('subscribed'))
      })
        .then(waitMsArray => {
          throw new Error(`${this.name} ${this.id} still unsubscribed after ${_.sum(waitMsArray)} milliseconds`)
        })
        .catch(err => {
          if (err.message === 'subscribed') {
            this.messageContext.deviceRawMessagePosted(this.id)
          } else {
            throw err
          }
        })
    } catch (error) {
      await this.onDeviceRawMessageError()
      throw error
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
          const statusCode = _.get(action, 'error.output.statusCode') || _.get(errorPayload, 'statusCode')
          const error = Boom.boomify(new Error(_.get(errorPayload, 'message')), { statusCode })
          if (_.get(action, 'error.data')) {
            error.data = _.get(action, 'error.data')
          }
          throw error
        }
        throw action.error
      })
  }

  async updateDeviceLastSeenOn(deviceId, now, knexInstance = knex) {
    return knexInstance('Device').where('id', deviceId).update({ lastSeenOn: now, updatedOn: now })
  }

  async updateDeviceApiRawStatus(status, extraFields = {}) {
    const deviceApiRawStatusId = await deviceApiRawStatusToId(status)
    return knex('DeviceApiRaw')
      .where('id', this.id)
      .update({
        deviceApiRawStatusId,
        updatedOn: new Date(),
        ...extraFields,
      })
  }

  async getResponse() {
    return Promise.resolve(this.id)
  }

  async processRequest() {
    return Promise.resolve()
  }

  async onDeviceRawMessageError() {
    await this.updateDeviceApiRawStatus('Error')
    // TODO: Archive message?
    await this.unsubscribe()
  }

  // TODO: FIX: When the server is terminated, running data processors don't call this, leaving messages on the queue and blocking future data processors.
  async unsubscribe() {
    await Promise.each(this.listenerEndpoints, async (listenerEndpoint, index) =>
      Promise.each(Object.keys(listenerEndpoint.actions), async type => {
        const action = listenerEndpoint.actions[type]
        const queueName = `${config.amqp.name}_deviceApiRaw_${index}_actions_${type}`
        const topic = `aspect.actions.${type}.${action.bindingKey}`
        if (this.messageContext.queue.channel.consumers[action.consumerTag]) {
          this.messageContext.queue.unsubscribe(queueName, topic, action.consumerTag)
          this.messageContext.queue.channel.unbindQueue(queueName, 'aspect', topic)
          this.messageContext.queue.channel.cancel(action.consumerTag)
          await Promise.each(_.range(1, 100), async waitMs => {
            if (!_.isNil(this.messageContext.queue.channel.consumers[action.consumerTag])) {
              await Promise.delay(waitMs)
              return Promise.resolve(waitMs)
            }
            return Promise.reject(new Error('unsubscribed'))
          })
            .then(waitMsArray => {
              throw new Error(
                `${this.name} ${this.id} still subscribed to ${action.consumerTag} after ${_.sum(
                  waitMsArray
                )} milliseconds`
              )
            })
            .catch(err => {
              if (err.message !== 'unsubscribed') {
                throw err
              }
            })
        } else {
          return Promise.resolve()
        }
      })
    )
  }
}

class SynchronousDataProcessor extends DataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.handlerFunction = this.handlerFunction.bind(this)
    this.onDeviceRawMessageProcessed = this.onDeviceRawMessageProcessed.bind(this)
    this.onDeviceRawMessageReady = this.onDeviceRawMessageReady.bind(this)
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

  async onDeviceRawMessageProcessed() {
    await this.updateDeviceApiRawStatus('Processed')
    // TODO: Archive message?
  }

  async onDeviceRawMessageReady() {
    return this.unsubscribe()
  }
}

class AsynchronousDataProcessor extends DataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.handlerFunction = this.handlerFunction.bind(this)
    this.onDeviceRawMessageProcessed = this.onDeviceRawMessageProcessed.bind(this)
    this.onDeviceRawMessageReady = this.onDeviceRawMessageReady.bind(this)
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

  async onDeviceRawMessageReady() {
    return Promise.resolve()
  }

  async onDeviceRawMessageProcessed() {
    await this.updateDeviceApiRawStatus('Processed')
    // TODO: Archive message?
    await this.unsubscribe()
  }
}

module.exports = {
  SynchronousDataProcessor,
  AsynchronousDataProcessor,
}
