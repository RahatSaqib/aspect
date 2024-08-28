const { expect } = require('chai')
const { createMessageQueue } = require('./messageQueue')

describe('Message Queue', () => {
  const queueName = 'testQueue'
  let messageQueue

  before(async () => {
    messageQueue = await createMessageQueue(queueName)
  })

  after(async () => {
    await messageQueue.close()
  })

  describe('add', () => {
    it('should add a job to the queue', async () => {
      const jobName = 'testJob'
      const jobData = { test: 'data' }
      const job = await messageQueue.add(jobName, jobData)
      expect(job.data.test).to.equal(jobData.test)
      expect(job.name).to.equal(jobName)
    })
  })
})
