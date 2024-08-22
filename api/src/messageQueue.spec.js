const { expect } = require('chai')
const { delay } = require('lodash')
const { createMessageQueue } = require('./messageQueue')

describe('Message Queue', () => {
  const queueName = 'testQueue'
  let messageQueue

  before(async () => {
    messageQueue = await createMessageQueue(queueName)
  })

  after(async () => {
    // await new Promise(resolve => delay(resolve, 1000))
    await messageQueue.close()
  })

  describe('addJob', () => {
    it('should add a job to the queue', async () => {
      const jobName = 'testJob'
      const jobData = { test: 'data' }
      const job = await messageQueue.addJob(jobName, jobData)
      expect(job.data.test).to.equal(jobData.test)
      expect(job.name).to.equal(jobName)
    })
  })
})
