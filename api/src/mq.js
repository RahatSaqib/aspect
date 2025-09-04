const Promise = require('bluebird')
const _ = require('lodash')
const amqp = require('amqplib')
const {
  types: { isPromise },
} = require('util')
const EventEmitter = require('events')
const logger = require('./shared/logger')
const config = require('./config')
const { run, transact } = require('./db')
const { initDictionaryTables } = require('./shared/dictionary')

const exchange = 'aspect'

async function createMessageQueue(name) {
  if (name == null) {
    throw new Error('Must specify unique queue name')
  }
  return new MessageQueue(name).connect()
}

class MessageQueue {
  constructor(name) {
    this.name = name
    this.emitter = new EventEmitter()
    this.queues = []
    this.queueEmitActions = null
    this.messageContextIdx = 0
    this.channel = null
    this.unsubscribe = this.unsubscribe.bind(this)
  }

  async connect() {
    if (!this.channel) {
      logger.debug(`connect ${this.name}`, { reLabel: 'aspect:mq:connect' })
      const connection = await amqp.connect(config.amqp.url)
      const channel = await connection.createChannel()
      await channel.assertExchange(exchange, 'topic', { durable: true })
      // Do not deliver next message until ack previous per subscriber
      await channel.prefetch(1, false)
      this.channel = channel
    }
    return this
  }

  async purge() {
    if (this.channel) {
      logger.debug(`purge ${this.name}`, { reLabel: 'aspect:mq:purge' })
      return Promise.all(this.queues.map(queue => this.channel.purgeQueue(queue)))
    }
  }

  async purgeQueues(queueNameRegex) {
    if (this.channel) {
      const queuestoPurge = this.queues.filter(queue => queueNameRegex.test(queue))
      queuestoPurge.forEach(queue => {
        logger.debug(`purgeQueue ${queue}`, { reLabel: 'aspect:mq:purgeQueue' })
        this.channel.purgeQueue(queue)
      })
    }
  }

  async close() {
    logger.debug(`close ${this.name}`, { reLabel: 'aspect:mq:close' })
    if (this.channel) {
      await this.purge()
      await this.channel.close()
    }
    this.channel = null
    this.queues = []
    this.queueEmitActions = null
    this.emitter.removeAllListeners()
  }

  /**
   * Dispatch an action created by an action creator
   */
  dispatch(action, bindingKey, options) {
    if (!_.isString(action.type)) {
      throw new Error('Actions must be object with string type')
    }
    const message = JSON.stringify(action)
    const topic = bindingKey ? `aspect.actions.${action.type}.${bindingKey}` : `aspect.actions.${action.type}`
    logger.debug(`dispatch ${this.name} ${message}`, {
      reLabel: 'aspect:mq:dispatch',
    })
    this.channel.publish(exchange, topic, Buffer.from(message), options)
  }

  /**
   * Subscribes to messages with the named service.
   *
   * This can be a single subscription, an array, a function,
   * or a promise, or some combination of the above (e.g an
   * async function returning an array to allow dynamic loading).
   *
   * Eventually accepts an object, with the following properties:
   *
   * actions: map Action Type name to listener function that
   *   accepts incoming actions of that type.
   *
   *   The listener will be called with the action and
   *   new message context created from this queue.
   *
   *   Can specify multiple action types per subscription.
   */
  async subscribe(name, subscriptions, messageTtl) {
    if (_.isFunction(subscriptions)) {
      const subscribeName = `${this.name}_${name}_subscribe`
      const messageContext = this.createMessageContext(subscribeName)
      await this.subscribe(name, subscriptions({ messageContext }))
    } else if (isPromise(subscriptions)) {
      /**
       * ^^^
       * use `isPromise` from standard node.js library `util`, instead of
       * checking `subscriptions.then` with _.isFunction(subscriptions.then)
       */
      const subs = await subscriptions
      await this.subscribe(name, subs)
    } else if (_.isArray(subscriptions)) {
      await Promise.each(subscriptions, (subscription, subscriptionIndex) =>
        this.subscribe(`${name}_${subscriptionIndex}`, subscription)
      )
    } else {
      await Promise.each(_.keys(subscriptions.actions), async type => {
        const messageHandler = subscriptions.actions[type]
        await this.subscribeSingleAction(name, messageTtl, messageHandler, type)
      }).catch(err => logger.error(err))
    }
  }

