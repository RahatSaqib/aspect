const { Queue, Worker } = require('bullmq')
const IORedis = require('ioredis')
const path = require('path')
const config = require('./config')
const logger = require('./shared/logger')

/**
 * At any point in time, only one instance of the MessageQueue class is created for a single queue. And it is exposed globally.
 */
const messageQueues = {}
const defaultQueueName = config.messageQueue.name
async function createMessageQueue(name) {
  if (!name) {
    throw new Error('Must specify unique queue name')
  }
  if (!messageQueues[name]) {
    messageQueues[name] = new MessageQueue(name)
  }
  return messageQueues[name]
}

class MessageQueue {
  /**
   * Constructs a new MessageQueue instance.
   *
   * @param {string} queueName - The name of the message queue.
   */
  constructor(queueName) {
    this.connection = new IORedis(config.redis.url, { maxRetriesPerRequest: null })

    this.queueName = queueName
    // useWorkerThreads: true options is used to launch node Worker Threads library for each queue processing job
    // Documentation here: https://docs.bullmq.io/guide/workers/sandboxed-processors#worker-threads
    this.queue = new Queue(queueName, {
      connection: this.connection,
      concurrency: 10,
      useWorkerThreads: true,
    })

    const processorFile = path.join(__dirname, 'mqProcessor.js')

    this.worker = new Worker(queueName, processorFile, { connection: this.connection })

    this.worker.on('completed', job => {
      logger.debug(`completed job: ${job.id} in ${this.queueName}`, { reLabel: 'aspect:mq:worker:completed' })
    })

    // Failed imply some issue with code that is running in the worker
    this.worker.on('failed', (job, err) => {
      logger.debug(`failed job: ${job.id} in ${this.queueName} with error: ${err.message}`, {
        meta: { stack: err.stack },
        reLabel: 'aspect:mq:worker:failed',
      })
    })

    // 'error' event is used to log connection issues: https://docs.bullmq.io/guide/going-to-production#log-errors
    this.queue.on('error', err => {
      logger.error(`Error in queue: ${err.message}`, { reLabel: 'aspect:mq:error' })
    })

    this.worker.on('error', err => {
      logger.error(`Error in worker: ${err.message}`, { reLabel: 'aspect:mq:worker:error' })
    })
  }

  /**
   * Method to add a job to the queue
   * @param {string} name - Name of the job
   * @param {object} data - Data to be processed
   */
  async add(name, data, options) {
    try {
      const job = await this.queue.add(name, data, {
        removeOnComplete: {
          age: 24 * 3600, // keep up to 24 hour
          count: 1000, // keep up to 1000 jobs
        },
        removeOnFail: {
          age: 24 * 3600, // keep up to 24 hours
        },
        ...options,
      })
      logger.debug(`Added job ${job.id} to the queue with options: ${options}`, { reLabel: 'aspect:mq:added' })
      return job
    } catch (err) {
      logger.error(`Error adding job to the queue: ${err.message}`, { reLabel: 'aspect:mq:error' })
      throw err
    }
  }

  async addScheduledJob(name, data, options) {
    if (!options?.repeat) {
      logger.error(`Error adding job to the queue because no repeat option is provided`, { reLabel: 'aspect:mq:error' })
      throw new Error('Must specify repeat options for scheduled job')
    }

    try {
      // Adding key: name to ensure the repeatable job is not added multiple times
      const job = await this.queue.add(name, data, { ...options, repeat: { ...options.repeat, key: name } })
      logger.debug(`Added scheduled job ${job.id} to the queue with options: ${JSON.stringify(options)}`, {
        reLabel: 'aspect:mq:scheduled',
      })
      return job
    } catch (err) {
      logger.error(`Error adding job to the queue: ${err.message}`, { reLabel: 'aspect:mq:error' })
      throw err
    }
  }

  /**
   * We can't add bulk repeatable jobs in BullMQ, so only one time jobs are supported here. API documentation here: https://api.docs.bullmq.io/types/v5.BulkJobOptions.html
   */
  async addBulkJobs(jobs) {
    if (jobs.some(job => job.options?.repeat)) {
      logger.error(`Error adding job to the queue because repeat option is provided`, { reLabel: 'aspect:mq:error' })
      throw new Error('Repeat options are not supported for bulk scheduled jobs')
    }
    try {
      const bulkQueueConfiguration = jobs.map(job => ({ name: job.name, data: job.data, options: job.options }))
      const scheduledJobs = await this.queue.addBulk(bulkQueueConfiguration)
      logger.debug(`Added scheduled jobs to the queue with options: ${JSON.stringify(bulkQueueConfiguration)}`, {
        reLabel: 'aspect:mq:bulkscheduled',
      })
      return scheduledJobs
    } catch (err) {
      logger.error(`Error adding job to the queue: ${err.message}`, { reLabel: 'aspect:mq:error' })
      throw err
    }
  }

  /**
   * Close the connections to the queue gracefully
   */
  async close() {
    logger.debug('Closing the queue connections', { reLabel: 'aspect:mq:close' })
    await this.worker.close()
    await this.queue.close()
    await this.connection.quit()
    delete messageQueues[this.queueName]
  }
}

function getMessageQueue(name = defaultQueueName) {
  return messageQueues[name]
}

const registerMessageQueue = async server => {
  try {
    await createMessageQueue(defaultQueueName)
    server.app.queue = getMessageQueue
  } catch (err) {
    logger.error(err)
  }
}

module.exports = { queue: getMessageQueue, registerMessageQueue }
