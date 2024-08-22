const { Queue, Worker } = require('bullmq')
const IORedis = require('ioredis')
const path = require('path')
const config = require('./config')
const logger = require('./shared/logger')

async function createMessageQueue(name) {
  if (!name) {
    throw new Error('Must specify unique queue name')
  }
  return new MessageQueue(name)
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
    this.queue = new Queue(queueName, { connection: this.connection, concurrency: 10 })

    const processorFile = path.join(__dirname, 'mqProcessor.js')

    this.worker = new Worker(queueName, processorFile, { connection: this.connection, concurrency: 10 })

    this.worker.on('completed', job => {
      logger.debug(`completed job: ${job.id} in ${this.queueName}`, { reLabel: 'aspect:mq:completed' })
    })

    this.worker.on('failed', (job, err) => {
      logger.debug(`failed job: ${job.id} in ${this.queueName} with error: ${err.message}`, {
        reLabel: 'aspect:mq:failed',
      })
    })
  }

  /**
   * Method to add a job to the queue
   * @param {string} name - Name of the job
   * @param {object} data - Data to be processed
   */
  async addJob(name, data, options) {
    try {
      const job = await this.queue.add(name, data, options)
      logger.debug(`Added job ${job.id} to the queue with options: ${options}`, { reLabel: 'aspect:mq:added' })
      return job
    } catch (err) {
      logger.error(`Error adding job to the queue: ${err.message}`, { reLabel: 'aspect:mq:error' })
    }
  }

  async addScheduledJob(name, data, options) {
    if (!options?.repeat) {
      throw new Error('Must specify repeat options for scheduled job')
    }

    try {
      const job = await this.queue.add(name, data, options)
      logger.debug(`Added scheduled job ${job.id} to the queue with options: ${options}`, {
        reLabel: 'aspect:mq:scheduled',
      })
      return job
    } catch (err) {
      logger.error(`Error adding job to the queue: ${err.message}`, { reLabel: 'aspect:mq:error' })
    }
  }

  async addScheduledJobs(jobs) {
    try {
      const bulkQueueConfiguration = jobs.map(job => ({ name: job.name, data: job.data, options: job.options }))
      const scheduledJobs = await this.queue.addBulk(bulkQueueConfiguration)
      logger.debug(`Added scheduled jobs to the queue with options: ${bulkQueueConfiguration}`, {
        reLabel: 'aspect:mq:bulkscheduled',
      })
      return scheduledJobs
    } catch (err) {
      logger.error(`Error adding job to the queue: ${err.message}`, { reLabel: 'aspect:mq:error' })
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
  }
}

module.exports = { createMessageQueue }