  async subscribeSingleAction(name, messageTtl, messageHandler, type) {
    let handlerFunction = async () => Promise.resolve()
    let shouldHandle = () => true
    let consumeOptions
    let bindingKey = ''
    let purgeOnStart = false
    if (_.isFunction(messageHandler)) {
      handlerFunction = messageHandler
    } else {
      ;({ handlerFunction } = messageHandler)
      if (messageHandler.shouldHandle) {
        ;({ shouldHandle } = messageHandler)
      }
      if (messageHandler.consumerTag) {
        consumeOptions = {
          consumerTag: messageHandler.consumerTag,
        }
      }
      if (messageHandler.allowInfiniteListeners) {
        const maxListeners = this.emitter.getMaxListeners()
        if (maxListeners > 0) {
          this.emitter.setMaxListeners(0)
        }
      }
      if (messageHandler.bindingKey) {
        bindingKey = `.${messageHandler.bindingKey}`
      }
      if (messageHandler.purgeOnStart) {
        purgeOnStart = true
      }
    }
    const { name: queueName } = this
    const subscribeName = `${queueName}_${name}_actions_${type}`
    const topic = `aspect.actions.${type}${bindingKey}`
    logger.debug(`subscribe ${subscribeName} ${topic}`, {
      reLabel: 'aspect:mq:subscribe',
    })
    const queueOptions = messageTtl ? { messageTtl } : undefined
    const { queue } = await this.channel.assertQueue(subscribeName, queueOptions)

    if (!this.queues.includes(queue)) this.queues.push(queue)
    await this.channel.bindQueue(queue, exchange, topic)
    if (purgeOnStart) {
      await this.channel.purgeQueue(queue)
    }
    await this.channel.consume(
      queue,
      async message => {
        if (!message) return
        const content = message.content.toString()
        const messageContext = this.createMessageContext(subscribeName)
        const action = JSON.parse(content)
        logger.debug(`consume ${messageContext.id} ${content}`, {
          reLabel: 'aspect:mq:consume',
        })
        if (shouldHandle(action)) {
          Promise.resolve(handlerFunction(action, { messageContext }))
            .then(() => {
              // Do not ack until handlerFunction result resolves
              // Allows backpressure per consumer, if this is not needed can
              // return something (or nothing) that resolves immediately
              logger.debug(`ack ${messageContext.id}`, {
                reLabel: 'aspect:mq:ack',
              })
              this.channel.ack(message)
            })
            .catch(err => {
              logger.error(err, { reLabel: 'aspect:mq:error' })
              // TODO nack/dead letter queue?
              this.channel.ack(message)
            })
        } else {
          this.channel.nack(message)
        }
      },
      consumeOptions
    )
  }

  async unsubscribe(queueName) {
    const regex = `_${queueName.toLowerCase()}_.*_actions_`
    const re = new RegExp(regex)
    const selectedQueries = _.filter(this.queues, q => re.test(q))
    await Promise.each(selectedQueries || [], async q => {
      const { queue } = await this.channel.assertQueue(q)
      if (queue) {
        await this.channel.unbindQueue(queue, exchange, 'aspect.actions.#')
        await this.channel.deleteQueue(q)

        _.remove(this.queues, q => re.test(q))
      }
    })
  }

  async subscribeEmitActions() {
    if (this.queueEmitActions == null) {
      logger.debug('subscribeEmitActions', {
        reLabel: 'aspect:mq:subscribeEmitActions',
      })
      const { channel } = this
      const { queue } = await channel.assertQueue('', { exclusive: true })
      this.queueEmitActions = queue
      this.queues.push(queue)
      await channel.bindQueue(queue, exchange, 'aspect.actions.#')
      await channel.consume(queue, message => {
        const content = message.content.toString()
        const action = JSON.parse(content)
        this.emitter.emit('action', action)
        this.channel.ack(message)
      })
    }
  }

  /**
   * Creates a message context to allow transactional
   * updates and dispatch.
   *
   * You should normally deal with a provided context
   * pre-created on request/response cycle.
   *
   * actionCreators: if specified, context will have
   * bound actions with same name as action creators
   */
  createMessageContext(id) {
    const contextId = `${id != null ? id : this.name}_${this.messageContextIdx}`
    this.messageContextIdx += 1
    return new MessageContext(this, contextId)
  }

