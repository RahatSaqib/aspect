const QUEUE_IDLE_TIME = 250
const QUEUE_TIMEOUT_TIME = 4000

const { createMessageQueue } = require('../../src/mq')

let sharedQueue = null
async function queueConnect() {
  if (sharedQueue == null) {
    sharedQueue = await createMessageQueue('aspect_test_device_api')
  }
  return sharedQueue
}

async function queuePurge() {
  const queue = await queueConnect()
  await queue.waitForIdle(QUEUE_IDLE_TIME)
  await queue.purge()
}

async function createMessageContext() {
  const queue = await queueConnect()
  return queue.createMessageContext()
}

async function waitForAction(predicate, timeout = QUEUE_TIMEOUT_TIME) {
  const queue = await queueConnect()
  return queue.waitForAction(predicate, timeout)
}

async function waitForIdle(idleTime = QUEUE_IDLE_TIME) {
  const queue = await queueConnect()
  return queue.waitForIdle(idleTime)
}

module.exports = {
  queueConnect,
  queuePurge,
  createMessageContext,
  waitForAction,
  waitForIdle,
}
