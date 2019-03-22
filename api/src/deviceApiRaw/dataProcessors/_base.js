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
    this.processRequest = this.processRequest.bind(this)
    this.deferProcessing = false
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
      dataProcessor: this.constructor.name,
      createdOn: utcNow,
      updatedOn: utcNow,
    })
    this.id = deviceApiRawId
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

  async start() {
    console.log(this.constructor.name, new Date(), 'Started')
    const deviceApiRawId = this.id
    try {
      const lockedId = await deviceApiRawStatusToId('Locked')
      const deviceApiRawRecord = await knex('DeviceApiRaw')
        .where('id', deviceApiRawId)
        .first()
      if (deviceApiRawRecord.deviceApiRawStatusId === lockedId) {
        throw Boom.locked(
          'The raw message record has already been locked for processing',
          { deviceApiRawId }
        )
      }
      await DataProcessor.updateDeviceApiRawStatus(deviceApiRawId, 'Locked')

      // TODO: Unsubscribe and destroy listener after process?
      const handlerFunction = this.deferProcessing
        ? async () => {
            console.log(this.constructor.name, new Date(), 'Handle Started')
            this.messageContext.deviceRawMessageResponseReady(
              this.id,
              this.getResponse()
            )
            console.log(this.constructor.name, new Date(), 'Response Ready')
            await this.processRequest()
            this.messageContext.deviceRawMessageProcessed(this.id)
            console.log(this.constructor.name, new Date(), 'Data Processed')
          }
        : async () => {
            console.log(this.constructor.name, new Date(), 'Handle Started')
            await this.processRequest()
            this.messageContext.deviceRawMessageResponseReady(
              this.id,
              this.getResponse()
            )
            console.log(this.constructor.name, new Date(), 'Response Ready')
            this.messageContext.deviceRawMessageProcessed(this.id)
            console.log(this.constructor.name, new Date(), 'Data Processed')
          }
      const isActionForThisInstance = action =>
        action.deviceApiRawId === deviceApiRawId
      this.messageContext.queue.subscribe('deviceApiRaw', [
        {
          actions: {
            DEVICE_RAW_MESSAGE_POSTED: {
              handlerFunction,
              shouldHandle: isActionForThisInstance,
            },
          },
        },
      ])
      this.messageContext.deviceRawMessagePosted(deviceApiRawId)
    } catch (error) {
      this.messageContext.deviceRawMessageError(deviceApiRawId, error)
    }
  }

  getResponse() {
    return this.id
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

module.exports = DataProcessor