  /**
   * Creates a listener that waits for an action
   * passing the given predicate and returns a
   * Promise that resolves with the action.
   *
   * predicate: rules for predicate follow the
   * same rules * as lodash (see _.iteratee)
   * timeout: if specified, promise will be
   * rejected if action does not occur before
   * timeout in millis.
   *
   * NOTE: It is generally preferred to avoid
   * relying on this function and create additional
   * action creators. This is mainly exposed for
   * testing.
   */
  async waitForAction(predicate, timeout = null, timeoutMessage = null) {
    await this.subscribeEmitActions()
    return new Promise((resolve, reject) => {
      if (_.isPlainObject(predicate)) {
        // Only constrain on values that are defined
        // This allows action creator with optional
        // values to pass iteratee test
        predicate = _.omitBy(predicate, _.isUndefined)
      }

      /**
       * if 'predicate' is plain object (it may also be an array or string)
       * then stringify it first and then restore.
       * This is needed because in `dispatch()` func we stringify message
       * before publishing it into the channel. And then event emitter listener
       * parses such stringified object and some prop values (i.e. dates, etc)
       * remain strings. So, here to let `_.iteratee` correctly compare values
       * we need to make sure our awaitable action (i.e. `predicate`)
       * exactly match emitted one.
       */
      const awaitableAction = _.isPlainObject(predicate) ? JSON.parse(JSON.stringify(predicate)) : predicate
      const check = _.iteratee(awaitableAction)
      const checkedListener = action => {
        if (check(action)) {
          logger.debug(`waitForAction resolve ${JSON.stringify(action)}`, {
            reLabel: 'aspect:mq',
          })
          dispose()
          resolve(action)
        }
      }

      let timeoutId = null
      if (timeout != null) {
        timeoutId = setTimeout(() => {
          if (timeoutId != null) {
            dispose()
            const rejectMessage =
              timeoutMessage ||
              (_.isPlainObject(predicate)
                ? `waitForAction timeout ${JSON.stringify(predicate)}`
                : 'waitForAction timeout')
            logger.debug(rejectMessage, { reLabel: 'aspect:mq' })
            reject(new Error(rejectMessage))
          }
        }, timeout)
      }

      const dispose = () => {
        if (timeoutId != null) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        this.emitter.removeListener('action', checkedListener)
      }
      this.emitter.addListener('action', checkedListener)
    })
  }

  /**
   * Creates a listener that waits for the queue
   * to be idle for a certain time and returns
   * a promise that resolves when idle time has passed.
   *
   * idleTime: time in millis to determine queue is idle
   *
   * NOTE: It is generally preferred to avoid
   * relying on this function and create additional
   * action creators. This is mainly exposed for
   * testing.
   */
  async waitForIdle(idleTime) {
    await this.subscribeEmitActions()
    return new Promise(resolve => {
      let timeIdle = 0
      const clearTimeIdle = () => {
        timeIdle = 0
      }
      const idleTimeIncrement = idleTime / 10
      const idleIntervalId = setInterval(() => {
        timeIdle += idleTimeIncrement
        if (timeIdle >= idleTime) {
          logger.debug('waitForIdle resolve', { reLabel: 'aspect:mq' })
          clearInterval(idleIntervalId)
          this.emitter.removeListener('action', clearTimeIdle)
          resolve()
        }
      }, idleTimeIncrement)
      this.emitter.addListener('action', clearTimeIdle)
    })
  }
}

class MessageContext {
  constructor(queue, id) {
    this.queue = queue
    this.id = id
    _.bindAll(this, ['dispatch', 'transact', 'rollback', 'commit', 'clone'])
    this.transaction = null
    this.actions = []
    this.isFinalState = false
  }

  async initDictionaryTables() {
    await initDictionaryTables()
  }

  clone() {
    return new MessageContext(this.queue, `${this.id} clone`)
  }

  dispatch(action, bindingKey) {
    if (this.isFinalState) {
      throw new Error('Cannot dispatch after final state, create new context')
    }

    if (this.transaction) {
      // Queue actions until transaction committed
      logger.debug(`dispatch delay ${this.id} ${JSON.stringify(action)} for ${bindingKey}`, { reLabel: 'aspect:mq' })
      this.actions.push({ action, bindingKey })
    } else {
      // transaction complete, dispatch to MQ
      logger.debug(`dispatch ${this.id} ${JSON.stringify(action)} for ${bindingKey}`, { reLabel: 'aspect:mq' })
      this.queue.dispatch(action, bindingKey)
    }
  }

  transact(task) {
    if (this.transaction) {
      throw new Error('Cannot create multiple transactions, create new context')
    }
    this.transaction = transact(async knex => task(knex))
      .then(this.commit)
      .then(null, err => {
        logger.error(err, { reLabel: 'aspect:mq:transact' })
        this.rollback()
        throw err
      })
    return this.transaction
  }

  run(task) {
    return run(async knex => task(knex))
  }

  commit() {
    if (this.isFinalState) {
      throw new Error('Cannot commit after final state, create new context')
    }
    logger.debug(`commit ${this.id}`, { reLabel: 'aspect:mq' })
    this.transaction = null
    this.actions.forEach(({ action, bindingKey }) => this.dispatch(action, bindingKey))
    this.isFinalState = true
  }

  rollback() {
    logger.debug(`rollback ${this.id}`, { reLabel: 'aspect:mq' })
    if (this.isFinalState) {
      throw new Error('Cannot rollback after final state, create new context')
    }
    this.transaction = null
    this.isFinalState = true
  }

  bindActionCreators(creators, bindingKey) {
    _.each(creators, (creator, name) => {
      this[name] = (...args) => this.dispatch(creator(...args), bindingKey)
      this[name].bind(this)
    })
    return this
  }
}

module.exports = { createMessageQueue }
